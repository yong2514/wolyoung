// 자동 플레이 (?debug=1&auto=1): 바닥에 카드가 있으면 가장 가까운 카드를 주우러 가고,
// 보스가 있으면 보스 둘레를 돌며 싸우고, 아니면 무작위로 움직인다. 부활은 4단계에서 붙인다.
export class AutoPlayer {
  constructor(rng) {
    this.rng = rng;
    this.vec = { x: 0, y: 0 };
    this.changeIn = 0;
  }

  vector(dt, scene) {
    const target = this.oldestCard(scene);
    if (target) {
      const p = scene.player;
      const dx = target.x - p.x;
      const dy = target.y - p.y;
      const d = Math.hypot(dx, dy) || 1;
      this.vec.x = dx / d;
      this.vec.y = dy / d;
      this.changeIn = 0;
      return this.vec;
    }
    // 보스가 있으면 보스 둘레(약 200)를 돌며 싸운다
    const boss = scene.bosses.king?.alive ? scene.bosses.king : scene.bosses.mid?.alive ? scene.bosses.mid : null;
    if (boss) {
      const p = scene.player;
      const dx = boss.x - p.x;
      const dy = boss.y - p.y;
      const d = Math.hypot(dx, dy) || 1;
      const toward = d > 240 ? 1 : d < 160 ? -1 : 0;
      this.vec.x = (dx / d) * toward + (-dy / d) * 0.8;
      this.vec.y = (dy / d) * toward + (dx / d) * 0.8;
      const m = Math.hypot(this.vec.x, this.vec.y) || 1;
      this.vec.x /= m; this.vec.y /= m;
      return this.vec;
    }
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

  /** 가장 가까운 카드 (주우러 가는 시간을 줄인다) */
  oldestCard(scene) {
    const p = scene.player;
    let best = null;
    let bestD = Infinity;
    for (const o of scene.fieldCards.list) {
      if (!o.card) continue;
      const d = (o.x - p.x) ** 2 + (o.y - p.y) ** 2;
      if (d < bestD) { bestD = d; best = o; }
    }
    return best;
  }
}
