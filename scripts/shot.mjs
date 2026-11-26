// 개발 확인용 화면 사진: node scripts/shot.mjs <출력.png> "<주소 뒤 ?값>" <기다릴 ms> ["게임 안 코드"]
// (먼저 npm run build 필요)
import { preview } from 'vite';
import { chromium } from 'playwright';

const [out, query = '', wait = '3000'] = process.argv.slice(2);
const server = await preview({ preview: { port: 4181, host: '127.0.0.1', strictPort: true } });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on('pageerror', (e) => console.error('페이지 오류:', e.message));
  page.on('console', (m) => { if (m.text().startsWith('[확인]')) console.log(m.text()); }); // 게임 안 코드의 console.log('[확인] …')
  await page.goto(`http://127.0.0.1:4181/wolyoung/${query}`);
  // 4번째 값: 사진 찍기 1초 전에 게임 안에서 실행할 코드 (예: "S.leveling.pending=1", S = 게임 장면)
  const js = process.argv[5];
  if (js) {
    await page.waitForTimeout(Math.max(0, Number(wait) - 1000));
    await page.evaluate(`{ const S = window.__wolyoung.game.scene.getScene('Game'); ${js} }`);
    await page.waitForTimeout(Number(process.argv[6] ?? 1000)); // 5번째 값: 코드 실행 뒤 더 기다릴 ms
  } else {
    await page.waitForTimeout(Number(wait));
  }
  await page.screenshot({ path: out });
  console.log('저장:', out);
} finally {
  await browser.close();
  await server.close();
}
