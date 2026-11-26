import { BALANCE } from '../config/balance.js';
import { Pool } from './pool.js';
import { sfx } from './audio.js';

// 영기 구슬: 요괴가 떨어뜨리고, 가까이 가면 끌려오고, 닿으면 영기를 준다.
// 화면에 max개가 넘으면 오래된 것부터 mergeCount개를 큰 구슬 하나로 합친다.
export class Orbs {
  constructor(scene) {
    this.scene = scene;
    this.cfg = BALANCE.orbs;
    this.magnetRange = this.cfg.magnetRange;
    this.serial = 0;
    this.pool = new Pool(() => ({
      sprite: scene.add.image(0, 0, 'orb').setVisible(false).setDepth(6),
      x: 0, y: 0, value: 0, serial: 0, pulled: false, v: 0,
    }), this.cfg.max + 10, 100);
  }

  get count() { return this.pool.count; }

  drop(x, y, value) {
    if (this.count >= this.cfg.max) this.merge();
    const o = this.pool.get();
    if (!o) return;
    o.x = x; o.y = y;
    o.value = value;
    o.serial = this.serial++;
    o.pulled = false;
    o.v = 0;
    o.sprite.setPosition(x, y).setScale(value > 1 ? Math.min(2.2, 1 + Math.log2(value) * 0.25) : 1).setVisible(true);
  }

  /** 오래된 구슬 mergeCount개 → 그중 가장 오래된 자리에 큰 구슬 하나 */
  merge() {
    const list = this.pool.active.slice().sort((a, b) => a.serial - b.serial).slice(0, this.cfg.mergeCount);
    let sum = 0;
    for (const o of list) { sum += o.value; this.free(o); }
    const keep = list[0];
    this.drop(keep.x, keep.y, sum);
  }

  update(dt) {
    const sc = this.scene;
    const p = sc.player;
    const s = dt / 1000;
    const mag2 = this.magnetRange * this.magnetRange;
    const pick = p.radius + this.cfg.pickRadius;
    const list = this.pool.active;
    let gained = 0;
    for (let i = list.length - 1; i >= 0; i--) {
      const o = list[i];
      const dx = p.x - o.x;
      const dy = p.y - o.y;
      const d2 = dx * dx + dy * dy;
      if (!o.pulled) {
        if (d2 > mag2) continue;
        o.pulled = true;
        o.v = this.cfg.pullSpeed;
      }
      const d = Math.sqrt(d2);
      if (d <= pick) {
        gained += o.value;
        this.free(o);
        continue;
      }
      o.v += this.cfg.pullAccel * s;
      const step = Math.min(d, o.v * s);
      o.x += (dx / d) * step;
      o.y += (dy / d) * step;
      o.sprite.setPosition(o.x, o.y);
    }
    if (gained) {
      sfx.play('pickup');
      sc.leveling.add(gained);
    }
  }

  free(o) {
    o.sprite.setVisible(false);
    this.pool.release(o);
  }
}
