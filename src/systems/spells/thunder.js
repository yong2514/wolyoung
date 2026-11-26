import { GAME_WIDTH as W, GAME_HEIGHT as H } from '../../config/display.js';
import { sfx } from '../audio.js';
import { AttackSpell } from './base.js';

// 뇌부: 화면 안 무작위 요괴에게 낙뢰 (범위 피해)
export class Thunder extends AttackSpell {
  constructor(scene, book) {
    super(scene, book, 'thunder');
    this.cands = [];
    this.near = [];
  }

  update(dt, now) {
    if (!this.ready(now)) return;
    const sc = this.scene;
    const p = sc.player;
    // 화면 안에 있는 요괴만 후보
    const cands = this.cands;
    let n = 0;
    const list = sc.enemies.pool.active;
    for (let i = 0; i < list.length; i++) {
      const e = list[i];
      if (Math.abs(e.x - p.x) < W / 2 - 10 && Math.abs(e.y - p.y) < H / 2 - 10) cands[n++] = e;
    }
    if (!n) { this.nextAt = now + 200; return; }

    const strikes = this.stat('strikes');
    const r = this.stat('radius');
    const dmg = this.damage();
    for (let k = 0; k < strikes; k++) {
      const t = cands[Math.floor(sc.rng.next() * n)];
      const tx = t.x;
      const ty = t.y;
      this.strikeFx(tx, ty, r);
      const m = sc.grid.queryInto(tx, ty, r + 20, this.near);
      for (let j = 0; j < m; j++) {
        const e = this.near[j];
        if (!e.alive) continue;
        const dx = e.x - tx;
        const dy = e.y - ty;
        const rr = r + e.radius;
        if (dx * dx + dy * dy <= rr * rr) sc.enemies.hit(e, dmg, now);
      }
    }
    sfx.play('thunder');
    this.nextAt = now + this.cooldown();
  }

  strikeFx(x, y, r) {
    const fx = this.scene.effects;
    fx.flash('bolt', x, y, { life: 180, originY: 1, tint: 0xd6e6ff, scaleX: 1, scaleY: 1, depth: 28 });
    fx.flash('ring', x, y, { life: 260, scale: (r / 32) * 0.6, scaleTo: r / 32, tint: 0xbcd4ff, alpha: 0.9, depth: 27 });
    fx.burst(x, y, 0xd6e6ff, 4);
  }
}
