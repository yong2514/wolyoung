import { BALANCE } from '../config/balance.js';
import { GAME_WIDTH as W, GAME_HEIGHT as H } from '../config/display.js';
import { ENEMIES } from '../data/enemies.js';
import { Pool } from './pool.js';
import { sfx } from './audio.js';

const TAU = Math.PI * 2;
const RING = Math.hypot(W / 2, H / 2) + BALANCE.spawn.ringMargin; // 화면 바로 바깥 거리

// 요괴: 나오기, 쫓아가기, 서로 밀어내기, 플레이어와 부딪히기, 맞기·죽기
export class EnemySystem {
  constructor(scene) {
    this.scene = scene;
    this.rng = scene.rng;
    this.cap = BALANCE.limits.enemyCap;
    this.keepAtLeast = 0; // 디버그: 이 수만큼 계속 채움
    this.spawnAcc = 0;
    this.nextId = 1;
    this.near = [];
    this.pool = new Pool(() => ({
      sprite: scene.add.image(0, 0, 'jabgwi').setVisible(false).setDepth(10),
      x: 0, y: 0, hp: 0, speed: 0, damage: 0, radius: 0, id: 0, flashUntil: 0, guardNext: 0, alive: false, inGrid: false, def: null,
    }), BALANCE.limits.enemyCap + 60, BALANCE.limits.enemyCap);
  }

  get count() { return this.pool.count; }

  spawn(key, x, y, now) {
    if (this.count >= this.cap) return null;
    const def = ENEMIES[key];
    const e = this.pool.get();
    if (!e) return null;
    const minutes = now / 60000;
    e.def = def;
    e.x = x; e.y = y;
    e.hp = def.hp * (1 + BALANCE.enemies.hpGrowthPerMin * minutes);
    e.speed = def.speed * (1 + (this.rng.next() - 0.5) * def.speedJitter);
    e.damage = def.damage;
    e.radius = def.radius;
    e.id = this.nextId++;
    e.alive = true;
    e.flashUntil = 0;
    e.guardNext = 0;
    e.sprite.setTexture(def.texture).setPosition(x, y).clearTint().setVisible(true);
    return e;
  }

  /** 화면 바로 밖 둥근 테두리 위에 놓기. ahead면 플레이어가 가는 쪽 앞에 */
  ringPoint(ahead) {
    const p = this.scene.player;
    let a = this.rng.next() * TAU;
    if (ahead && (p.dirX || p.dirY)) a = Math.atan2(p.dirY, p.dirX) + (this.rng.next() - 0.5) * (Math.PI / 1.5);
    return { x: p.x + Math.cos(a) * RING, y: p.y + Math.sin(a) * RING };
  }

  updateSpawning(dt, now) {
    const sp = BALANCE.spawn;
    const rate = Math.min(sp.maxPerSec, sp.startPerSec + sp.growthPerSec * (now / 1000));
    this.spawnAcc += (rate * dt) / 1000;
    while (this.spawnAcc >= 1) {
      this.spawnAcc -= 1;
      const pt = this.ringPoint(false);
      this.spawn('jabgwi', pt.x, pt.y, now);
    }
    while (this.count < Math.min(this.keepAtLeast, this.cap)) {
      const pt = this.ringPoint(false);
      if (!this.spawn('jabgwi', pt.x, pt.y, now)) break;
    }
  }

  /** 디버그·성능 시험: n마리를 화면 안팎에 흩어 놓기 */
  fill(n, now) {
    const p = this.scene.player;
    for (let i = 0; i < n; i++) {
      const a = this.rng.next() * TAU;
      const d = this.rng.range(120, RING);
      if (!this.spawn('jabgwi', p.x + Math.cos(a) * d, p.y + Math.sin(a) * d, now)) break;
    }
  }

  move(dt, now) {
    const p = this.scene.player;
    const s = dt / 1000;
    const far2 = BALANCE.spawn.farDistance ** 2;
    const list = this.pool.active;
    for (let i = list.length - 1; i >= 0; i--) {
      const e = list[i];
      const dx = p.x - e.x;
      const dy = p.y - e.y;
      const d2 = dx * dx + dy * dy;
      if (d2 > far2) { // 너무 멀면 앞쪽으로 다시 옮긴다 (멀리 있는 요괴는 단순 계산)
        const pt = this.ringPoint(true);
        e.x = pt.x; e.y = pt.y;
        continue;
      }
      const d = Math.sqrt(d2) || 1;
      e.x += (dx / d) * e.speed * s;
      e.y += (dy / d) * e.speed * s;
      e.sprite.flipX = dx < 0;
      if (e.flashUntil && now >= e.flashUntil) { e.flashUntil = 0; e.sprite.clearTint(); }
    }
  }

  insertInto(grid) {
    const list = this.pool.active;
    for (let i = 0; i < list.length; i++) grid.insert(list[i]);
  }

  /** 격자 안 요괴끼리 밀어내기 + 플레이어와 부딪히기 + 그림 위치 맞추기 */
  collide(now) {
    const grid = this.scene.grid;
    const p = this.scene.player;
    const near = this.near;
    const list = this.pool.active;
    for (let i = 0; i < list.length; i++) {
      const e = list[i];
      if (e.inGrid) {
        const n = grid.queryInto(e.x, e.y, e.radius * 2, near);
        for (let j = 0; j < n; j++) {
          const o = near[j];
          if (o === e) continue;
          const dx = e.x - o.x;
          const dy = e.y - o.y;
          const min = e.radius + o.radius;
          const d2 = dx * dx + dy * dy;
          if (d2 < min * min && d2 > 0.01) {
            const d = Math.sqrt(d2);
            const push = ((min - d) / d) * 0.25;
            e.x += dx * push;
            e.y += dy * push;
          }
        }
      }
      e.sprite.setPosition(e.x, e.y);
    }

    const n = grid.queryInto(p.x, p.y, p.radius + 30, near);
    for (let j = 0; j < n; j++) {
      const e = near[j];
      if (!e.alive) continue;
      const dx = e.x - p.x;
      const dy = e.y - p.y;
      const r = e.radius + p.radius;
      if (dx * dx + dy * dy < r * r) { p.hurt(e.damage, now); break; }
    }
  }

  /** 피해 주기. 죽으면 true */
  hit(e, dmg, now) {
    if (!e.alive) return false;
    const fx = this.scene.effects;
    e.hp -= dmg;
    fx.number(e.x, e.y - 16, Math.round(dmg));
    sfx.play('hit');
    if (e.hp <= 0) { this.kill(e); return true; }
    e.sprite.setTintFill(0xffffff);
    e.flashUntil = now + BALANCE.feel.hitFlashMs;
    return false;
  }

  kill(e) {
    const fx = this.scene.effects;
    e.alive = false;
    fx.burst(e.x, e.y, 0xc9b8ff, BALANCE.feel.killParticles);
    fx.shake('kill');
    sfx.play('kill');
    this.scene.stats.kills++;
    this.scene.orbs.drop(e.x, e.y, e.def.orb ?? BALANCE.orbs.value); // 영기는 구슬을 주워야 오른다
    e.sprite.setVisible(false).clearTint();
    this.pool.release(e);
  }
}
