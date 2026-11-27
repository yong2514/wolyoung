import { BALANCE } from '../config/balance.js';
import { FONT } from '../config/display.js';
import { COMPANIONS } from '../data/companions.js';
import { Pool } from './pool.js';
import { sfx } from './audio.js';

const TINT = 0xc8d4ff; // 동료 법술 색 (연하게)

// 동료 (기획서 4번): 주인공 뒤를 따라다니고, 멀어지면 곁으로 순간이동, 피해를 받지 않는다.
// 서하 · 천검결: 주기적으로 둘레 요괴에게 검비. 부활 때는 크게 한 번(burst).
// 사용자 요청: 늘 있지 않고 「서하」 버튼으로 부를 때만 summon.durationMs 동안 나온다 (다시 부르기까지 cooldownMs)
export class Companion {
  constructor(scene, key) {
    this.scene = scene;
    this.key = key;
    this.def = COMPANIONS[key];
    this.cfg = BALANCE.companion;
    this.skill = this.cfg[key];
    const p = scene.player;
    this.x = p.x - this.cfg.followDist;
    this.y = p.y;
    this.shadow = scene.add.image(this.x, this.y, 'shadow').setDepth(2).setScale(0.75);
    this.sprite = scene.add.image(this.x, this.y, this.def.texture).setDepth(18).setOrigin(0.5, 0.6);
    this.bubble = scene.add.text(0, 0, '', {
      fontFamily: FONT, fontSize: '15px', fontStyle: 'bold', color: '#0b0f26',
      backgroundColor: '#dfe4f2', padding: { x: 8, y: 4 },
    }).setOrigin(0.5, 1).setDepth(70).setVisible(false);
    this.nextSkill = this.skill.firstMs;
    this.near = [];
    this.swords = new Pool(() => scene.add.image(0, 0, 'sword').setVisible(false).setDepth(27), 40, 10);
    this.walkT = 0;
    this.active = false;   // 지금 함께 있나
    this.until = 0;        // 이때 떠남
    this.readyAt = 0;      // 이때부터 다시 부를 수 있음
    this.setVisible(false);
  }

  /** 궁합 법술 (카드 '인연' 표시, 효과 +20%) — 함께 있을 때만 */
  get synergy() { return this.active ? this.def.synergy : null; }

  setVisible(v) {
    this.sprite.setVisible(v);
    this.shadow.setVisible(v);
  }

  /** 곁에 나타나기 (부르기·부활·말할 때) */
  appear() {
    const p = this.scene.player;
    this.x = p.x - (p.dirX || 1) * this.cfg.followDist;
    this.y = p.y;
    this.sprite.setPosition(this.x, this.y);
    this.shadow.setPosition(this.x, this.y + 20);
    this.setVisible(true);
    this.scene.effects.flash('ring', this.x, this.y, { life: 350, scale: 0.1, scaleTo: 0.9, tint: TINT, alpha: 0.8 });
  }

  /** 「서하」 버튼: 부르기. 불렀으면 true */
  summon(now) {
    const S = this.cfg.summon;
    if (this.active || now < this.readyAt || this.scene.state !== 'play') return false;
    this.active = true;
    this.until = now + S.durationMs;
    this.readyAt = now + S.cooldownMs;
    this.nextSkill = now + 400;
    this.appear();
    this.say('검이 필요하냐.');
    sfx.play('veil');
    return true;
  }

  /** 다시 부르기까지 남은 비율 (0이면 부를 수 있음) */
  cooldownLeft(now) {
    if (this.active) return 1;
    return Math.max(0, (this.readyAt - now) / this.cfg.summon.cooldownMs);
  }

  leave() {
    this.active = false;
    this.scene.effects.flash('ring', this.x, this.y, { life: 400, scale: 0.8, scaleTo: 0.1, tint: TINT, alpha: 0.8 });
    this.setVisible(false);
  }

  update(dt, now) {
    if (!this.active) return;
    if (now >= this.until) { this.leave(); return; }
    const p = this.scene.player;
    const c = this.cfg;
    // 주인공 뒤쪽 자리로
    const tx = p.x - (p.dirX || 1) * c.followDist;
    const ty = p.y - p.dirY * c.followDist * 0.6;
    const dx = tx - this.x;
    const dy = ty - this.y;
    const d = Math.hypot(dx, dy);
    if (d > c.teleportDist) { // 너무 멀면 곁으로 순간이동
      this.scene.effects.flash('ring', this.x, this.y, { life: 250, scale: 0.4, scaleTo: 0.1, tint: TINT, alpha: 0.7 });
      this.x = tx; this.y = ty;
      this.scene.effects.flash('ring', tx, ty, { life: 300, scale: 0.1, scaleTo: 0.6, tint: TINT, alpha: 0.7 });
    } else if (d > 2) {
      const sp = Math.max(p.speed * 1.1, d * 5) * (dt / 1000);
      const k = Math.min(1, sp / d);
      this.x += dx * k; this.y += dy * k;
      this.walkT += dt;
    } else {
      this.walkT = 0;
    }
    if (Math.abs(dx) > 1) this.sprite.flipX = dx < 0;
    const bob = this.walkT ? -Math.abs(Math.sin(this.walkT / 120)) * 2 : 0;
    this.sprite.setPosition(this.x, this.y + bob);
    this.shadow.setPosition(this.x, this.y + 20);
    this.bubble.setPosition(this.x, this.y - 40);

    if (now >= this.nextSkill) {
      this.cast(now, this.skill.swords, this.skill.damage);
      this.nextSkill = now + this.skill.cooldownMs;
    }
  }

  /** 천검결: 주인공 둘레 요괴 count마리에게 검이 떨어진다 (피해는 바로, 그림은 떨어지는 모습) */
  cast(now, count, damage) {
    const sc = this.scene;
    const p = sc.player;
    const n = sc.grid.queryInto(p.x, p.y, this.skill.radius, this.near);
    const targets = [];
    for (let i = 0; i < n; i++) if (this.near[i].alive) targets.push(this.near[i]);
    if (!targets.length) return;
    for (let k = 0; k < count && targets.length; k++) {
      const e = targets.splice(Math.floor(sc.rng.next() * targets.length), 1)[0];
      this.dropSword(e.x, e.y);
      sc.enemies.hit(e, damage * sc.book.damageMult, now);
    }
    sfx.play('shoot');
  }

  dropSword(x, y) {
    const s = this.swords.get();
    if (!s) return;
    s.setPosition(x, y - 160).setRotation(Math.PI / 2).setScale(1.3).setTint(TINT).setAlpha(this.cfg.effectAlpha).setVisible(true);
    this.scene.tweens.add({
      targets: s, y, duration: 160, ease: 'Quad.easeIn',
      onComplete: () => {
        s.setVisible(false);
        this.swords.release(s);
        this.scene.effects.flash('ring', x, y, { life: 200, scale: 0.2, scaleTo: 0.7, tint: TINT, alpha: this.cfg.effectAlpha });
      },
    });
  }

  /** 부활 순간: 크게 한 번 — 둘레 요괴를 쓸어내고(보스는 큰 피해) 검이 쏟아진다 */
  burst(now) {
    const sc = this.scene;
    const R = BALANCE.revive;
    const p = sc.player;
    const list = sc.enemies.pool.active;
    for (let i = list.length - 1; i >= 0; i--) {
      const e = list[i];
      if (!e.alive || Math.hypot(e.x - p.x, e.y - p.y) > R.burstRadius + e.radius) continue;
      if (e.def.boss) sc.enemies.hit(e, e.maxHp * R.bossBurstRatio, now);
      else sc.enemies.kill(e);
    }
    for (let k = 0; k < R.burstSwords; k++) {
      const a = (k / R.burstSwords) * Math.PI * 2;
      const d = 60 + (k % 3) * 70;
      this.dropSword(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d);
    }
    sc.effects.flash('ring', p.x, p.y, { life: 700, scale: 0.3, scaleTo: R.burstRadius / 32, tint: TINT, depth: 44 });
    sc.effects.shake('hurt');
    sfx.play('annihilate');
  }

  /** 말풍선 한 줄 (실제 시간 ms) */
  say(text, ms = 1800) {
    if (!this.active) { // 곁에 없을 때는 주인공 머리 위에 목소리만
      const p = this.scene.player;
      this.bubble.setPosition(p.x, p.y - 44);
    }
    this.bubble.setText(text).setVisible(true);
    this.scene.time.delayedCall(ms, () => this.bubble.setVisible(false));
  }
}
