// npm run check: 빌드된 게임을 화면 없는 브라우저로 열어 오류가 없는지 본다.
// (1단계부터 ?debug=1&auto=1 자동 플레이 한 판으로 넓힌다.)
import { preview } from 'vite';
import { chromium } from 'playwright';

const server = await preview({ preview: { port: 4179, host: '127.0.0.1' } });
const url = 'http://127.0.0.1:4179/wolyoung/';
const problems = [];

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on('pageerror', (e) => problems.push('페이지 오류: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') problems.push('콘솔 오류: ' + m.text()); });
  await page.goto(url);
  await page.waitForFunction(() => window.__wolyoung && window.__wolyoung.ready, null, { timeout: 15000 });
  await page.waitForTimeout(1000);
  const errors = await page.evaluate(() => window.__wolyoung.errors);
  if (errors) problems.push(`게임 안 오류 ${errors}개`);
  if (process.env.SHOT) await page.screenshot({ path: process.env.SHOT }); // 확인용 화면 사진
} catch (e) {
  problems.push('점검 실패: ' + e.message);
} finally {
  await browser.close();
  await server.close();
}

if (problems.length) {
  console.error('[점검 실패]\n' + problems.join('\n'));
  process.exit(1);
}
console.log('[점검 통과] 오류 0');
