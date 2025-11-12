// OpenDART 호출 + 레이트리미터 공용 유틸
import axios from 'axios';
import Bottleneck from 'bottleneck';

const API = 'https://opendart.fss.or.kr/api';
const KEY = process.env.DART_API_KEY;

// 분당 90회로 안전하게
const limiter = new Bottleneck({
  minTime: 750,
  reservoir: 90,
  reservoirRefreshAmount: 90,
  reservoirRefreshInterval: 60_000
});

async function call(endpoint, params = {}, timeout = 15000) {
  return limiter.schedule(() =>
    axios.get(`${API}/${endpoint}`, {
      params: { crtfc_key: KEY, ...params },
      timeout
    })
  );
}

export async function getFnlttSinglAcntAll({ corp_code, bsns_year, reprt_code = '11014', fs_div = 'CFS' }) {
  const res = await call('fnlttSinglAcntAll.json', { corp_code, bsns_year, reprt_code, fs_div });
  const data = res.data;
  if (data?.status && data.status !== '000' && data.status !== '013') {
    const err = new Error(`DART fnlttSinglAcntAll status=${data.status} message=${data.message}`);
    err.response = { data };
    throw err;
  }
  return data;
}

export async function getCompanyOutline({ corp_code }) {
  const res = await call('companyOutline.json', { corp_code });
  const data = res.data;
  if (data?.status && data.status !== '000' && data.status !== '013') {
    const err = new Error(`DART companyOutline status=${data.status} message=${data.message}`);
    err.response = { data };
    throw err;
  }
  return data;
}
