import { BALANCE } from '../config/balance.js';
import { PARAMS } from './params.js';

// 프레임 재기: 평균 프레임을 모으고, 계속 느리면 파티클 → 요괴 상한 순으로 줄인다.
// (화면에 보이는 값만 재므로 여기서는 실제 시간을 쓴다)
export class PerfMonitor {
  constructor(scene) {
    this.scene = scene;
    this.cfg = BALANCE.performance;
    this.sum = 0;
    this.samples = 0;
    this.acc = 0;
    this.warmup = 1000; // 처음 1초는 로딩 때문에 빼고 잰다
    this.slowSec = 0;
  }

  get fps() { return this.scene.game.loop.actualFps; }
  get avg() { return this.samples ? this.sum / this.samples : 0; }

  update(delta) {
    if (this.warmup > 0) { this.warmup -= delta; return; }
    this.acc += delta;
    if (this.acc < 500) return;
    this.acc = 0;
    if (this.scene.state !== 'play') return;
    const fps = this.fps;
    this.sum += fps;
    this.samples++;
    // 자동 플레이를 빨리 돌릴 때는 일부러 느려지므로 줄이지 않는다
    if (PARAMS.speed > 1) return;
    if (fps < this.cfg.lowFps) {
      this.slowSec += 0.5;
      if (this.slowSec >= this.cfg.checkSec) { this.slowSec = 0; this.degrade(); }
    } else {
      this.slowSec = 0;
    }
  }

  degrade() {
    const fx = this.scene.effects;
    const en = this.scene.enemies;
    if (fx.particleScale > this.cfg.minParticleScale) fx.particleScale *= this.cfg.particleStep;
    else en.cap = Math.max(BALANCE.limits.enemyCapMin, en.cap - this.cfg.capStep);
  }
}
