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
export class SpellBook {
  constructor(scene) {
    this.scene = scene;
    this.levels = {};      // { 법술: 단계 }
    this.order = [];       // 얻은 순서
    this.attacks = [];     // 공격 법술 객체
    this.banned = new Set(); // 봉인한 법술 (이 판에서 카드로 안 나옴)
    this.fusedParts = new Set(); // 합일에 쓴 재료 (다시 안 나옴)
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

  /** 법술을 얻거나 to단계까지 올리기 (희귀·전설 카드는 한 번에 여러 단계) */
  learn(key, to = this.level(key) + 1) {
    const L = Math.min(to, this.maxLevel(key));
    if (!this.level(key)) this.order.push(key);
    this.levels[key] = L;
    if (SPELLS[key].kind === 'attack') {
      let spell = this.attacks.find((a) => a.key === key);
      if (!spell) {
        spell = new ATTACK_CLASSES[key](this.scene, this);
        this.attacks.push(spell);
      }
      spell.setLevel(L);
    } else {
      this.applySupports();
    }
  }

  /** 합일: 재료 두 법술을 없애고 합일 법술을 얻는다 */
  fuse(key) {
    for (const part of SPELLS[key].fusion) {
      this.forget(part);
      this.fusedParts.add(part);
    }
    this.learn(key, 1);
  }

  /** 법술 잃기 (호신강기 구슬이 모두 깨졌을 때·합일 재료). 칸이 빈다 */
  forget(key) {
    delete this.levels[key];
    this.order = this.order.filter((k) => k !== key);
    const i = this.attacks.findIndex((a) => a.key === key);
    if (i >= 0) {
      this.attacks[i].destroy?.();
      this.attacks.splice(i, 1);
    }
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
  }

  update(dt, now) {
    // 뒤에서부터: update 중에 법술을 잃어도(forget) 안전
    for (let i = this.attacks.length - 1; i >= 0; i--) this.attacks[i].update(dt, now);
  }
}
