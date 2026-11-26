import { sfx } from '../audio.js';
import { AttackSpell } from './base.js';

// 청염: 가장 가까운 적 쪽으로 부채꼴 푸른 불꽃 (부채꼴 안 요괴 모두 피해)
export class BlueFlame extends AttackSpell {
  constructor(scene, book) {
    super(scene, book, 'blueFlame');
    this.near = [];
  }

  update(dt, now) {
    if (!this.ready(now)) return;
    const sc = this.scene;
    const p = sc.player;
    const range = this.stat('range');
    const target = sc.grid.nearest(p.x, p.y, range + 40);
    if (!target) { this.nextAt = now + 150; return; }
    const dir = Math.atan2(target.y - p.y, target.x - p.x);
    const half = ((this.stat('angleDeg') / 2) * Math.PI) / 180;
    const dmg = this.damage();
    const n = sc.grid.queryInto(p.x, p.y, range + 20, this.near);
    for (let i = 0; i < n; i++) {
      const e = this.near[i];
      if (!e.alive) continue;
      const dx = e.x - p.x;
      const dy = e.y - p.y;
      const d = Math.hypot(dx, dy);
      if (d > range + e.radius) continue;
      let da = Math.atan2(dy, dx) - dir;
      da = Math.atan2(Math.sin(da), Math.cos(da)); // -π~π
      if (Math.abs(da) <= half + e.radius / Math.max(d, 1)) sc.enemies.hit(e, dmg, now, p.x, p.y);
    }
    // 부채꼴 그림: 'fan'은 오른쪽으로 60°, 반지름 128
    sc.effects.flash('fan', p.x, p.y, {
      life: 260, originX: 0, rotation: dir, tint: 0x7fc4ff, alpha: 0.95, depth: 26,
      scale: 1, scaleX: range / 128, scaleY: (range / 128) * (this.stat('angleDeg') / 60),
    });
    sfx.play('flame');
    this.nextAt = now + this.cooldown();
  }
}
