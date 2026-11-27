import { BALANCE } from '../config/balance.js';

/** 레벨 L에서 L+1로 가는 데 필요한 영기 */
export function xpNeed(level) {
  const c = BALANCE.xp;
  return Math.round(c.base * c.growth ** (level - 1) + c.add * (level - 1));
}

// 영기·레벨. 레벨이 오르면 pending(골라야 할 카드 수)이 쌓인다.
export class Leveling {
  /** firstNeed: 첫 레벨업에 필요한 영기를 따로 (첫 판 각본) */
  constructor(firstNeed) {
    this.level = 1;
    this.xp = 0;
    this.need = firstNeed ?? xpNeed(1);
    this.pending = 0;
    this.gainMult = 1; // 영기 획득량 배율 (2b 보조 법술)
  }

  add(value) {
    this.xp += value * this.gainMult;
    while (this.xp >= this.need) {
      this.xp -= this.need;
      this.level++;
      this.need = xpNeed(this.level);
      this.pending++;
    }
  }

  get ratio() { return Math.min(1, this.xp / this.need); }
}
