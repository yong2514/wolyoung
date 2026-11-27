// npm run check: 빌드된 게임을 화면 없는 브라우저(Playwright)로 열어 점검한다.
//  1) 자동 플레이 한 판 (4배속) — 오류가 하나라도 있으면 실패. 같은 시드로 한 번 더 → 결과가 같아야 함
//  2) 성능: 잡귀 150마리를 유지하며 20초 (실제 속도) — 평균 프레임 표시
// SHOT=<경로>를 주면 첫 판 끝 화면을 사진으로 남긴다.
import { preview } from 'vite';
import { chromium } from 'playwright';

const PORT = 4179;
const BASE = `http://127.0.0.1:${PORT}/wolyoung/`;
const FPS_GOAL = 50;

const server = await preview({ preview: { port: PORT, host: '127.0.0.1', strictPort: true } });
const browser = await chromium.launch();
const problems = [];

async function runOnce(name, query, timeoutMs, shot) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  page.on('pageerror', (e) => errs.push('페이지 오류: ' + e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errs.push('콘솔 오류: ' + m.text());
    if (m.text().startsWith('[자동점검]')) console.log(`  ${name}: ${m.text()}`);
  });
  try {
    await page.goto(BASE + query);
    await page.waitForFunction(() => window.__wolyoung && window.__wolyoung.result, null, { timeout: timeoutMs, polling: 500 });
    const r = await page.evaluate(() => window.__wolyoung.result);
    if (shot) await page.screenshot({ path: shot });
    if (r.errors) errs.push(`게임 안 오류 ${r.errors}개`);
    return r;
  } catch (e) {
    errs.push('점검 실패: ' + e.message.split('\n')[0]);
    return null;
  } finally {
    problems.push(...errs.map((e) => `[${name}] ${e}`));
    await page.close();
  }
}

try {
  const a = await runOnce('자동 플레이', '?debug=1&auto=1&seed=12345', 240000, process.env.SHOT);
  const b = await runOnce('같은 시드 다시', '?debug=1&auto=1&seed=12345', 240000);
  const sig = (r) => r && `${r.timeSec}/${r.kills}/${r.maxEnemies}/${r.level}/${r.spells}/${r.reason}`;
  if (a && b && sig(a) !== sig(b)) problems.push(`[같은 시드] 결과가 다름: ${sig(a)} ≠ ${sig(b)}`);
  // '20초 안 첫 카드'는 첫 판 각본 조건(아래에서 확인). 일반 판(무작위 이동)은 25초 안
  if (a && (a.firstCardSec === null || a.firstCardSec > 25)) problems.push(`[자동 플레이] 첫 카드 ${a.firstCardSec}초 (25초 안이어야 함)`);
  // 한 판 끝까지 (무적): 60초 안에 축기 돌파, 장소 4곳의 대형 요괴를 모두 쓰러뜨리고 클리어해야 함
  const wv = await runOnce('무적 한 판', '?debug=1&auto=1&god=1&speed=4&autoMax=900&seed=21', 420000);
  if (wv && (wv.reason !== '클리어' || wv.place !== 4)) problems.push(`[무적 한 판] 끝: ${wv.reason}, 장소 ${wv.place} (장소 4에서 클리어여야 함)`);
  if (wv && !(wv.realmSecs[0] <= 60)) problems.push(`[무적 한 판] 축기 돌파 ${wv.realmSecs[0] ?? '없음'}초 (60초 안이어야 함)`);
  // 첫 판 각본: 첫 카드 20초 안·희귀 이상, 축기 60초 안, 봉인의 일격 → 각본 부활 → 클리어
  const fr = await runOnce('첫 판 각본', '?debug=1&auto=1&first=1&speed=4&autoMax=900', 420000);
  if (fr) {
    if (fr.reason !== '클리어') problems.push(`[첫 판 각본] 끝: ${fr.reason} (클리어여야 함)`);
    if (!fr.sealStruck || !fr.scriptRevived) problems.push('[첫 판 각본] 봉인의 일격·각본 부활이 일어나지 않음');
    if (!(fr.firstCardSec <= 20) || !fr.firstCardRare) problems.push(`[첫 판 각본] 첫 카드 ${fr.firstCardSec}초·희귀 ${fr.firstCardRare}`);
    if (!(fr.realmSecs[0] <= 60)) problems.push(`[첫 판 각본] 축기 돌파 ${fr.realmSecs[0] ?? '없음'}초`);
  }
  // 첫 판에서 가만히 서 있어도 죽지 않고 대형 요괴까지 간다
  const st = await runOnce('첫 판 가만히', '?debug=1&auto=1&first=1&still=1&speed=4&autoMax=80', 300000);
  if (st && (!st.bossesSeen || st.revives > 0 || st.reason === '사망')) problems.push(`[첫 판 가만히] 대형 요괴까지 못 감 (${st.reason}, ${st.timeSec}초)`);
  await runOnce('합일 4종', '?debug=1&auto=1&god=1&fusions=1&fill=100&speed=4&autoMax=40&seed=3', 120000);
  const perf = await runOnce('성능 150마리', '?debug=1&auto=1&god=1&fill=150&speed=1&autoMax=20&seed=7', 90000);
  if (perf && perf.avgFps < FPS_GOAL) problems.push(`[성능 150마리] 평균 프레임 ${perf.avgFps} (목표 ${FPS_GOAL} 이상)`);
} finally {
  await browser.close();
  await server.close();
}

if (problems.length) {
  console.error('[점검 실패]\n' + problems.join('\n'));
  process.exit(1);
}
console.log('[점검 통과] 오류 0');
