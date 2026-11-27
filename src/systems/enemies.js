import { BALANCE } from '../config/balance.js';
import { GAME_WIDTH as W, GAME_HEIGHT as H } from '../config/display.js';
import { ENEMIES, topTier } from '../data/enemies.js';
import { Pool } from './pool.js';
import { sfx } from './audio.js';
import { stepEnemy, resetAi } from './enemyAI.js';

const TAU = Math.PI * 2;
const RING = Math.hypot(W / 2, H / 2) + BALANCE.spawn.ringMargin; // 화면 바로 바깥 거리

// 요괴: 나오기, 움직이기(enemyAI), 서로 밀어내기, 플레이어와 부딪히기, 맞기·죽기
export class EnemySystem {
  constructor(scene) {
    this.scene = scene;
    this.rng = scene.rng;
    this.cap = BALANCE.limits.enemyCap;
    this.keepAtLeast = 0; // 디버그: 이 수만큼 계속 채움
    this.hpMult = 1;      // 난이도 배율 (첫 판 등, 4단계)
    this.nextId = 1;
    this.near = [];
    this.pool = new Pool(() => ({
      sprite: scene.add.image(0, 0, 'jabgwi').setVisible(false).setDepth(10),
      warn: scene.add.image(0, 0, 'ring').setVisible(false).setDepth(9),     // 공격 예고 (붉은·주황)
      glow: scene.add.image(0, 0, 'eliteGlow').setVisible(false).setDepth(9), // 정예 테두리
      shadow: scene.add.image(0, 0, 'shadow').setVisible(false).setDepth(2),  // 발밑 그림자 (입체감)
      x: 0, y: 0, alive: false, inGrid: false, def: null, ai: {},
    }), BALANCE.limits.enemyCap + 60, BALANCE.limits.enemyCap);
  }

  get count() { return this.pool.count; }

  spawn(key, x, y, now, elite = false) {
    if (this.count >= this.cap) return null;
    const def = ENEMIES[key];
    const e = this.pool.get();
    if (!e) return null;
    const E = BALANCE.enemies.elite;
    e.def = def;
    e.elite = elite;
    e.x = x; e.y = y;
    const growth = def.noGrowth && !elite ? 1 : 1 + BALANCE.enemies.hpGrowthPerMin * (now / 60000);
    e.hp = def.boss ? def.hp * this.hpMult : def.hp * growth * this.hpMult * (elite ? E.hpMult : 1);
    e.maxHp = e.hp;
    e.speed = def.speed * (1 + (this.rng.next() - 0.5) * BALANCE.enemies.speedJitter);
    e.damage = def.damage * (elite ? E.damageMult : 1);
    e.radius = def.radius * (elite ? E.scale : 1);
    e.id = this.nextId++;
    e.alive = true;
    e.flashUntil = 0; e.guardNext = 0; e.moonNext = 0;
    e.slowUntil = 0; e.slowMult = 1; e.stunUntil = 0; e.tintState = 0;
    e.kbx = 0; e.kby = 0;
    e.shed = undefined;
    resetAi(e);
    e.sprite.setTexture(def.texture).setPosition(x, y).setScale(elite ? E.scale : 1).clearTint().setVisible(true);
    e.glow.setVisible(elite).setScale(e.radius / 20);
    e.shadow.setVisible(true).setScale(e.radius / 16);
    e.warn.setVisible(false);
    return e;
  }

  /** 요괴가 나올 자리: 결계 벽 안쪽, 되도록 화면 밖 (arena.spawnPoint) */
  ringPoint() {
    return this.scene.arena.spawnPoint(this.rng);
  }

  spawnRing(key, now, elite = false) {
    const pt = this.ringPoint();
    return this.spawn(key, pt.x, pt.y, now, elite);
  }

  /** 쫓는 요괴 종류: 내 레벨에 맞게, 가끔(lowerTierChance) 한 단계 아래 */
  chaserKey() {
    const tiers = BALANCE.enemies.tiers;
    let t = topTier(this.scene.leveling.level);
    if (this.rng.next() < BALANCE.enemies.lowerTierChance && t > 0) t--;
    return tiers[t].key;
  }

  /** 상한이 차서 더 못 늘릴 때: 멀리 있는 약한 쫓는 요괴 하나를 한 단계 센 요괴로 바꾼다 */
  upgradeOne(now) {
    const tiers = BALANCE.enemies.tiers;
    const list = this.pool.active;
    for (let i = 0; i < list.length; i++) {
      const e = list[i];
      if (e.inGrid || e.elite || e.def.tier < 0 || e.def.tier >= tiers.length - 1) continue;
      const { x, y } = e;
      this.remove(e);
      this.spawn(tiers[e.def.tier + 1].key, x, y, now);
      return;
    }
  }

  /** 디버그·성능 시험: n마리를 화면 안팎에 흩어 놓기 */
  fill(n, now) {
    const p = this.scene.player;
    for (let i = 0; i < n; i++) {
      const a = this.rng.next() * TAU;
      const d = this.rng.range(120, RING);
      const pt = this.scene.arena.clamp({ x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d }, 20);
      if (!this.spawn(this.chaserKey(), pt.x, pt.y, now)) break;
    }
  }

  move(dt, now) {
    const p = this.scene.player;
    const s = dt / 1000;
    const far2 = BALANCE.spawn.farDistance ** 2;
    const list = this.pool.active;
    while (this.count < Math.min(this.keepAtLeast, this.cap) && this.spawnRing(this.chaserKey(), now));
    for (let i = list.length - 1; i >= 0; i--) {
      const e = list[i];
      const dx = p.x - e.x;
      const dy = p.y - e.y;
      if (e.def.boss) { // 보스는 bosses.js가 움직인다
        e.sprite.flipX = dx < 0;
        if (e.flashUntil && now >= e.flashUntil) e.flashUntil = 0;
        this.updateTint(e, now);
        continue;
      }
      if (dx * dx + dy * dy > far2) { // 너무 멀면 앞쪽으로 다시 옮긴다 (멀리 있는 요괴는 단순 계산)
        const pt = this.ringPoint();
        e.x = pt.x; e.y = pt.y;
        resetAi(e);
        e.warn.setVisible(false);
        continue;
      }
      if (e.kbx || e.kby) { // 경지 돌파로 날아가는 중
        e.x += e.kbx * s; e.y += e.kby * s;
        e.kbx *= 0.9; e.kby *= 0.9;
        if (Math.abs(e.kbx) + Math.abs(e.kby) < 20) { e.kbx = 0; e.kby = 0; }
      } else if (now >= e.stunUntil) {
        stepEnemy(this, e, s, now, now < e.slowUntil ? e.slowMult : 1);
      }
      if (!e.alive) continue; // 자폭함
      e.sprite.flipX = dx < 0;
      if (e.flashUntil && now >= e.flashUntil) e.flashUntil = 0;
      this.updateTint(e, now);
    }
  }

  /** 색: 맞음(하양) > 멈춤(연보라) > 느려짐(얼음색) > 원래. 바뀔 때만 칠한다 */
  updateTint(e, now) {
    const st = e.flashUntil ? 1 : now < e.stunUntil ? 2 : now < e.slowUntil ? 3 : 0;
    if (st === e.tintState) return;
    e.tintState = st;
    if (st === 1) e.sprite.setTintFill(0xffffff);
    else if (st === 2) e.sprite.setTint(0xd9ccff);
    else if (st === 3) e.sprite.setTint(0x9fdcff);
    else e.sprite.clearTint();
  }

  slow(e, mult, ms, now) {
    if (e.def.boss) mult = Math.max(mult, BALANCE.boss.slowFloor); // 보스는 조금만 느려짐
    e.slowMult = Math.min(e.slowUntil > now ? e.slowMult : 1, mult);
    e.slowUntil = Math.max(e.slowUntil, now + ms);
  }

  stun(e, ms, now) {
    if (e.def.boss) return; // 보스는 멈추지 않음
    e.stunUntil = Math.max(e.stunUntil, now + ms);
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
      if (e.inGrid && !e.def.boss) { // 보스는 작은 요괴에 밀리지 않는다
        const n = grid.queryInto(e.x, e.y, e.radius * 2, near, 0); // 서로 밀어내기: 보스는 빠지므로 넓게 볼 필요 없음
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
      this.scene.arena.clamp(e, e.radius); // 결계 벽 안에만
      e.sprite.setPosition(e.x, e.y);
      e.shadow.setPosition(e.x, e.y + e.radius * 0.85);
      if (e.elite) e.glow.setPosition(e.x, e.y);
    }

    const n = grid.queryInto(p.x, p.y, p.radius + 40, near);
    for (let j = 0; j < n; j++) {
      const e = near[j];
      if (!e.alive) continue;
      const dx = e.x - p.x;
      const dy = e.y - p.y;
      const r = e.radius + p.radius;
      if (dx * dx + dy * dy < r * r) { p.hurt(e.damage, now); break; }
    }
  }

  /** 피해 주기. (sx, sy)는 공격이 날아온 곳 — 방패귀가 앞에서 온 공격을 막는 데 쓴다. 죽으면 true */
  hit(e, dmg, now, sx, sy) {
    if (!e.alive) return false;
    const fx = this.scene.effects;
    if (e.def.blockArcDeg && sx !== undefined) {
      const p = this.scene.player;
      let da = Math.atan2(sy - e.y, sx - e.x) - Math.atan2(p.y - e.y, p.x - e.x);
      da = Math.atan2(Math.sin(da), Math.cos(da));
      if (Math.abs(da) <= (e.def.blockArcDeg * Math.PI) / 360) {
        dmg *= e.def.blockMult;
        fx.burst(e.x, e.y, 0xdfe4f2, 2);
      }
    }
    const dealt = Math.min(dmg, e.hp);
    e.hp -= dmg;
    fx.number(e.x, e.y - 16, Math.round(dmg));
    sfx.play('hit');
    const ls = this.scene.book.lifesteal; // 흡혈공
    if (ls) this.scene.player.heal(dealt * ls);
    if (e.def.boss) this.shedOrbs(e); // 보스는 맞을 때마다 영기를 흘린다 → 보스전에도 카드가 나온다
    if (e.hp <= 0) { this.kill(e); return true; }
    e.flashUntil = now + BALANCE.feel.hitFlashMs;
    this.updateTint(e, now);
    return false;
  }

  /** 보스: 최대 체력의 shedEveryRatio만큼 잃을 때마다 영기 구슬을 떨어뜨린다 */
  shedOrbs(e) {
    const B = BALANCE.boss;
    const step = e.maxHp * B.shedEveryRatio;
    e.shed = e.shed ?? step;
    while (e.maxHp - Math.max(0, e.hp) >= e.shed) {
      e.shed += step;
      const a = this.rng.next() * TAU;
      this.scene.orbs.drop(e.x + Math.cos(a) * (e.radius + 20), e.y + Math.sin(a) * (e.radius + 20), B.shedOrb, true); // 저절로 날아옴
    }
  }

  /** 경지 돌파: (x,y) 둘레 요괴를 바깥으로 날리고 피해 */
  blast(x, y, r, push, dmg, now) {
    const list = this.pool.active;
    for (let i = list.length - 1; i >= 0; i--) {
      const e = list[i];
      const dx = e.x - x;
      const dy = e.y - y;
      const d = Math.hypot(dx, dy);
      if (d > r || !e.alive) continue;
      if (e.def.boss) { this.hit(e, dmg, now); continue; } // 보스는 날아가지 않음
      const k = push * (1 - d / r * 0.5) / (d || 1);
      e.kbx = dx * k; e.kby = dy * k;
      resetAi(e);
      e.warn.setVisible(false);
      this.hit(e, dmg, now);
    }
  }

  kill(e) {
    const sc = this.scene;
    const fx = sc.effects;
    const { x, y, def, elite } = e;
    fx.burst(x, y, 0xc9b8ff, BALANCE.feel.killParticles);
    fx.shake('kill');
    sfx.play('kill');
    sc.stats.kills++;
    if (elite) sc.stats.elites++;
    sc.orbs.drop(x, y, def.orb * (elite ? BALANCE.enemies.elite.orbMult : 1)); // 영기는 구슬을 주워야 오른다
    this.remove(e);
    if (elite) sc.chests.drop(x, y);
    if (def.boss) sc.bosses.onKilled(def.key, x, y);
    if (def.splitCount) { // 분열귀: 작은 분열귀로 나뉜다
      for (let k = 0; k < def.splitCount; k++) {
        const a = (k / def.splitCount) * TAU + this.rng.next();
        this.spawn('splitling', x + Math.cos(a) * 14, y + Math.sin(a) * 14, sc.clock.now);
      }
    }
  }

  /** 조용히 없애기 (처치로 세지 않음) */
  remove(e) {
    e.alive = false;
    e.sprite.setVisible(false).clearTint();
    e.warn.setVisible(false);
    e.glow.setVisible(false);
    e.shadow.setVisible(false);
    this.pool.release(e);
  }
}
