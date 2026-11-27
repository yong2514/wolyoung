import { BALANCE } from '../config/balance.js';
import { GAME_WIDTH as W, GAME_HEIGHT as H, FONT } from '../config/display.js';
import { SPELLS } from '../data/spells.js';
import { Pool } from './pool.js';
import { sfx } from './audio.js';
import { rollCards, recheckCard, readyFusion } from './cards.js';

const GOLD = 0xffd36a;
const COLOR = { attack: 0xa9b8ff, support: 0x8fe0d0, item: 0xd9ccff, fusion: GOLD };

/** 카드 색: 전설·합일 금빛, 희귀 하늘색, 나머지는 종류 색 */
export function cardColor(c) {
  if (c.kind === 'fusion' || c.rarity === 'legend') return GOLD;
  if (c.rarity === 'rare') return 0x7fe0ff;
  return COLOR[c.kind] ?? COLOR.attack;
}

// 바닥에 떨어진 레벨업 카드 (사용자 요청: 고르는 화면 대신 주우러 간다)
//  레벨업 → 카드 3장이 주인공에게서 떨어진 서로 다른 방향에 떨어진다 → 하나를 지나가며 주우면 적용, 같은 무리의 나머지는 사라짐
export class FieldCards {
  constructor(scene) {
    this.scene = scene;
    this.cfg = BALANCE.fieldCards;
    this.group = 0;
    this.pool = new Pool(() => ({
      glow: scene.add.image(0, 0, 'aura').setDepth(11).setVisible(false),
      sprite: scene.add.image(0, 0, 'fieldCard').setDepth(12).setVisible(false),
      label: scene.add.text(0, 0, '', {
        fontFamily: FONT, fontSize: '12px', fontStyle: 'bold', color: '#ffffff', stroke: '#0b0f26', strokeThickness: 3,
      }).setOrigin(0.5, 1).setDepth(13).setVisible(false),
      x: 0, y: 0, card: null, group: 0, born: 0,
    }), this.cfg.max, 9);
  }

  get list() { return this.pool.active; }

  /** 레벨업 한 번 → 카드 무리 하나 */
  dropGroup(now) {
    const sc = this.scene;
    const rng = sc.cardRng; // 카드 전용 난수 (같은 시드 = 같은 카드·같은 자리)
    const cards = rollCards(sc.book, rng);
    const p = sc.player;
    const g = ++this.group;
    const base = rng.next() * Math.PI * 2;
    cards.forEach((c, i) => {
      const o = this.pool.get();
      if (!o) { this.apply(c); return; } // 바닥이 가득 차면 바로 적용
      const a = base + (i * Math.PI * 2) / cards.length + (rng.next() - 0.5) * 0.6;
      const d = rng.range(this.cfg.minDist, this.cfg.maxDist);
      o.card = c;
      o.group = g;
      o.born = now;
      this.place(o, sc.arena.clamp({ x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d }, 40)); // 결계 벽 안
      const col = cardColor(c);
      o.sprite.setTint(col).setScale(c.rarity === 'legend' || c.kind === 'fusion' ? 1.2 : 1).setVisible(true);
      o.glow.setTint(col).setVisible(true);
      const star = c.rarity === 'legend' ? '★' : c.rarity === 'rare' ? '☆' : '';
      const name = c.kind === 'fusion' ? `합일 ${c.name}` : c.isNew || c.kind === 'item' ? c.name : `${c.name} ${c.to}단계`;
      o.label.setText(star + name).setColor(`#${col.toString(16).padStart(6, '0')}`).setVisible(true);
    });
    if (sc.stats.firstCardMs === null) sc.stats.firstCardMs = now;
    sfx.play('levelup');
    sc.effects.flash('ring', p.x, p.y, { life: 400, scale: 0.5, scaleTo: 3, tint: 0xbff0ff, depth: 40 });
  }

  /** 카드를 (x,y)에 놓기 (장소를 옮길 때도 씀) */
  place(o, pt) {
    o.x = pt.x;
    o.y = pt.y;
    o.sprite.setPosition(o.x, o.y);
    o.glow.setPosition(o.x, o.y);
    o.label.setPosition(o.x, o.y - 22);
  }

  update(dt, now) {
    const p = this.scene.player;
    const r = this.cfg.pickRadius + p.radius;
    const list = this.pool.active;
    for (let i = list.length - 1; i >= 0; i--) {
      const o = list[i];
      if (!o.card) continue;
      const bob = Math.sin((now - o.born) / 260) * 4; // 둥실둥실
      o.sprite.setPosition(o.x, o.y + bob);
      o.label.setPosition(o.x, o.y + bob - 22);
      o.glow.setPosition(o.x, o.y).setScale(0.7 + 0.12 * Math.sin((now - o.born) / 200)).setAlpha(0.9);
      if ((p.x - o.x) ** 2 + (p.y - o.y) ** 2 < r * r) { this.pick(o); return; } // 한 걸음에 하나만
    }
  }

  pick(o) {
    const sc = this.scene;
    const c = o.card;
    const msg = this.apply(c);
    // 같은 무리의 나머지 카드는 사라짐
    for (const other of this.pool.active.slice()) {
      if (other.group !== o.group || other === o) continue;
      sc.effects.flash('ring', other.x, other.y, { life: 300, scale: 0.6, scaleTo: 0.1, tint: cardColor(other.card), alpha: 0.7 });
      this.free(other);
    }
    sc.effects.flash('ring', o.x, o.y, { life: 450, scale: 0.4, scaleTo: 2.5, tint: cardColor(c), depth: 40 });
    sc.effects.burst(o.x, o.y, cardColor(c), 12);
    this.free(o);
    const t = sc.add.text(W / 2, H * 0.3, msg, {
      fontFamily: FONT, fontSize: '24px', fontStyle: 'bold', color: `#${cardColor(c).toString(16).padStart(6, '0')}`,
      stroke: '#0b0f26', strokeThickness: 5,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(250).setPadding(10);
    sc.tweens.add({ targets: t, alpha: 0, y: H * 0.27, delay: 900, duration: 500, onComplete: () => t.destroy() });
  }

  /** 카드 효과 적용. 화면에 띄울 글을 돌려준다 */
  apply(c) {
    const sc = this.scene;
    const book = sc.book;
    if (c.kind === 'fusion') {
      if (readyFusion(book) === c.key) { this.fuse(c.key); return `합일 · ${c.name}!`; }
    } else if (c.kind !== 'item') {
      const now = recheckCard(book, { key: c.key, gain: c.gain });
      if (now.usable) {
        book.learn(c.key, now.to);
        sfx.play(c.rarity === 'legend' ? 'levelup' : 'pick');
        return now.from === 0 ? `${c.name} 습득!` : `${c.name} ${now.to}단계!`;
      }
    }
    sc.player.heal(BALANCE.elixirHeal); // 영약 · 이미 쓸 수 없게 된 카드
    sfx.play('pick');
    return `영약 · 체력 +${BALANCE.elixirHeal}`;
  }

  /** 합일 연출: 금빛 고리 + 큰 글씨 */
  fuse(key) {
    const sc = this.scene;
    sc.book.fuse(key);
    const p = sc.player;
    sc.effects.flash('ring', p.x, p.y, { life: 700, scale: 0.3, scaleTo: 5, tint: GOLD, depth: 40 });
    sc.effects.burst(p.x, p.y, GOLD, 20);
    sc.effects.shake('hurt');
    sfx.play('levelup');
    const t = sc.add.text(W / 2, H * 0.36, `${SPELLS[key].name}!`, {
      fontFamily: FONT, fontSize: '44px', fontStyle: 'bold', color: '#ffe7a8', stroke: '#3a3018', strokeThickness: 6,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(250).setPadding(12);
    sc.tweens.add({ targets: t, alpha: 0, y: H * 0.33, delay: 900, duration: 500, onComplete: () => t.destroy() });
  }

  free(o) {
    o.card = null;
    o.sprite.setVisible(false);
    o.glow.setVisible(false);
    o.label.setVisible(false);
    this.pool.release(o);
  }
}
