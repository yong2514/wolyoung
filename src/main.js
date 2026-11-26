import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from './config/display.js';
import { BootScene } from './scenes/BootScene.js';
import { GameScene } from './scenes/GameScene.js';
import { sfx } from './systems/audio.js';

// 자동 점검(scripts/check.mjs)이 읽는 값
window.__wolyoung = { errors: 0, ready: false, result: null };
window.addEventListener('error', () => { window.__wolyoung.errors += 1; });
window.addEventListener('unhandledrejection', () => { window.__wolyoung.errors += 1; });

// 길게 누르기 메뉴·두 손가락 확대를 한 번 더 막는다 (CSS만으로 안 막히는 브라우저용)
window.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('gesturestart', (e) => e.preventDefault());

// 소리는 첫 터치 때 켠다 (모바일 자동 재생 제한). 돌아온 뒤에도 터치하면 다시 켠다.
const unlock = () => sfx.unlock();
window.addEventListener('pointerdown', unlock, { passive: true });
window.addEventListener('touchend', unlock, { passive: true });

window.__wolyoung.game = new Phaser.Game({
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
  audio: { noAudio: true }, // 소리는 systems/audio.js가 직접 만든다
  input: { activePointers: 2 },
  banner: false,
  scene: [BootScene, GameScene],
});
