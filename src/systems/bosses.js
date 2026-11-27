import { BALANCE } from '../config/balance.js';
import { Pool } from './pool.js';
import { sfx } from './audio.js';

const WARN = 0xff9a2e;   // 예고 (주황)
const DANGER = 0xff5a3c; // 공격 (붉은)
const TAU = Math.PI * 2;

// 대형 요괴 (사용자 요청): 장소마다 1분이 지나면 그 장소의 대형 요괴가 나오고, 쓰러뜨리면 다음 장소로.
//  1~3번째 장소: 요장 (장소마다 강해짐), 마지막 장소: 요황(최종). 보스 몸은 요괴 풀(enemies)에 들어 있어 법술이 그대로 맞는다.
//  여기서는 등장·움직임·패턴·예고·2단계·광폭화·120초 제한(요황)·머리 위 체력 막대·다음 장소로 넘기기를 맡는다.
export class Bosses {
  constructor(scene) {
    this.scene = scene;
    this.current = null;  // 지금 장소의 대형 요괴 (요괴 객체)
    this.mid = null;      // 요장일 때 = current
    this.king = null;     // 요황일 때 = current
    this.kingAt = 0;      // 요황이 나온 시각
    this.travelAt = 0;    // 이때 다음 장소로 (대형 요괴를 쓰러뜨린 뒤)
    this.phase2 = false;
    this.enraged = false;
    this.done = false;    // 요황 처치 또는 패배로 끝남
    this.bar = scene.add.rectangle(0, 0, 60, 6, 0x0b0f26, 0.9).setDepth(60).setVisible(false);
    this.barFill = scene.add.rectangle(0, 0, 60, 4, 0xff5a3c, 1).setOrigin(0, 0.5).setDepth(61).setVisible(false);
    this.zones = new Pool(() => ({ // 내려찍기 예고 원
      fill: scene.add.circle(0, 0, 10, WARN, 0.2).setDepth(4).setVisible(false),
      ring: scene.add.image(0, 0, 'ring').setTint(WARN).setDepth(4).setVisible(false),
      x: 0, y: 0, r: 0, at: 0, warn: 0,
    }), 12, 6);
  }

  get cfgKing() { return BALANCE.boss.yohwang; }

  /** 보스 등장: 상한과 상관없이 화면 위쪽 밖에서 */
  spawn(key, now) {
    const sc = this.scene;
    const en = sc.enemies;
    const pt = sc.arena.spawnPoint(sc.rng); // 결계 벽 안, 되도록 화면 밖
    en.cap += 1;
    const e = en.spawn(key, pt.x, pt.y, now);
    en.cap -= 1;
    e.ai.next = now + 1500; // 처음 패턴까지
    sc.stats.bosses = (sc.stats.bosses ?? 0) + 1;
    e.ai.summonAt = now + (BALANCE.boss[key].summonEveryMs ?? 1e9);
    sc.effects.shake('hurt');
    sfx.play('breakthrough');
    sc.hud.banner(`${BALANCE.boss[key].name} 출현!`, key === 'yohwang' ? '봉인석을 지켜라' : `${sc.arena.place.name}의 대형 요괴`);
    return e;
  }

  update(dt, now) {
    const sc = this.scene;
    const ar = sc.arena;
    // 장소의 시간이 끝나면 그 장소의 대형 요괴
    if (!this.current && !this.done && ar.placeTime(now) >= ar.cfg.placeSec * 1000) {
      const key = ar.place.boss;
      this.scatterMinions();
      this.current = this.spawn(key, now);
      if (key === 'yohwang') { this.king = this.current; this.kingAt = now; } else this.mid = this.current;
    }
    // 대형 요괴를 쓰러뜨리고 잠시 뒤 다음 장소로
    if (this.travelAt && now >= this.travelAt) {
      this.travelAt = 0;
      this.current = null;
      this.mid = null;
      ar.travel();
      return;
    }
    if (this.mid?.alive) this.stepMid(this.mid, dt, now);
    if (this.king?.alive) this.stepKing(this.king, dt, now);
    this.updateZones(now);

    // 머리 위 체력 막대 (보이는 보스 하나)
    const b = this.king?.alive ? this.king : this.mid?.alive ? this.mid : null;
    this.bar.setVisible(!!b);
    this.barFill.setVisible(!!b);
    if (b) {
      const w = b.radius * 2;
      const y = b.y - b.radius - 14;
      this.bar.setPosition(b.x, y).setSize(w + 4, 7);
      this.barFill.setPosition(b.x - w / 2, y).setSize(w * Math.max(0, b.hp / b.maxHp), 4);
    }

    // 요황: 광폭화 · 120초 제한
    if (this.king?.alive && !this.done) {
      const t = now - this.kingAt;
      if (!this.enraged && t >= this.cfgKing.enrageSec * 1000) {
        this.enraged = true;
        sc.hud.banner('광폭화!', '요황이 미쳐 날뛴다');
        sc.cameras.main.flash(300, 255, 110, 70);
        sfx.play('breakthrough');
      }
      if (t >= this.cfgKing.defeatSec * 1000) {
        this.done = true;
        sc.lose('요황이 봉인석을 부쉈다');
      }
    }
  }

  /** 대형 요괴 등장: 그 기운에 남은 요괴들이 흩어져 사라진다 (보스전에 집중. 처치로 세지 않음) */
  scatterMinions() {
    const sc = this.scene;
    const list = sc.enemies.pool.active;
    for (let i = list.length - 1; i >= 0; i--) {
      const e = list[i];
      if (e.def.boss) continue;
      sc.effects.burst(e.x, e.y, 0x6a4a86, 2);
      sc.enemies.remove(e);
    }
    sc.enemyBullets.pool.active.slice().forEach((b) => sc.enemyBullets.free(b));
    sc.cameras.main.flash(400, 60, 20, 60);
  }

  /** 남은 시간 (봉인석 붕괴까지, ms) */
  kingTimeLeft(now) { return this.cfgKing.defeatSec * 1000 - (now - this.kingAt); }

  chase(e, sp, s) {
    const p = this.scene.player;
    const dx = p.x - e.x;
    const dy = p.y - e.y;
    const d = Math.hypot(dx, dy) || 1;
    const B = BALANCE.boss;
    const k = d > B.catchUpRange ? B.catchUpMult : 1; // 멀어지면 빠르게 따라와서 화면 안에 머문다
    e.x += (dx / d) * sp * k * s;
    e.y += (dy / d) * sp * k * s;
  }

  slowMult(e, now) { return now < e.slowUntil ? e.slowMult : 1; }

  /** 돌진: 예고선 → 돌진. 돌진이 끝나면 true */
  dash(e, c, s, now) {
    const ai = e.ai;
    const p = this.scene.player;
    if (ai.st === 'chase') {
      const dx = p.x - e.x;
      const dy = p.y - e.y;
      const d = Math.hypot(dx, dy) || 1;
      ai.dx = dx / d; ai.dy = dy / d;
      ai.st = 'windup';
      ai.t = now + c.windupMs;
      const len = (c.dashSpeed * c.dashMs) / 1000 + e.radius;
      e.warn.setTexture('warnLine').setOrigin(0, 0.5).setRotation(Math.atan2(ai.dy, ai.dx))
        .setScale(len / 100, e.radius / 6).setTint(WARN).setAlpha(0.25).setVisible(true);
    }
    if (ai.st === 'windup') {
      e.warn.setPosition(e.x, e.y).setAlpha(0.25 + 0.55 * (1 - (ai.t - now) / c.windupMs));
      if (now >= ai.t) { ai.st = 'dash'; ai.t = now + c.dashMs; e.warn.setTint(DANGER); }
      return false;
    }
    e.x += ai.dx * c.dashSpeed * s * this.rageMult();
    e.y += ai.dy * c.dashSpeed * s * this.rageMult();
    e.warn.setPosition(e.x, e.y).setAlpha(0.5 * Math.max(0, (ai.t - now) / c.dashMs));
    if (now >= ai.t) { e.warn.setVisible(false); return true; }
    return false;
  }

  rageMult() { return this.enraged ? this.cfgKing.enrageMult : 1; }

  summon(e, count, now) {
    const sc = this.scene;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * TAU;
      sc.enemies.spawn(sc.enemies.chaserKey(), e.x + Math.cos(a) * (e.radius + 30), e.y + Math.sin(a) * (e.radius + 30), now);
    }
    sc.effects.flash('ring', e.x, e.y, { life: 400, scale: 0.5, scaleTo: 3, tint: WARN, depth: 27 });
  }

  /** 요장: 쫓아오다 주기적으로 돌진, 잡귀 부르기 */
  stepMid(e, dt, now) {
    const c = BALANCE.boss.yojang;
    const s = dt / 1000;
    const ai = e.ai;
    if (ai.st === 'walk') ai.st = 'chase';
    if (ai.st === 'chase') {
      this.chase(e, e.speed * this.slowMult(e, now), s);
      if (now >= ai.next) this.dash(e, c, s, now);
    } else if (this.dash(e, c, s, now)) {
      ai.st = 'chase';
      ai.next = now + c.chargeEveryMs;
    }
    if (now >= ai.summonAt) { this.summon(e, c.summonCount, now); ai.summonAt = now + c.summonEveryMs; }
  }

  /** 요황: 쫓아오다 패턴(돌진·탄막·내려찍기)을 번갈아. 2단계·광폭화 */
  stepKing(e, dt, now) {
    const c = this.cfgKing;
    const s = dt / 1000;
    const ai = e.ai;
    const ph = this.phase2 ? 1 : 0;
    if (!this.phase2 && e.hp <= e.maxHp * c.phase2At) {
      this.phase2 = true;
      e.speed *= c.phase2SpeedMult;
      e.sprite.setScale(1.12);
      this.scene.hud.banner('요황이 분노했다', '2단계');
      this.scene.effects.shake('hurt');
      ai.summonAt = now;
    }
    const gap = c.patternGapMs[ph] / this.rageMult();
    if (ai.st === 'walk') ai.st = 'chase';

    if (ai.st === 'chase') {
      this.chase(e, e.speed * this.rageMult() * this.slowMult(e, now), s);
      if (now >= ai.next) {
        const pick = ['charge', 'volley', 'slam'][Math.floor(this.scene.rng.next() * 3)];
        if (pick === 'charge') this.dash(e, c.charge, s, now);
        else if (pick === 'volley') {
          ai.st = 'volley';
          ai.t = now + c.volley.chargeMs;
          ai.waves = c.volley.waves[ph];
          e.warn.setTexture('ring').setOrigin(0.5).setRotation(0).setTint(WARN).setAlpha(0.9).setVisible(true);
        } else {
          this.startSlam(e, c.slam, ph, now);
          ai.next = now + gap;
        }
      }
    } else if (ai.st === 'volley') {
      const k = 1 - (ai.t - now) / c.volley.chargeMs;
      e.warn.setPosition(e.x, e.y).setScale((e.radius / 32) * (2.2 - 1.2 * Math.min(1, k)));
      if (now >= ai.t) {
        this.fireRing(e, c.volley, ph);
        ai.waves--;
        if (ai.waves > 0) ai.t = now + c.volley.waveGapMs;
        else { ai.st = 'chase'; ai.next = now + gap; e.warn.setVisible(false); }
      }
    } else if (this.dash(e, c.charge, s, now)) {
      ai.st = 'chase';
      ai.next = now + gap;
    }
    if (this.phase2 && now >= ai.summonAt) { this.summon(e, c.summonCount, now); ai.summonAt = now + c.summonEveryMs; }
  }

  /** 탄막: 둥글게 퍼지는 탄 */
  fireRing(e, v, ph) {
    const n = v.count[ph];
    const off = this.scene.rng.next() * TAU;
    const cfg = { ...v, bulletDamage: v.bulletDamage * this.rageMult() };
    for (let i = 0; i < n; i++) {
      const a = off + (i / n) * TAU;
      this.scene.enemyBullets.fire(e.x, e.y, Math.cos(a), Math.sin(a), cfg, false);
    }
    sfx.play('boom');
  }

  /** 내려찍기: 내 자리 + 둘레에 예고 원. warnMs 뒤 폭발 */
  startSlam(e, sl, ph, now) {
    const sc = this.scene;
    const p = sc.player;
    for (let i = 0; i < sl.count[ph]; i++) {
      const z = this.zones.get();
      if (!z) break;
      const a = sc.rng.next() * TAU;
      const d = i === 0 ? 0 : sc.rng.range(sl.radius, sl.spread);
      z.x = p.x + Math.cos(a) * d;
      z.y = p.y + Math.sin(a) * d;
      sc.arena.clamp(z, 20);
      z.r = sl.radius;
      z.warn = sl.warnMs;
      z.at = now + sl.warnMs;
      z.damage = sl.damage * this.rageMult() * sc.enemies.dmgMult * BALANCE.enemies.damageMult;
      z.fill.setPosition(z.x, z.y).setRadius(z.r).setFillStyle(WARN, 0.15).setVisible(true);
      z.ring.setPosition(z.x, z.y).setScale(z.r / 32).setTint(WARN).setAlpha(0.8).setVisible(true);
    }
  }

  updateZones(now) {
    const sc = this.scene;
    const p = sc.player;
    const list = this.zones.active;
    for (let i = list.length - 1; i >= 0; i--) {
      const z = list[i];
      const k = 1 - (z.at - now) / z.warn; // 0 → 1
      z.fill.setFillStyle(k > 0.75 ? DANGER : WARN, 0.15 + 0.3 * k);
      if (now < z.at) continue;
      sc.effects.flash('ring', z.x, z.y, { life: 300, scale: (z.r / 32) * 0.5, scaleTo: z.r / 32, tint: DANGER, depth: 27 });
      sc.effects.burst(z.x, z.y, DANGER, 8);
      if (Math.hypot(p.x - z.x, p.y - z.y) <= z.r + p.radius) p.hurt(z.damage, now);
      sfx.play('boom');
      this.clearZone(z);
    }
  }

  clearZones() {
    for (const z of this.zones.active.slice()) this.clearZone(z);
  }

  clearZone(z) {
    z.fill.setVisible(false);
    z.ring.setVisible(false);
    this.zones.release(z);
  }

  onKilled(key, x, y) {
    const sc = this.scene;
    this.clearZones();
    if (key === 'yojang') { // 이 장소의 싸움 끝 → 잠시 뒤 다음 장소로
      sc.chests.drop(x, y);
      sc.hud.banner('요장 격파!', '곧 다음 장소로 간다');
      this.travelAt = sc.clock.now + sc.arena.cfg.travelDelayMs;
      return;
    }
    this.done = true;
    sc.clear();
  }
}
