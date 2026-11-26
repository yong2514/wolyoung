import { sfx } from '../audio.js';
import { AttackSpell } from './base.js';

// 호신강기: 몸 주위를 도는 기운 구슬. 같은 요괴는 hitCooldownMs마다 한 번만 때린다.
// 구슬 하나는 요괴와 hitsPerOrb번 부딪치면 깨진다. 모두 깨지면 법술을 잃는다(카드로 다시 얻을 수 있음).
export class Guard extends AttackSpell {
  constructor(scene, book, key = 'guard', tint = null) {
    super(scene, book, key);
    this.near = [];
    this.orbs = []; // { sprite, hitsLeft }
    this.angle = 0;
    this.tint = tint; // 청염강기는 푸른 불꽃 색
  }

  /** 단계를 얻거나 올리면 구슬을 새것으로 모두 채운다 */
  setLevel(level) {
    super.setLevel(level);
    const n = this.stat('count');
    while (this.orbs.length < n) {
      const sprite = this.scene.add.image(0, 0, 'guardOrb').setDepth(24);
      if (this.tint) sprite.setTint(this.tint).setScale(this.stat('orbRadius') / 11);
      this.orbs.push({ sprite, hitsLeft: 0 });
    }
    for (const o of this.orbs) {
      o.hitsLeft = this.stat('hitsPerOrb');
      o.sprite.setVisible(true).setAlpha(1);
    }
  }

  update(dt, now) {
    const sc = this.scene;
    const p = sc.player;
    const alive = this.orbs.filter((o) => o.hitsLeft > 0);
    if (!alive.length) return;
    const orbit = this.stat('orbit');
    const R = this.stat('orbRadius');
    const hitCd = this.stat('hitCooldownMs');
    const kb = this.stat('knockback');
    const maxHits = this.stat('hitsPerOrb');
    const dmg = this.damage();
    this.angle += (this.stat('spin') * dt) / 1000;

    for (let i = 0; i < alive.length; i++) {
      const orb = alive[i];
      const a = this.angle + (i * Math.PI * 2) / alive.length; // 남은 구슬끼리 고르게
      const ox = p.x + Math.cos(a) * orbit;
      const oy = p.y + Math.sin(a) * orbit;
      orb.sprite.setPosition(ox, oy).setRotation(-a * 2);
      const m = sc.grid.queryInto(ox, oy, R + 20, this.near);
      for (let j = 0; j < m && orb.hitsLeft > 0; j++) {
        const e = this.near[j];
        if (!e.alive || now < e.guardNext) continue;
        const dx = e.x - ox;
        const dy = e.y - oy;
        const rr = R + e.radius;
        if (dx * dx + dy * dy > rr * rr) continue;
        e.guardNext = now + hitCd;
        // 플레이어 반대쪽으로 살짝 밀어낸다
        const px = e.x - p.x;
        const py = e.y - p.y;
        const d = Math.hypot(px, py) || 1;
        e.x += (px / d) * kb;
        e.y += (py / d) * kb;
        sc.enemies.hit(e, dmg, now);
        if (!Number.isFinite(maxHits)) continue; // 청염강기: 깨지지 않음
        orb.hitsLeft--;
        orb.sprite.setAlpha(0.35 + 0.65 * (orb.hitsLeft / maxHits)); // 닳을수록 흐려짐
        if (orb.hitsLeft <= 0) this.breakOrb(orb, ox, oy);
      }
    }
    if (this.orbs.every((o) => o.hitsLeft <= 0)) this.book.forget(this.key);
  }

  breakOrb(orb, x, y) {
    orb.sprite.setVisible(false);
    this.scene.effects.burst(x, y, 0xbcd4ff, 8);
    this.scene.effects.flash('ring', x, y, { life: 220, scale: 0.3, scaleTo: 0.9, tint: 0xbcd4ff });
    sfx.play('kill');
  }

  destroy() {
    for (const o of this.orbs) o.sprite.destroy();
    this.orbs.length = 0;
  }
}
