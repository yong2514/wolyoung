// 개발 확인용: 게임을 열고 몇 초마다 값을 찍는다 (먼저 npm run build)
// node scripts/probe.mjs "<?값>" <초> "<식, S = 게임 장면>" [시작 때 실행할 코드]
import { preview } from 'vite';
import { chromium } from 'playwright';

const [query = '', secs = '60', expr = 'S.clock.now', init = ''] = process.argv.slice(2);
const server = await preview({ preview: { port: 4185, host: '127.0.0.1', strictPort: true } });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on('pageerror', (e) => console.error('페이지 오류:', e.message));
  await page.goto(`http://127.0.0.1:4185/wolyoung/${query}`);
  await page.waitForFunction(() => window.__wolyoung?.ready);
  const S = "window.__wolyoung.game.scene.getScene('Game')";
  if (init) await page.evaluate(`{ const S = ${S}; ${init} }`);
  const end = Date.now() + Number(secs) * 1000;
  while (Date.now() < end) {
    await page.waitForTimeout(3000);
    const v = await page.evaluate(`(() => { const S = ${S}; return ${expr}; })()`);
    console.log(JSON.stringify(v));
    if (await page.evaluate(() => !!window.__wolyoung.result)) break;
  }
} finally {
  await browser.close();
  await server.close();
}
