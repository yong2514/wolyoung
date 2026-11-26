// 오브젝트 풀: 요괴·탄·숫자·파티클을 지우지 않고 다시 쓴다 (버벅임 방지).

export class Pool {
  /**
   * @param factory 새 물건을 만드는 함수
   * @param max     최대 개수 (넘으면 get()이 null)
   * @param prewarm 미리 만들어 둘 개수
   */
  constructor(factory, max, prewarm = 0) {
    this.factory = factory;
    this.max = max;
    this.free = [];
    this.active = [];
    this.total = 0;
    for (let i = 0; i < Math.min(prewarm, max); i++) {
      const o = factory();
      o._poolIndex = -1;
      this.free.push(o);
      this.total++;
    }
  }

  get count() { return this.active.length; }

  get() {
    let o = this.free.pop();
    if (!o) {
      if (this.total >= this.max) return null;
      o = this.factory();
      this.total++;
    }
    o._poolIndex = this.active.length;
    this.active.push(o);
    return o;
  }

  /** 돌려놓기. active를 뒤에서부터 돌면서 release해도 안전하다. */
  release(o) {
    const i = o._poolIndex;
    if (i < 0) return;
    const last = this.active.pop();
    if (last !== o) {
      this.active[i] = last;
      last._poolIndex = i;
    }
    o._poolIndex = -1;
    this.free.push(o);
  }
}
