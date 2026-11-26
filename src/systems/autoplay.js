// 자동 플레이 (?debug=1&auto=1): 무작위로 움직인다. 카드·부활은 해당 단계에서 붙인다.
export class AutoPlayer {
  constructor(rng) {
    this.rng = rng;
    this.vec = { x: 0, y: 0 };
    this.changeIn = 0;
  }

  vector(dt) {
    this.changeIn -= dt;
    if (this.changeIn <= 0) {
      this.changeIn = this.rng.range(600, 1800);
      const a = this.rng.next() * Math.PI * 2;
      const m = this.rng.chance(0.15) ? 0 : 1; // 가끔 멈춰 선다
      this.vec.x = Math.cos(a) * m;
      this.vec.y = Math.sin(a) * m;
    }
    return this.vec;
  }
}
