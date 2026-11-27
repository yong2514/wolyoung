import { Pool } from './pool.js';

// 요괴가 쏜 탄 (붉은색). 플레이어에 닿으면 피해
export class EnemyBullets {
  constructor(scene) {
    this.scene = scene;
    this.pool = new Pool(() => ({
      sprite: scene.add.image(0, 0, 'ebullet').setVisible(false).setDepth(26),
      x: 0, y: 0, vx: 0, vy: 0, dieAt: 0, damage: 0, r: 0,
    }), 120, 20);
  }

  fire(x, y, dirX, dirY, cfg, elite) {
    const b = this.pool.get();
    if (!b) return;
    b.x = x; b.y = y;
    b.vx = dirX * cfg.bulletSpeed;
    b.vy = dirY * cfg.bulletSpeed;
    b.dieAt = this.scene.clock.now + cfg.bulletLifeMs;
    b.damage = cfg.bulletDamage * (elite ? 1.4 : 1) * this.scene.enemies.dmgMult;
    b.r = cfg.bulletRadius * (elite ? 1.4 : 1);
    b.sprite.setPosition(x, y).setScale(b.r / 7).setVisible(true);
  }

  update(dt, now) {
    const p = this.scene.player;
    const s = dt / 1000;
    const list = this.pool.active;
    for (let i = list.length - 1; i >= 0; i--) {
      const b = list[i];
      b.x += b.vx * s;
      b.y += b.vy * s;
      b.sprite.setPosition(b.x, b.y);
      const r = b.r + p.radius;
      const hitPlayer = (p.x - b.x) ** 2 + (p.y - b.y) ** 2 < r * r;
      if (hitPlayer) p.hurt(b.damage, now);
      if (hitPlayer || now >= b.dieAt) this.free(b);
    }
  }

  free(b) {
    b.sprite.setVisible(false);
    this.pool.release(b);
  }
}
