import { BALANCE } from '../config/balance.js';

// 웨이브: 30초마다 바뀌는 요괴 수·종류·정예·보물상자. 게임 안 시계로만 잰다.
export class Waves {
  constructor(scene) {
    this.scene = scene;
    this.cfg = BALANCE.waves;
    this.index = -1;     // 지금 웨이브 (0부터)
    this.acc = 0;        // 나올 요괴 누적
    this.eliteQueue = [];
    this.countMult = 1;  // 요괴 수 배율 (첫 판 등, 4단계)
  }

  get wave() { return this.cfg.list[Math.min(this.index, this.cfg.list.length - 1)]; }

  /** 웨이브 진행 비율 0~1 */
  progress(now) {
    return Math.min(1, (now % (this.cfg.waveSec * 1000)) / (this.cfg.waveSec * 1000));
  }

  update(dt, now) {
    const sc = this.scene;
    const idx = Math.min(Math.floor(now / (this.cfg.waveSec * 1000)), this.cfg.list.length - 1);
    if (idx !== this.index && now < this.cfg.bossAtSec * 1000) this.startWave(idx, now);
    const w = this.wave;
    const en = sc.enemies;

    this.acc += (w.rate * this.countMult * dt) / 1000;
    while (this.acc >= 1) {
      this.acc -= 1;
      if (en.count >= en.cap) { en.upgradeOne(now); continue; } // 상한: 수 대신 더 센 요괴로
      en.spawnRing(this.pickKey(w), now);
    }
    while (this.eliteQueue.length && now >= this.eliteQueue[0]) {
      this.eliteQueue.shift();
      en.cap += 1; // 정예는 상한과 상관없이 나오게
      en.spawnRing(this.pickKey(w, true), now, true);
      en.cap -= 1;
    }
  }

  startWave(idx, now) {
    this.index = idx;
    const w = this.wave;
    const start = idx * this.cfg.waveSec * 1000;
    this.eliteQueue = (w.elites ?? []).map((s) => start + s * 1000).filter((t) => t >= now);
    for (let i = 0; i < (w.chests ?? 0); i++) this.scene.chests.dropNearPlayer();
    this.scene.hud.banner(`웨이브 ${idx + 1}`, w.label);
  }

  /** 웨이브 비율(mix)대로 요괴 종류 고르기. 정예는 분열 조각 대신 다른 종류 */
  pickKey(w, elite = false) {
    const sc = this.scene;
    let r = sc.rng.next();
    let kind = 'chaser';
    for (const [k, v] of Object.entries(w.mix)) {
      if (r < v) { kind = k; break; }
      r -= v;
    }
    if (kind === 'chaser' || (elite && kind === 'splitter')) return sc.enemies.chaserKey();
    return kind;
  }
}
