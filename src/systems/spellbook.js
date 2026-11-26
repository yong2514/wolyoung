import { BALANCE } from '../config/balance.js';
import { SPELLS } from '../data/spells.js';
import { FlyingSword } from './spells/flyingSword.js';
import { Thunder } from './spells/thunder.js';
import { Lotus } from './spells/lotus.js';
import { Guard } from './spells/guard.js';
import { Annihilate } from './spells/annihilate.js';

const ATTACK_CLASSES = { flyingSword: FlyingSword, thunder: Thunder, lotus: Lotus, guard: Guard, annihilate: Annihilate };

// 이 판에서 가진 법술과 단계. 공격 법술은 매 걸음 update, 보조 법술은 능력치에 반영.
export class SpellBook {
  constructor(scene) {
    this.scene = scene;
    this.levels = {};      // { 법술: 단계 }
    this.order = [];       // 얻은 순서
    this.attacks = [];     // 공격 법술 객체
    this.damageMult = 1;   // 공격력 배율 (경지 돌파·동료 궁합에서 올림)
    this.cooldownMult = 1; // 공격 간격 배율 (속법)
    this.extraShots = 0;   // 날아가는 법술 추가 수 (연사결)
    this.shotSpeedMult = 1; // 날아가는 속도 배율 (연사결)
  }

  level(key) { return this.levels[key] || 0; }

  count(kind) { return this.order.filter((k) => SPELLS[k].kind === kind).length; }

  /** 법술 얻기 또는 한 단계 올리기 */
  learn(key) {
    const L = this.level(key) + 1;
    if (L === 1) this.order.push(key);
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

  /** 법술 잃기 (호신강기 구슬이 모두 깨졌을 때). 칸이 비고, 카드로 다시 얻을 수 있다 */
  forget(key) {
    delete this.levels[key];
    this.order = this.order.filter((k) => k !== key);
    const i = this.attacks.findIndex((a) => a.key === key);
    if (i >= 0) {
      this.attacks[i].destroy?.();
      this.attacks.splice(i, 1);
    }
  }

  /** 이 법술의 최대 단계 (법술마다 다를 수 있음) */
  maxLevel(key) { return BALANCE.spells[key]?.maxLevel ?? BALANCE.supports[key]?.maxLevel ?? BALANCE.spells.maxLevel; }

  applySupports() {
    const S = BALANCE.supports;
    const p = this.scene.player;
    p.speed = BALANCE.player.speed * (1 + S.moveSpeed.perLevel * this.level('moveSpeed'));
    this.cooldownMult = Math.max(0.3, 1 - S.attackSpeed.perLevel * this.level('attackSpeed'));
    this.extraShots = S.multiShot.perLevel * this.level('multiShot');           // 연사결: 날아가는 수 +
    this.shotSpeedMult = 1 + S.multiShot.speedPerLevel * this.level('multiShot'); // 연사결: 속도 ×
    const maxHp = BALANCE.player.maxHp + S.maxHp.perLevel * this.level('maxHp');
    if (maxHp > p.maxHp) p.hp += maxHp - p.maxHp;
    p.maxHp = maxHp;
  }

  update(dt, now) {
    // 뒤에서부터: update 중에 법술을 잃어도(forget) 안전
    for (let i = this.attacks.length - 1; i >= 0; i--) this.attacks[i].update(dt, now);
  }
}
