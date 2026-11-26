import { BALANCE } from '../config/balance.js';
import { FONT } from '../config/display.js';
import { Pool } from './pool.js';
import { settings } from './settings.js';

// 타격감: 파티클(조각), 피해 숫자, 화면 흔들림, 진동. 모두 풀에서 꺼내 쓴다.
export class Effects {
  constructor(scene) {
    this.scene = scene;
    this.rng = scene.fxRng; // 화면 효과 전용 난수 (게임 흐름에 영향 없음)
    this.particleScale = 1;
    this.particles = new Pool(
      () => ({ sprite: scene.add.image(0, 0, 'spark').setVisible(false).setDepth(30), x: 0, y: 0, vx: 0, vy: 0, life: 0, left: 0 }),
      BALANCE.limits.particles, 120,
    );
    this.numbers = new Pool(
      () => ({
        text: scene.add.text(0, 0, '', {
          fontFamily: FONT, fontSize: '16px', fontStyle: 'bold', color: '#ffffff', stroke: '#0b0f26', strokeThickness: 3,
        }).setOrigin(0.5).setVisible(false).setDepth(60),
        left: 0, vy: 0,
      }),
      BALANCE.limits.damageNumbers, BALANCE.limits.damageNumbers,
    );
  }

  burst(x, y, tint, count) {
    const n = Math.max(1, Math.round(count * this.particleScale));
    for (let i = 0; i < n; i++) {
      const p = this.particles.get();
      if (!p) return;
      const a = this.rng.next() * Math.PI * 2;
      const sp = this.rng.range(60, 200);
      p.x = x; p.y = y;
      p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp;
      p.life = p.left = this.rng.range(250, 450);
      p.sprite.setPosition(x, y).setTint(tint).setAlpha(1).setScale(this.rng.range(0.6, 1.2)).setVisible(true);
    }
  }

  number(x, y, value, color = '#ffffff') {
    const t = this.numbers.get();
    if (!t) return; // 40개가 넘으면 띄우지 않는다
    t.left = BALANCE.feel.numberLifeMs;
    t.vy = -60;
    t.text.setText(String(value)).setColor(color).setPosition(x + this.rng.range(-6, 6), y).setAlpha(1).setScale(1.25).setVisible(true);
  }

  update(dt) {
    const s = dt / 1000;
    const ps = this.particles.active;
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      p.left -= dt;
      if (p.left <= 0) { p.sprite.setVisible(false); this.particles.release(p); continue; }
      p.x += p.vx * s; p.y += p.vy * s;
      p.vx *= 0.92; p.vy *= 0.92;
      p.sprite.setPosition(p.x, p.y).setAlpha(p.left / p.life);
    }
    const ns = this.numbers.active;
    const life = BALANCE.feel.numberLifeMs;
    for (let i = ns.length - 1; i >= 0; i--) {
      const t = ns[i];
      t.left -= dt;
      if (t.left <= 0) { t.text.setVisible(false); this.numbers.release(t); continue; }
      t.text.y += t.vy * s;
      t.vy *= 0.9;
      const k = t.left / life;
      t.text.setAlpha(Math.min(1, k * 2)).setScale(1 + 0.25 * Math.max(0, k - 0.7) / 0.3);
    }
  }

  shake(kind) {
    if (!settings.shake) return;
    const c = kind === 'hurt' ? BALANCE.feel.hurtShake : BALANCE.feel.killShake;
    this.scene.cameras.main.shake(c.durationMs, c.intensity);
  }

  /** 진동: 지원하는 기기만 (아이폰 사파리는 없음 → 흔들림·소리로 대신) */
  vibrate(ms) {
    if (!settings.vibration) return;
    if (typeof navigator.vibrate === 'function') navigator.vibrate(ms);
  }
}
