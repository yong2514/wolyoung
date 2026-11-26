import { BALANCE } from '../../config/balance.js';

// 공격 법술 공통: 단계별 수치 읽기, 쿨타임
export class AttackSpell {
  constructor(scene, book, key) {
    this.scene = scene;
    this.book = book;
    this.key = key;
    this.cfg = BALANCE.spells[key];
    this.level = 1;
    this.nextAt = 0;
  }

  setLevel(level) { this.level = level; }

  /** 단계별 값([ ])이면 지금 단계 값, 하나면 그 값 */
  stat(name) {
    const v = this.cfg[name];
    return Array.isArray(v) ? v[this.level - 1] : v;
  }

  damage() { return this.stat('damage') * this.book.damageMult; }

  cooldown() { return this.stat('cooldownMs') * this.book.cooldownMult; }

  /** 쿨타임이 끝났으면 true (다음 시간은 부르는 쪽이 정한다) */
  ready(now) { return now >= this.nextAt; }

  update() {}
}
