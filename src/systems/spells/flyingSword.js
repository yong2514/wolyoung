import { BALANCE } from '../../config/balance.js';
import { Pool } from '../pool.js';
import { sfx } from '../audio.js';
import { AttackSpell } from './base.js';

const HIT_R = 10; // 검의 부딪힘 반지름

// 비검: 가장 가까운 적에게 날아가 꿰뚫는다
export class FlyingSword extends AttackSpell {
  constructor(scene, book) {
    super(scene, book, 'flyingSword');
    this.near = [];
    this.pool = new Pool(() => ({
      sprite: scene.add.image(0, 0, 'sword').setVisible(false).setDepth(25),
      x: 0, y: 0, vx: 0, vy: 0, dieAt: 0, pierce: 0, damage: 0, hits: [],
    }), BALANCE.limits.bullets, 30);
  }

  fireOne(angle, now) {
    const p = this.scene.player;
    const b = this.pool.get();
    if (!b) return;
    const sp = this.stat('speed');
    b.x = p.x; b.y = p.y;
    b.vx = Math.cos(angle) * sp;
    b.vy = Math.sin(angle) * sp;
    b.dieAt = now + this.stat('lifeMs');
    b.pierce = this.stat('pierce');
    b.damage = this.damage();
    b.hits.length = 0;
    b.sprite.setPosition(b.x, b.y).setRotation(angle).setVisible(true);
  }

  update(dt, now) {
    const sc = this.scene;
    const p = sc.player;
    if (this.ready(now)) {
      const target = sc.grid.nearest(p.x, p.y, this.stat('range'));
      if (target) {
        const a = Math.atan2(target.y - p.y, target.x - p.x);
        const n = this.stat('count');
        for (let i = 0; i < n; i++) this.fireOne(a + (i - (n - 1) / 2) * this.stat('spread'), now);
        sfx.play('shoot');
        this.nextAt = now + this.cooldown();
      }
    }

    const s = dt / 1000;
    const list = this.pool.active;
    const near = this.near;
    for (let i = list.length - 1; i >= 0; i--) {
      const b = list[i];
      if (now >= b.dieAt) { this.free(b); continue; }
      b.x += b.vx * s;
      b.y += b.vy * s;
      b.sprite.setPosition(b.x, b.y);
      const n = sc.grid.queryInto(b.x, b.y, HIT_R + 20, near);
      for (let j = 0; j < n; j++) {
        const e = near[j];
        if (!e.alive || b.hits.includes(e.id)) continue;
        const dx = e.x - b.x;
        const dy = e.y - b.y;
        const r = e.radius + HIT_R;
        if (dx * dx + dy * dy > r * r) continue;
        b.hits.push(e.id);
        sc.enemies.hit(e, b.damage, now);
        if (--b.pierce < 0) { this.free(b); break; }
      }
    }
  }

  free(b) {
    b.sprite.setVisible(false);
    this.pool.release(b);
  }
}
