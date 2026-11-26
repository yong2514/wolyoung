import { AttackSpell } from './base.js';

// 호신강기: 몸 주위를 도는 기운 구슬. 같은 요괴는 hitCooldownMs마다 한 번만 때린다.
export class Guard extends AttackSpell {
  constructor(scene, book) {
    super(scene, book, 'guard');
    this.near = [];
    this.orbs = [];
    this.angle = 0;
    this.setLevel(1);
  }

  setLevel(level) {
    super.setLevel(level);
    const n = this.stat('count');
    while (this.orbs.length < n) this.orbs.push(this.scene.add.image(0, 0, 'guardOrb').setDepth(24));
  }

  update(dt, now) {
    const sc = this.scene;
    const p = sc.player;
    const n = this.stat('count');
    const orbit = this.stat('orbit');
    const R = this.stat('orbRadius');
    const hitCd = this.stat('hitCooldownMs');
    const kb = this.stat('knockback');
    const dmg = this.damage();
    this.angle += (this.stat('spin') * dt) / 1000;

    for (let i = 0; i < n; i++) {
      const a = this.angle + (i * Math.PI * 2) / n;
      const ox = p.x + Math.cos(a) * orbit;
      const oy = p.y + Math.sin(a) * orbit;
      this.orbs[i].setPosition(ox, oy).setRotation(-a * 2);
      const m = sc.grid.queryInto(ox, oy, R + 20, this.near);
      for (let j = 0; j < m; j++) {
        const e = this.near[j];
        if (!e.alive || now < e.guardNext) continue;
        const dx = e.x - ox;
        const dy = e.y - oy;
        const rr = R + e.radius;
        if (dx * dx + dy * dy > rr * rr) continue;
        e.guardNext = now + hitCd;
        // 플레이어 반대쪽으로 살짝 밀어낸다
        const px = e.x - p.x;
        const py = e.y - p.y;
        const d = Math.hypot(px, py) || 1;
        e.x += (px / d) * kb;
        e.y += (py / d) * kb;
        sc.enemies.hit(e, dmg, now);
      }
    }
  }
}
