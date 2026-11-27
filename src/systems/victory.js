import { BALANCE } from '../config/balance.js';
import { GAME_WIDTH as W, GAME_HEIGHT as H, FONT } from '../config/display.js';
import { sfx } from './audio.js';

// 요괴 왕(대형 요괴)을 이겼을 때 큰 폭발 연출 (사용자 요청: 이겼다는 것을 크게)
//  화면 번쩍·크게 흔들림 · 여러 겹 빛 고리 · 빛 조각 · 잠깐 느려짐 · 가운데 큰 글씨 · 남은 잡몹이 줄줄이 터짐
export function victoryBurst(sc, x, y, title) {
  const V = BALANCE.victory;
  const fx = sc.effects;
  const cam = sc.cameras.main;
  cam.flash(V.flashMs, 255, 250, 235);
  cam.shake(V.shakeMs, V.shakeIntensity);
  fx.vibrate(V.vibrateMs);
  sfx.play('breakthrough');
  sfx.play('annihilate');

  // 여러 겹 빛 고리 (조금씩 늦게)
  const colors = [0xffd36a, 0xffffff, 0xd9ccff, 0xffd36a, 0xbff0ff];
  colors.forEach((c, i) => {
    sc.time.delayedCall(i * 110, () => {
      fx.flash('ring', x, y, { life: 700 + i * 120, scale: 0.4, scaleTo: 6 + i * 2.5, tint: c, alpha: 1, depth: 46 });
    });
  });
  fx.flash('aura', x, y, { life: 600, scale: 1, scaleTo: 9, tint: 0xfff4d0, alpha: 1, depth: 45 });
  for (let k = 0; k < 4; k++) fx.burst(x, y, k % 2 ? 0xffffff : 0xffd36a, 18);

  // 남은 잡몹이 줄줄이 터짐 (영기는 받는다). 처치는 지금 한 번에(같은 시드 = 같은 판), 터지는 그림만 줄줄이
  const list = sc.enemies.pool.active.slice().filter((e) => e.alive && !e.def.boss);
  list.forEach((e, i) => {
    const ex = e.x;
    const ey = e.y;
    sc.enemies.kill(e);
    sc.time.delayedCall(80 + i * 12, () => fx.flash('ring', ex, ey, { life: 300, scale: 0.3, scaleTo: 1.6, tint: 0xffd36a, depth: 44 }));
  });

  // 잠깐 느려짐 (게임 시간으로 끝을 잰다 → bosses.update가 되돌림)
  sc.clock.scale = V.slowScale;
  sc.bosses.slowEnd = sc.clock.now + V.slowMs * V.slowScale;

  // 가운데 큰 글씨
  const t = sc.add.text(W / 2, H * 0.36, title, {
    fontFamily: FONT, fontSize: '54px', fontStyle: 'bold', color: '#ffe7a8', stroke: '#3a2408', strokeThickness: 8,
  }).setOrigin(0.5).setScrollFactor(0).setDepth(262).setScale(2.4).setAlpha(0).setPadding(30);
  t.setShadow(0, 0, '#ffd36a', 26, true, true);
  sc.tweens.add({ targets: t, scale: 1, alpha: 1, duration: 300, ease: 'Back.easeOut' });
  sc.tweens.add({ targets: t, alpha: 0, y: H * 0.32, delay: 1600, duration: 500, onComplete: () => t.destroy() });
}
