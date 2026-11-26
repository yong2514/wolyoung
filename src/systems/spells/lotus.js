import { Pool } from '../pool.js';
import { sfx } from '../audio.js';
import { AttackSpell } from './base.js';

// 연화진: 선 자리에 연꽃 장판. 안에 있는 요괴에게 tickMs마다 피해
export class Lotus extends AttackSpell {
  constructor(scene, book) {
    super(scene, book, 'lotus');
    this.near = [];
    this.pool = new Pool(() => ({
      sprite: scene.add.image(0, 0, 'lotus').setVisible(false).setDepth(5),
      x: 0, y: 0, r: 0, born: 0, dieAt: 0, nextTick: 0, damage: 0,
    }), 12, 4);
  }

  update(dt, now) {
    const sc = this.scene;
    if (this.ready(now)) {
      const z = this.pool.get();
      if (z) {
        const p = sc.player;
        z.x = p.x; z.y = p.y;
        z.r = this.stat('radius');
        z.born = now;
        z.dieAt = now + this.stat('durationMs');
        z.nextTick = now;
        z.damage = this.damage();
        z.sprite.setPosition(z.x, z.y).setScale(z.r / 64).setAlpha(0).setVisible(true);
        sfx.play('lotus');
      }
      this.nextAt = now + this.cooldown();
    }

    const list = this.pool.active;
    for (let i = list.length - 1; i >= 0; i--) {
      const z = list[i];
      if (now >= z.dieAt) { z.sprite.setVisible(false); this.pool.release(z); continue; }
      // 나타나고 사라질 때 부드럽게
      const fadeIn = Math.min(1, (now - z.born) / 200);
      const fadeOut = Math.min(1, (z.dieAt - now) / 300);
      z.sprite.setAlpha(0.75 * Math.min(fadeIn, fadeOut)).setRotation(now / 1500);
      if (now < z.nextTick) continue;
      z.nextTick = now + this.stat('tickMs');
      const n = sc.grid.queryInto(z.x, z.y, z.r + 20, this.near);
      for (let j = 0; j < n; j++) {
        const e = this.near[j];
        if (!e.alive) continue;
        const dx = e.x - z.x;
        const dy = e.y - z.y;
        if (dx * dx + dy * dy <= z.r * z.r) sc.enemies.hit(e, z.damage, now);
      }
    }
  }
}
