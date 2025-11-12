import cron from 'node-cron';
import { ingestForAllListed } from '../services/ingestReports.js';

// 매 분기 20일 새벽 2시: 연간/분기 리포트 인제스트(11014 기본)
// 0 2 20 1,4,7,10 *
cron.schedule('0 2 20 1,4,7,10 *', async () => {
  try {
    const r = await ingestForAllListed({ reprt_code: '11014', fs_div: 'CFS' });
    console.log('[cron] ingest done', r);
  } catch (e) {
    console.error('[cron] ingest error', e);
  }
});

// 필요 시 매일 새벽 3시 워치리스트 우선 처리 등 추가 가능
export function initSchedulers() {
  // 이 파일을 import 하기만 해도 위 스케줄이 등록됩니다.
  return true;
}
