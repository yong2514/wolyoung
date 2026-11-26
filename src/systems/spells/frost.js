import { sfx } from '../audio.js';
import { AttackSpell } from './base.js';

// 빙결: 내 둘레를 얼려 피해 + 느리게
export class Frost extends AttackSpell {
  constructor(scene, book) {
    super(scene, book, 'frost');
    this.near = [];
  }

  update(dt, now) {
    if (!this.ready(now)) return;
    const sc = this.scene;
    const p = sc.player;
    const r = this.stat('radius');
    const dmg = this.damage();
    const n = sc.grid.queryInto(p.x, p.y, r + 20, this.near);
    for (let i = 0; i < n; i++) {
      const e = this.near[i];
      if (!e.alive) continue;
      const dx = e.x - p.x;
      const dy = e.y - p.y;
      const rr = r + e.radius;
      if (dx * dx + dy * dy > rr * rr) continue;
      sc.enemies.slow(e, this.stat('slowMult'), this.stat('slowMs'), now);
      sc.enemies.hit(e, dmg, now);
    }
    const fx = sc.effects;
    fx.flash('ring', p.x, p.y, { life: 350, scale: 0.3, scaleTo: r / 32, tint: 0x9fdcff, alpha: 0.9, depth: 26 });
    fx.burst(p.x, p.y, 0xcfefff, 6);
    sfx.play('frost');
    this.nextAt = now + this.cooldown();
  }
}
