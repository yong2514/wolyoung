// 시드 난수: 게임의 모든 무작위는 여기서만 만든다 (Math.random 금지).
// 같은 시드 → 같은 수열 → 같은 요괴 흐름·같은 카드.

function hashString(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

export class Rng {
  constructor(seed) {
    this.seed = seed >>> 0;
    this.state = this.seed || 0x9e3779b9;
  }

  /** 0 이상 1 미만 (mulberry32) */
  next() {
    let t = (this.state = (this.state + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** a 이상 b 미만 실수 */
  range(a, b) { return a + (b - a) * this.next(); }

  /** a 이상 b 이하 정수 */
  int(a, b) { return a + Math.floor(this.next() * (b - a + 1)); }

  pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }

  chance(p) { return this.next() < p; }

  /** 같은 시드에서 갈라진 다른 수열 (예: 'fx'는 화면 효과용 — 게임 흐름에 영향 없음) */
  fork(tag) { return new Rng((this.seed ^ hashString(tag)) >>> 0); }
}

/** 새 판의 시드를 정한다 (시드를 고르는 데에만 시각을 쓴다) */
export function newSeed() {
  return (Date.now() ^ Math.floor(performance.now() * 1000)) >>> 0;
}
