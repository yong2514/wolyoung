import { Pool } from '../pool.js';
import { sfx } from '../audio.js';
import { AttackSpell } from './base.js';

// 부적진: 내 둘레에 부적을 놓는다. 요괴가 가까이 오거나 시간이 지나면 폭발
export class Talisman extends AttackSpell {
  constructor(scene, book) {
    super(scene, book, 'talisman');
    this.near = [];
    this.pool = new Pool(() => ({
      sprite: scene.add.image(0, 0, 'talisman').setVisible(false).setDepth(7),
      x: 0, y: 0, armAt: 0, dieAt: 0,
    }), 30, 6);
  }

  update(dt, now) {
    const sc = this.scene;
    if (this.ready(now)) {
      const p = sc.player;
      const sc2 = this.stat('scatter');
      for (let i = 0; i < this.stat('count'); i++) {
        const t = this.pool.get();
        if (!t) break;
        const a = sc.rng.next() * Math.PI * 2;
        const d = sc.rng.range(20, sc2);
        t.x = p.x + Math.cos(a) * d;
        t.y = p.y + Math.sin(a) * d;
        t.armAt = now + this.stat('armMs');
        t.dieAt = now + this.stat('fuseMs');
        t.sprite.setPosition(t.x, t.y).setAlpha(0.5).setRotation((sc.rng.next() - 0.5) * 0.6).setVisible(true);
      }
      this.nextAt = now + this.cooldown();
    }

    const trig = this.stat('triggerRadius');
    const list = this.pool.active;
    for (let i = list.length - 1; i >= 0; i--) {
      const t = list[i];
      if (now < t.armAt) continue;
      t.sprite.setAlpha(0.75 + 0.25 * Math.sin(now / 90)); // 준비되면 깜빡
      let boom = now >= t.dieAt;
      if (!boom) {
        const n = sc.grid.queryInto(t.x, t.y, trig + 20, this.near);
        for (let j = 0; j < n && !boom; j++) {
          const e = this.near[j];
          if (!e.alive) continue;
          const dx = e.x - t.x;
          const dy = e.y - t.y;
          const rr = trig + e.radius;
          boom = dx * dx + dy * dy <= rr * rr;
        }
      }
      if (boom) this.explode(t, now);
    }
  }

  explode(t, now) {
    const sc = this.scene;
    const r = this.stat('radius');
    const dmg = this.damage();
    const n = sc.grid.queryInto(t.x, t.y, r + 20, this.near);
    for (let j = 0; j < n; j++) {
      const e = this.near[j];
      if (!e.alive) continue;
      const dx = e.x - t.x;
      const dy = e.y - t.y;
      const rr = r + e.radius;
      if (dx * dx + dy * dy <= rr * rr) sc.enemies.hit(e, dmg, now);
    }
    sc.effects.flash('ring', t.x, t.y, { life: 300, scale: 0.3, scaleTo: r / 32, tint: 0xf3e6b0, depth: 27 });
    sc.effects.burst(t.x, t.y, 0xf3e6b0, 6);
    sfx.play('boom');
    t.sprite.setVisible(false);
    this.pool.release(t);
  }

  destroy() {
    for (const t of this.pool.active.slice()) { t.sprite.setVisible(false); this.pool.release(t); }
  }
}
