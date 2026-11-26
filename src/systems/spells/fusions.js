import { sfx } from '../audio.js';
import { AttackSpell } from './base.js';
import { FlyingSword } from './flyingSword.js';
import { Guard } from './guard.js';

// 합일 법술 4종. 단계 없음 (balance_spells.js의 값이 하나씩)

/** 뇌정만검 = 비검 + 뇌부: 검 다섯 자루, 맞힐 때 확률로 낙뢰 */
export class ThunderSword extends FlyingSword {
  constructor(scene, book) {
    super(scene, book, 'thunderSword');
    this.boltNear = [];
  }

  onHit(e, now) {
    const sc = this.scene;
    if (sc.rng.next() >= this.stat('boltChance')) return;
    const x = e.x;
    const y = e.y;
    const r = this.stat('boltRadius');
    sc.effects.flash('bolt', x, y, { life: 160, originY: 1, tint: 0xd6e6ff, depth: 28 });
    sc.effects.flash('ring', x, y, { life: 220, scale: 0.4, scaleTo: r / 32, tint: 0xbcd4ff, depth: 27 });
    const n = sc.grid.queryInto(x, y, r + 20, this.boltNear);
    for (let i = 0; i < n; i++) {
      const o = this.boltNear[i];
      if (!o.alive) continue;
      const dx = o.x - x;
      const dy = o.y - y;
      if (dx * dx + dy * dy <= (r + o.radius) ** 2) sc.enemies.hit(o, this.stat('boltDamage') * this.book.damageMult, now);
    }
    sfx.play('thunder');
  }
}

/** 빙련결계 = 연화진 + 빙결: 나를 따라다니는 얼음 연꽃 */
export class FrostLotus extends AttackSpell {
  constructor(scene, book) {
    super(scene, book, 'frostLotus');
    this.near = [];
    this.nextTick = 0;
    const r = this.stat('radius');
    this.sprite = scene.add.image(0, 0, 'lotus').setDepth(5).setTint(0xa8e4ff).setScale(r / 64).setAlpha(0.7);
    this.edge = scene.add.image(0, 0, 'ring').setDepth(5).setTint(0xcfefff).setScale(r / 32).setAlpha(0.5);
  }

  update(dt, now) {
    const sc = this.scene;
    const p = sc.player;
    this.sprite.setPosition(p.x, p.y).setRotation(now / 1800);
    this.edge.setPosition(p.x, p.y);
    if (now < this.nextTick) return;
    this.nextTick = now + this.stat('tickMs');
    const r = this.stat('radius');
    const n = sc.grid.queryInto(p.x, p.y, r + 20, this.near);
    for (let i = 0; i < n; i++) {
      const e = this.near[i];
      if (!e.alive) continue;
      const dx = e.x - p.x;
      const dy = e.y - p.y;
      if (dx * dx + dy * dy > r * r) continue;
      sc.enemies.slow(e, this.stat('slowMult'), this.stat('slowMs'), now);
      sc.enemies.hit(e, this.damage(), now);
    }
  }

  destroy() { this.sprite.destroy(); this.edge.destroy(); }
}

/** 청염강기 = 호신강기 + 청염: 깨지지 않는 푸른 불꽃 구슬 */
export class FlameGuard extends Guard {
  constructor(scene, book) {
    super(scene, book, 'flameGuard', 0x6fb8ff);
  }
}

/** 월하봉마진 = 부적진 + 월륜: 주기적으로 큰 봉인진 → 안의 요괴 멈춤 + 피해 */
export class MoonSeal extends AttackSpell {
  constructor(scene, book) {
    super(scene, book, 'moonSeal');
    this.near = [];
  }

  update(dt, now) {
    if (!this.ready(now)) return;
    const sc = this.scene;
    const p = sc.player;
    const r = this.stat('radius');
    const n = sc.grid.queryInto(p.x, p.y, r + 20, this.near);
    for (let i = 0; i < n; i++) {
      const e = this.near[i];
      if (!e.alive) continue;
      const dx = e.x - p.x;
      const dy = e.y - p.y;
      if (dx * dx + dy * dy > (r + e.radius) ** 2) continue;
      sc.enemies.stun(e, this.stat('stunMs'), now);
      sc.enemies.hit(e, this.damage(), now);
    }
    const fx = sc.effects;
    fx.flash('ring', p.x, p.y, { life: 600, scale: 0.2, scaleTo: r / 32, tint: 0xe6dcff, depth: 26 });
    fx.flash('lotus', p.x, p.y, { life: 600, scale: (r / 64) * 0.5, scaleTo: r / 64, tint: 0xf3e6b0, alpha: 0.6, depth: 5 });
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 + now / 500;
      fx.flash('moonRing', p.x + Math.cos(a) * r * 0.8, p.y + Math.sin(a) * r * 0.8, { life: 500, scale: 1.2, scaleTo: 0.4 });
    }
    sfx.play('annihilate');
    this.nextAt = now + this.cooldown();
  }
}
