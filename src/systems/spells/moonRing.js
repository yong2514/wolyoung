import { Pool } from '../pool.js';
import { sfx } from '../audio.js';
import { AttackSpell } from './base.js';

// 월륜: 가까운 적 쪽으로 날아갔다가 내게 돌아오는 달 고리. 오가며 꿰뚫는다. 연사결 적용
export class MoonRing extends AttackSpell {
  constructor(scene, book) {
    super(scene, book, 'moonRing');
    this.near = [];
    this.pool = new Pool(() => ({
      sprite: scene.add.image(0, 0, 'moonRing').setVisible(false).setDepth(25),
      x: 0, y: 0, vx: 0, vy: 0, out: true, travelled: 0, range: 0, damage: 0,
    }), 40, 6);
  }

  update(dt, now) {
    const sc = this.scene;
    const p = sc.player;
    if (this.ready(now)) {
      const range = this.stat('range');
      const target = sc.grid.nearest(p.x, p.y, range + 60);
      if (target) {
        const base = Math.atan2(target.y - p.y, target.x - p.x);
        const n = this.stat('count') + this.book.extraShots;
        const sp = this.stat('speed') * this.book.shotSpeedMult;
        for (let i = 0; i < n; i++) {
          const r = this.pool.get();
          if (!r) break;
          const a = base + (i - (n - 1) / 2) * this.stat('spread');
          r.x = p.x; r.y = p.y;
          r.vx = Math.cos(a) * sp;
          r.vy = Math.sin(a) * sp;
          r.out = true;
          r.travelled = 0;
          r.range = range;
          r.damage = this.damage();
          r.sprite.setPosition(r.x, r.y).setVisible(true);
        }
        sfx.play('shoot');
        this.nextAt = now + this.cooldown();
      }
    }

    const s = dt / 1000;
    const R = this.stat('radius');
    const hitCd = this.stat('hitCooldownMs');
    const list = this.pool.active;
    for (let i = list.length - 1; i >= 0; i--) {
      const r = list[i];
      if (r.out) {
        r.x += r.vx * s;
        r.y += r.vy * s;
        r.travelled += Math.hypot(r.vx, r.vy) * s;
        if (r.travelled >= r.range) r.out = false;
      } else { // 돌아오기
        const dx = p.x - r.x;
        const dy = p.y - r.y;
        const d = Math.hypot(dx, dy);
        if (d < 20) { r.sprite.setVisible(false); this.pool.release(r); continue; }
        const sp = this.stat('returnSpeed') * this.book.shotSpeedMult;
        r.x += (dx / d) * sp * s;
        r.y += (dy / d) * sp * s;
      }
      r.sprite.setPosition(r.x, r.y).setRotation(now / 60);
      const n = sc.grid.queryInto(r.x, r.y, R + 20, this.near);
      for (let j = 0; j < n; j++) {
        const e = this.near[j];
        if (!e.alive || now < e.moonNext) continue;
        const dx = e.x - r.x;
        const dy = e.y - r.y;
        const rr = R + e.radius;
        if (dx * dx + dy * dy > rr * rr) continue;
        e.moonNext = now + hitCd;
        sc.enemies.hit(e, r.damage, now);
      }
    }
  }

  destroy() {
    for (const r of this.pool.active.slice()) { r.sprite.setVisible(false); this.pool.release(r); }
  }
}
