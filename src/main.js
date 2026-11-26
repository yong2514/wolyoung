import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from './config/display.js';
import { TitleScene } from './scenes/TitleScene.js';

// 길게 누르기 메뉴·두 손가락 확대를 한 번 더 막는다 (CSS만으로 안 막히는 브라우저용)
window.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('gesturestart', (e) => e.preventDefault());

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: COLORS.night,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  physics: { default: 'arcade', arcade: { debug: false } },
  input: { activePointers: 2 },
  scene: [TitleScene],
});

// 자동 점검(scripts/check.mjs)이 읽는 값
window.__wolyoung = { game, errors: 0, ready: false };
window.addEventListener('error', () => { window.__wolyoung.errors += 1; });
