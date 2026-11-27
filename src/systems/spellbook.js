import { BALANCE } from '../config/balance.js';
import { SPELLS } from '../data/spells.js';
import { FlyingSword } from './spells/flyingSword.js';
import { Thunder } from './spells/thunder.js';
import { Lotus } from './spells/lotus.js';
import { Guard } from './spells/guard.js';
import { Annihilate } from './spells/annihilate.js';
import { Frost } from './spells/frost.js';
import { BlueFlame } from './spells/blueFlame.js';
import { Talisman } from './spells/talisman.js';
import { MoonRing } from './spells/moonRing.js';
import { ThunderSword, FrostLotus, FlameGuard, MoonSeal } from './spells/fusions.js';

const ATTACK_CLASSES = {
  flyingSword: FlyingSword, thunder: Thunder, lotus: Lotus, guard: Guard, annihilate: Annihilate,
  frost: Frost, blueFlame: BlueFlame, talisman: Talisman, moonRing: MoonRing,
  thunderSword: ThunderSword, frostLotus: FrostLotus, flameGuard: FlameGuard, moonSeal: MoonSeal,
};

// 이 판에서 가진 법술과 단계. 공격 법술은 매 걸음 update, 보조 법술은 능력치에 반영.
// 단계 = 늘 있는 단계(base: 시작 법술 등) + 아직 시간이 남은 카드 효과(timed)의 합 (사용자 요청: 카드 효과는 일정 시간만)
//   카드 효과 시간이 끝나면 그만큼 단계가 내려가고, 0이 되면 그 법술은 사라진다.
export class SpellBook {
  constructor(scene) {
    this.scene = scene;
    this.base = {};        // { 법술: 늘 있는 단계 }
    this.timed = [];       // [{ key, gain, until }] 시간이 정해진 카드 효과
    this.levels = {};      // { 법술: 지금 단계 } (base + timed, 최대 단계까지)
    this.order = [];       // 얻은 순서
    this.attacks = [];     // 공격 법술 객체
    this.fusedParts = new Set(); // 지금 합일에 쓰인 재료 (합일이 끝날 때까지 카드로 안 나옴)
    this.damageMult = 1;   // 공격력 배율 (경지 돌파·동료 궁합에서 올림)
    this.cooldownMult = 1; // 공격 간격 배율 (속법)
    this.extraShots = 0;   // 날아가는 법술 추가 수 (연사결)
    this.shotSpeedMult = 1; // 날아가는 속도 배율 (연사결)
    this.lifesteal = 0;    // 준 피해 중 회복 비율 (흡혈공)
  }

  level(key) { return this.levels[key] || 0; }

  count(kind) { return this.order.filter((k) => SPELLS[k].kind === kind).length; }

  /** 이 법술의 최대 단계 (법술마다 다를 수 있음, 합일은 1) */
  maxLevel(key) {
    if (SPELLS[key]?.fusion) return 1;
    return BALANCE.spells[key]?.maxLevel ?? BALANCE.supports[key]?.maxLevel ?? BALANCE.spells.maxLevel;
  }

  /** 늘 있는 단계로 정하기 (시작 법술·디버그). 카드 효과는 addTimed */
  learn(key, to = this.level(key) + 1) {
    const timedSum = this.timedSum(key);
    this.base[key] = Math.max(0, Math.min(to, this.maxLevel(key)) - timedSum);
    this.refresh(key);
  }

  /** 카드 효과: gain단계를 effectSec 동안 (주운 카드·보물상자) */
  addTimed(key, gain, now) {
    this.timed.push({ key, gain, until: now + BALANCE.fieldCards.effectSec * 1000 });
    this.refresh(key);
  }

  timedSum(key) {
    let s = 0;
    for (const t of this.timed) if (t.key === key) s += t.gain;
    return s;
  }

  /** 이 법술의 지금 단계를 다시 계산하고 법술 객체를 맞춘다 */
  refresh(key) {
    const L = Math.min(this.maxLevel(key), (this.base[key] || 0) + this.timedSum(key));
    const had = this.level(key);
    if (L <= 0) {
      if (had) this.remove(key);
      return;
    }
    if (!had) this.order.push(key);
    this.levels[key] = L;
    if (SPELLS[key].kind === 'attack') {
      let spell = this.attacks.find((a) => a.key === key);
      if (!spell) {
        spell = new ATTACK_CLASSES[key](this.scene, this);
        this.attacks.push(spell);
      }
      if (L !== had) spell.setLevel(L);
    } else {
      this.applySupports();
    }
  }

  /** 가장 빨리 끝나는 카드 효과까지 남은 시간 (ms). 카드 효과가 없으면 Infinity (늘 있는 단계만) */
  timeLeft(key, now) {
    let t = Infinity;
    for (const b of this.timed) if (b.key === key) t = Math.min(t, b.until - now);
    return t;
  }

  /** 합일: 재료 두 법술을 없애고 합일 법술을 얻는다 (효과 시간 동안, permanent면 늘 — 점검용) */
  fuse(key, now, permanent = false) {
    for (const part of SPELLS[key].fusion) {
      this.forget(part);
      this.fusedParts.add(part);
    }
    if (permanent) { this.base[key] = 1; this.refresh(key); } else this.addTimed(key, 1, now);
  }

  /** 법술 잃기 (호신강기 구슬이 모두 깨졌을 때·합일 재료): 늘 있는 단계와 카드 효과 모두 */
  forget(key) {
    delete this.base[key];
    this.timed = this.timed.filter((t) => t.key !== key);
    this.remove(key);
  }

  remove(key) {
    delete this.levels[key];
    this.order = this.order.filter((k) => k !== key);
    const i = this.attacks.findIndex((a) => a.key === key);
    if (i >= 0) {
      this.attacks[i].destroy?.();
      this.attacks.splice(i, 1);
    }
    if (SPELLS[key].fusion) for (const part of SPELLS[key].fusion) this.fusedParts.delete(part); // 합일이 끝나면 재료가 다시 나옴
    if (SPELLS[key].kind === 'support') this.applySupports();
  }

  applySupports() {
    const S = BALANCE.supports;
    const sc = this.scene;
    const p = sc.player;
    p.speed = BALANCE.player.speed * (1 + S.moveSpeed.perLevel * this.level('moveSpeed'));
    this.cooldownMult = Math.max(0.3, 1 - S.attackSpeed.perLevel * this.level('attackSpeed'));
    this.extraShots = S.multiShot.perLevel * this.level('multiShot');
    this.shotSpeedMult = 1 + S.multiShot.speedPerLevel * this.level('multiShot');
    this.lifesteal = S.lifesteal.perLevel * this.level('lifesteal');
    sc.orbs.magnetRange = BALANCE.orbs.magnetRange * (1 + S.magnet.perLevel * this.level('magnet'));
    sc.leveling.gainMult = 1 + S.xpGain.perLevel * this.level('xpGain');
    const maxHp = BALANCE.player.maxHp + S.maxHp.perLevel * this.level('maxHp');
    if (maxHp > p.maxHp) p.hp += maxHp - p.maxHp;
    p.maxHp = maxHp;
    p.hp = Math.min(p.hp, maxHp);
  }

  update(dt, now) {
    // 시간이 끝난 카드 효과 빼기
    if (this.timed.some((t) => t.until <= now)) {
      const done = this.timed.filter((t) => t.until <= now);
      this.timed = this.timed.filter((t) => t.until > now);
      for (const key of new Set(done.map((t) => t.key))) {
        this.refresh(key);
        this.scene.effects.number(this.scene.player.x, this.scene.player.y - 44, `${SPELLS[key].name} 효과 끝`, '#b9a6e8');
      }
    }
    // 뒤에서부터: update 중에 법술을 잃어도(forget) 안전
    for (let i = this.attacks.length - 1; i >= 0; i--) this.attacks[i].update(dt, now);
  }
}
