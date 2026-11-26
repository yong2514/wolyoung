import { GAME_WIDTH as W, GAME_HEIGHT as H, FONT } from '../config/display.js';
import { makeButton } from './button.js';

const TAP_DELAY = 400; // 화면이 뜨고 0.4초 뒤부터 눌림

function dim(scene, alpha = 0.72) {
  return scene.add.rectangle(0, 0, W, H, 0x0b0f26, alpha).setOrigin(0).setScrollFactor(0).setDepth(300);
}

function label(scene, y, str, size, color = '#dfe4f2') {
  return scene.add.text(W / 2, y, str, { fontFamily: FONT, fontSize: size, fontStyle: 'bold', color, align: 'center' })
    .setOrigin(0.5).setScrollFactor(0).setDepth(305);
}

export function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/** 판의 끝(쓰러짐·봉인 성공·봉인석 붕괴): "다시 도전"을 가장 크게, 엄지 자리에. 결과 화면은 5단계에서 */
export function showGameOver(scene, info, onRetry) {
  const parts = [dim(scene, 0.0)];
  scene.tweens.add({ targets: parts[0], fillAlpha: 0.75, duration: 400 });
  parts.push(label(scene, H * 0.3, info.title ?? '쓰러졌다…', '40px', info.color ?? '#dfe4f2'));
  if (info.sub) parts.push(label(scene, H * 0.3 + 48, info.sub, '17px', '#dfe4f2'));
  parts.push(label(scene, H * 0.3 + (info.sub ? 86 : 60), `버틴 시간 ${formatTime(info.timeMs)}  ·  처치 ${info.kills}`, '18px', '#b9a6e8'));
  parts.push(makeButton(scene, W / 2, H - 140, W - 60, 88, '다시 도전', onRetry, { fontSize: '32px', delayMs: TAP_DELAY }));
  return { destroy() { parts.forEach((p) => p.destroy()); } };
}

export function showPause(scene, onResume) {
  const parts = [dim(scene)];
  parts.push(label(scene, H * 0.32, '일시정지', '36px'));
  parts.push(makeButton(scene, W / 2, H - 180, W - 100, 76, '계속하기', onResume, { fontSize: '26px', delayMs: TAP_DELAY }));
  return { destroy() { parts.forEach((p) => p.destroy()); } };
}

/** 3, 2, 1을 센 뒤 done() */
export function runCountdown(scene, done) {
  const t = label(scene, H * 0.4, '3', '96px');
  let n = 3;
  scene.time.addEvent({
    delay: 1000,
    repeat: 2,
    callback: () => {
      n--;
      if (n > 0) t.setText(String(n));
      else { t.destroy(); done(); }
    },
  });
}
