import { BALANCE } from '../config/balance.js';
import { FONT } from '../config/display.js';
import { Pool } from './pool.js';
import { sfx } from './audio.js';

// 보물상자: 정예가 떨어뜨리거나 숨 고르기 웨이브에 놓인다. 닿으면 열림
//   가진 법술 중 올릴 수 있는 것 하나를 즉시 +1단계. 없으면 선옥 (5단계 재화, 지금은 기록만)
export class Chests {
  constructor(scene) {
    this.scene = scene;
    this.pool = new Pool(() => ({
      sprite: scene.add.image(0, 0, 'chest').setVisible(false).setDepth(8),
      x: 0, y: 0,
    }), 20, 4);
  }

  drop(x, y) {
    const c = this.pool.get();
    if (!c) return;
    c.x = x; c.y = y;
    c.sprite.setPosition(x, y).setVisible(true);
  }

  /** 플레이어 근처(화면 안)에 놓기 */
  dropNearPlayer() {
    const sc = this.scene;
    const a = sc.rng.next() * Math.PI * 2;
    const d = sc.rng.range(110, 170);
    const pt = sc.arena.clamp({ x: sc.player.x + Math.cos(a) * d, y: sc.player.y + Math.sin(a) * d }, 40);
    this.drop(pt.x, pt.y);
  }

  update(dt, now) {
    const sc = this.scene;
    const p = sc.player;
    const r = BALANCE.chest.radius + p.radius;
    const list = this.pool.active;
    for (let i = list.length - 1; i >= 0; i--) {
      const c = list[i];
      c.sprite.setScale(1 + 0.06 * Math.sin(now / 150));
      if ((p.x - c.x) ** 2 + (p.y - c.y) ** 2 < r * r) this.open(c);
    }
  }

  open(c) {
    const sc = this.scene;
    const book = sc.book;
    const ups = book.order.filter((k) => book.level(k) < book.maxLevel(k));
    let msg;
    if (ups.length) {
      const key = ups[Math.floor(sc.rng.next() * ups.length)];
      book.learn(key);
      msg = `보물상자: ${sc.spellName(key)} ${book.level(key)}단계!`;
    } else {
      sc.stats.seonok += BALANCE.chest.seonok;
      msg = `보물상자: 선옥 +${BALANCE.chest.seonok}`;
    }
    sc.stats.chests++;
    sfx.play('levelup');
    sc.effects.flash('ring', c.x, c.y, { life: 450, scale: 0.4, scaleTo: 2.5, tint: 0xffd36a, depth: 40 });
    sc.effects.burst(c.x, c.y, 0xffd36a, 14);
    const t = sc.add.text(c.x, c.y - 30, msg, {
      fontFamily: FONT, fontSize: '18px', fontStyle: 'bold', color: '#ffe7a8', stroke: '#0b0f26', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(70);
    sc.tweens.add({ targets: t, y: c.y - 70, alpha: 0, delay: 700, duration: 600, onComplete: () => t.destroy() });
    c.sprite.setVisible(false);
    this.pool.release(c);
  }
}
