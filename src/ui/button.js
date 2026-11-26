import { FONT } from '../config/display.js';

// 화면에 고정된 버튼. delayMs 동안은 눌리지 않는다 (드래그하던 손가락 오터치 방지).
export function makeButton(scene, x, y, w, h, label, onClick, opts = {}) {
  const depth = opts.depth ?? 310;
  const bg = scene.add.rectangle(x, y, w, h, opts.fill ?? 0x2a3370, 1)
    .setStrokeStyle(2, 0xb9a6e8, 0.9).setScrollFactor(0).setDepth(depth);
  const text = scene.add.text(x, y, label, {
    fontFamily: FONT, fontSize: opts.fontSize ?? '24px', fontStyle: 'bold', color: '#dfe4f2',
  }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1);

  let enabled = !opts.delayMs;
  if (!enabled) {
    bg.setAlpha(0.6);
    text.setAlpha(0.6);
    scene.time.delayedCall(opts.delayMs, () => { enabled = true; bg.setAlpha(1); text.setAlpha(1); });
  }
  bg.setInteractive();
  let pressed = false;
  bg.on('pointerdown', () => { if (enabled) { pressed = true; bg.setFillStyle(0x3d4aa0); } });
  bg.on('pointerout', () => { pressed = false; bg.setFillStyle(opts.fill ?? 0x2a3370); });
  bg.on('pointerup', () => {
    if (!enabled || !pressed) return;
    pressed = false;
    bg.setFillStyle(opts.fill ?? 0x2a3370);
    onClick();
  });

  return { bg, text, destroy() { bg.destroy(); text.destroy(); } };
}
