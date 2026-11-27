import { BALANCE } from '../config/balance.js';

// 웨이브: 장소마다 1분 = 웨이브 2개(30초씩). 장소 번호가 오를수록 뒤쪽(센) 웨이브.
//   장소 0: 웨이브 1·2 · 장소 1: 3·4 · 장소 2: 5·6 · 장소 3: 7·7. 대형 요괴가 나오면 마지막(보스) 웨이브(요괴 적게)
// 게임 안 시계로만 잰다.
export class Waves {
  constructor(scene) {
    this.scene = scene;
    this.cfg = BALANCE.waves;
    this.index = -1;     // 지금 웨이브 (0부터)
    this.acc = 0;        // 나올 요괴 누적
    this.eliteQueue = [];
    this.countMult = 1;  // 요괴 수 배율 (첫 판 등)
  }

  get wave() { return this.cfg.list[this.index]; }

  /** 지금 장소·시간에 맞는 웨이브 번호 */
  waveIndex(now) {
    const ar = this.scene.arena;
    const last = this.cfg.list.length - 1; // 보스 웨이브
    if (this.scene.bosses.current) return last;
    const local = Math.floor(ar.placeTime(now) / (this.cfg.waveSec * 1000));
    return Math.min(ar.index * 2 + Math.min(local, 1), last - 1);
  }

  update(dt, now) {
    const sc = this.scene;
    const idx = this.waveIndex(now);
    if (idx !== this.index) this.startWave(idx, now);
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
    this.eliteQueue = (w.elites ?? []).map((s) => now + s * 1000);
    for (let i = 0; i < (w.chests ?? 0); i++) this.scene.chests.dropNearPlayer();
    // 장소의 첫 웨이브는 장소 알림이, 보스 웨이브는 보스 알림이 대신
    const firstOfPlace = this.scene.arena.placeTime(now) < 1000;
    if (!w.boss && !firstOfPlace) this.scene.hud.banner(`웨이브 ${idx + 1}`, w.label);
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
