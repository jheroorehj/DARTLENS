import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getFnlttSinglAcntAll } from '../src/services/dartService.js';
import { extractIssuedShares } from '../src/services/normalization.js';

const REPRT_PRIORITY = ['11014', '11013', '11012', '11011'];

function latestFiscalYear() {
  const now = new Date();
  return now.getMonth() <= 2 ? now.getFullYear() - 1 : now.getFullYear();
}

function buildYears(n = 4) {
  const last = latestFiscalYear();
  const count = Math.max(1, Math.min(10, Number(n) || 4));
  return Array.from({ length: count }, (_, idx) => String(last - (count - 1) + idx));
}

function parseYearsList(input) {
  if (!input) return [];
  return input
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);
}

function normalizeName(value) {
  return value ? String(value).replace(/\s+/g, '').toLowerCase() : '';
}

function padStockCode(value) {
  if (!value) return null;
  const digits = String(value).padStart(6, '0');
  return /^\d{6}$/.test(digits) ? digits : null;
}

function parseBigInt(value) {
  if (value === null || value === undefined) return null;
  const cleaned = String(value).replace(/,/g, '');
  if (cleaned === '' || Number.isNaN(Number(cleaned))) return null;
  try {
    return BigInt(cleaned);
  } catch {
    return null;
  }
}

function findAmount(list, { ids = [], names = [] }) {
  if (!Array.isArray(list) || list.length === 0) return null;

  const prefer = list.filter(item => item.account_detail === '-' || item.account_detail === undefined);
  const source = prefer.length ? prefer : list;

  for (const id of ids) {
    const hit = source.find(item => item.account_id === id);
    if (hit) return parseBigInt(hit.thstrm_amount);
  }

  for (const nm of names) {
    const target = normalizeName(nm);
    const hit = source.find(item => normalizeName(item.account_nm) === target);
    if (hit) return parseBigInt(hit.thstrm_amount);
  }

  return null;
}

function extractKeyFigures(list) {
  const revenue = findAmount(list, {
    ids: ['ifrs-full_Revenue', 'ifrs_Revenue'],
    names: ['매출액', '영업수익', '수익']
  });

  const operatingProfit = findAmount(list, {
    ids: ['dart_OperatingIncomeLoss'],
    names: ['영업이익', '영업손익']
  });

  const netIncome = findAmount(list, {
    ids: ['ifrs-full_ProfitLoss', 'ifrs_ProfitLoss'],
    names: ['당기순이익', '연결당기순이익', '지배기업의소유주에게귀속되는당기순이익']
  });

  return { revenue, operatingProfit, netIncome };
}

function parseBasicEps(list) {
  if (!Array.isArray(list) || list.length === 0) return null;

  const summaryLevel = list.filter(item => item.account_detail === '-' || item.account_detail === undefined);
  const candidates = summaryLevel.length ? summaryLevel : list;

  const TARGET_ACCOUNT_IDS = [
    'ifrs-full_BasicEarningsLossPerShare',
    'ifrs-full_BasicEarningsLossPerShareIncludingDiscontinuedOperations',
    'ifrs-full_BasicEarningsPerShare',
    'dart_BasicEarningsLossPerShare'
  ];
  const TARGET_NAMES = ['기본주당이익', '보통주기본주당이익', '기본주당순이익'];

  const byId = candidates.find(item => TARGET_ACCOUNT_IDS.includes(item.account_id));
  if (byId?.thstrm_amount !== undefined && byId?.thstrm_amount !== null) {
    const parsed = Number(String(byId.thstrm_amount).replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }

  for (const nm of TARGET_NAMES) {
    const hit = candidates.find(item => normalizeName(item.account_nm) === normalizeName(nm));
    if (hit?.thstrm_amount !== undefined && hit?.thstrm_amount !== null) {
      const parsed = Number(String(hit.thstrm_amount).replace(/,/g, ''));
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return null;
}

function formatBigInt(value) {
  return value === null || value === undefined ? null : value.toLocaleString('ko-KR');
}

function loadCorpCodes() {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const dataPath = path.join(currentDir, 'corpcodes_listed.json');
  const raw = fs.readFileSync(dataPath, 'utf8');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed.items)) {
    throw new Error('Invalid corpcodes_listed.json format: missing items');
  }
  return parsed.items;
}

function resolveCorpCode({ corpCode, stockCode, corpName }) {
  const corpList = loadCorpCodes();

  if (corpCode) return corpCode;

  const paddedStock = padStockCode(stockCode);
  if (paddedStock) {
    const hit = corpList.find(item => item.stock_code === paddedStock);
    if (hit) return hit.corp_code;
  }

  const normalizedName = normalizeName(corpName);
  if (normalizedName) {
    const hit = corpList.find(item => normalizeName(item.corp_name) === normalizedName);
    if (hit) return hit.corp_code;
  }

  throw new Error('corp_code is required. Provide --corp, or supply --stock or --name for lookup.');
}

async function fetchFinancialsForYear(corpCode, year, fsDiv = 'CFS') {
  for (const reprt of REPRT_PRIORITY) {
    try {
      const res = await getFnlttSinglAcntAll({
        corp_code: corpCode,
        bsns_year: year,
        reprt_code: reprt,
        fs_div: fsDiv
      });

      if (res?.status === '013' || !res?.list?.length) {
        continue;
      }

      return { list: res.list, reprt };
    } catch (error) {
      console.warn(`[Check] failed to fetch reprt_code=${reprt} for ${year}: ${error.message}`);
    }
  }

  return { list: null, reprt: null };
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    corpCode: null,
    stockCode: null,
    corpName: null,
    years: 4,
    fsDiv: 'CFS',
    yearsList: []
  };

  for (const arg of args) {
    if (arg.startsWith('--corp=')) opts.corpCode = arg.replace('--corp=', '').trim();
    else if (arg.startsWith('--stock=')) opts.stockCode = arg.replace('--stock=', '').trim();
    else if (arg.startsWith('--name=')) opts.corpName = arg.replace('--name=', '').trim();
    else if (arg.startsWith('--years=')) opts.years = Number(arg.replace('--years=', ''));
    else if (arg.startsWith('--years-list=')) opts.yearsList = parseYearsList(arg.replace('--years-list=', ''));
    else if (arg.startsWith('--fs-div=')) opts.fsDiv = arg.replace('--fs-div=', '').toUpperCase();
  }

  return opts;
}

async function main() {
  if (!process.env.DART_API_KEY) {
    console.error('❌ DART_API_KEY is not set. Set it in your environment before running this script.');
    process.exit(1);
  }

  const opts = parseArgs();
  const corpCode = resolveCorpCode(opts);
  const years = opts.yearsList.length ? opts.yearsList : buildYears(opts.years);

  console.log(`\n=== Fetching corp_code=${corpCode} for years: ${years.join(', ')} (fs_div=${opts.fsDiv}) ===`);

  for (const year of years) {
    const { list, reprt } = await fetchFinancialsForYear(corpCode, year, opts.fsDiv);

    if (!list || !reprt) {
      console.log(`\n[${year}] No financial data available.`);
      continue;
    }

    const figures = extractKeyFigures(list);
    const basicEps = parseBasicEps(list);
    const issuedShares = await extractIssuedShares(corpCode, year, reprt);
    const eps = figures.netIncome !== null && issuedShares !== null && issuedShares !== 0n
      ? Number(figures.netIncome) / Number(issuedShares)
      : null;

    console.log(`\n[${year}] reprt_code=${reprt}`);
    console.log(`  - Revenue:           ${formatBigInt(figures.revenue) ?? 'N/A'}`);
    console.log(`  - Operating Profit:  ${formatBigInt(figures.operatingProfit) ?? 'N/A'}`);
    console.log(`  - Net Income:        ${formatBigInt(figures.netIncome) ?? 'N/A'}`);
    console.log(`  - Basic EPS (DART):  ${basicEps !== null ? basicEps.toFixed(2) : 'N/A'}`);
    console.log(`  - Issued Shares:     ${formatBigInt(issuedShares) ?? 'N/A'}`);
    console.log(`  - EPS (computed):    ${eps !== null ? eps.toFixed(2) : 'N/A'}`);
  }
}

main().catch(err => {
  console.error('Unexpected failure while checking EPS:', err);
  process.exit(1);
});
