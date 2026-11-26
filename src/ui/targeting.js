import { GAME_WIDTH as W, GAME_HEIGHT as H, FONT } from '../config/display.js';
import { makeButton } from './button.js';

// 멸요인 구역 고르기: 게임이 멈추고, 화면을 끌면 원이 따라 움직인다. '발동'하면 onFire(x, y) (월드 좌표)
export function startTargeting(scene, radius, onFire) {
  scene.state = 'target';
  scene.joystick.reset();
  const cam = scene.cameras.main;
  const view = { x0: cam.scrollX, y0: cam.scrollY };
  let cx = scene.player.x;
  let cy = scene.player.y;

  const objs = [];
  const add = (o) => { objs.push(o); return o; };
  add(scene.add.rectangle(0, 0, W, H, 0x0b0f26, 0.35).setOrigin(0).setScrollFactor(0).setDepth(280));
  const fill = add(scene.add.circle(cx, cy, radius, 0xb9a6e8, 0.18).setDepth(289));
  const ring = add(scene.add.image(cx, cy, 'ring').setScale(radius / 32).setTint(0xe6dcff).setDepth(290));
  add(scene.add.text(W / 2, H * 0.17, '화면을 끌어 원을 옮기세요', {
    fontFamily: FONT, fontSize: '20px', fontStyle: 'bold', color: '#dfe4f2', stroke: '#0b0f26', strokeThickness: 4,
  }).setOrigin(0.5).setScrollFactor(0).setDepth(300));
  const count = add(scene.add.text(W / 2, H - 200, '', {
    fontFamily: FONT, fontSize: '18px', color: '#e6dcff', stroke: '#0b0f26', strokeThickness: 4,
  }).setOrigin(0.5).setScrollFactor(0).setDepth(300));
  const cancelBtn = makeButton(scene, 75, H - 120, 110, 76, '취소', () => done(false), { fontSize: '22px', fill: 0x1d2350 });
  const fireBtn = makeButton(scene, W - 130, H - 120, 220, 76, '발동', () => done(true), { fontSize: '30px', fill: 0x4a3590, delayMs: 250 });

  // 원 안 요괴를 밝게 표시하고 수를 센다
  const marked = [];
  function refresh() {
    fill.setPosition(cx, cy);
    ring.setPosition(cx, cy);
    for (const e of marked) if (e.alive) e.sprite.clearTint();
    marked.length = 0;
    for (const e of scene.enemies.pool.active) {
      const dx = e.x - cx;
      const dy = e.y - cy;
      const rr = radius + e.radius;
      if (dx * dx + dy * dy <= rr * rr) { e.sprite.setTint(0xb8a8ff); marked.push(e); }
    }
    count.setText(`원 안의 요괴 ${marked.length}마리`);
  }

  let drag = null;
  const down = (p, over) => { if (!over.length) drag = { x: p.x, y: p.y, cx, cy }; };
  const move = (p) => {
    if (!drag || !p.isDown) return;
    cx = Math.min(view.x0 + W, Math.max(view.x0, drag.cx + (p.x - drag.x)));
    cy = Math.min(view.y0 + H, Math.max(view.y0, drag.cy + (p.y - drag.y)));
    refresh();
  };
  const up = () => { drag = null; };
  scene.input.on('pointerdown', down);
  scene.input.on('pointermove', move);
  scene.input.on('pointerup', up);

  function done(fire) {
    scene.input.off('pointerdown', down);
    scene.input.off('pointermove', move);
    scene.input.off('pointerup', up);
    for (const e of marked) if (e.alive) e.sprite.clearTint();
    objs.forEach((o) => o.destroy());
    cancelBtn.destroy();
    fireBtn.destroy();
    scene.state = 'play';
    if (fire) onFire(cx, cy);
  }

  refresh();
}
