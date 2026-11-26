import { BALANCE } from '../config/balance.js';
import { GAME_WIDTH as W, GAME_HEIGHT as H, FONT } from '../config/display.js';
import { SPELLS } from '../data/spells.js';
import { rollCards, stashCard } from '../systems/cards.js';
import { sfx } from '../systems/audio.js';
import { showCards } from '../ui/cards.js';
import { showStash } from '../ui/stash.js';

// 레벨업 카드 · 보관함 · 합일 흐름 (GameScene에서 부른다. sc = GameScene)

/** 레벨업: 시계를 멈추고 카드 3장. again이면 새로고침·봉인 뒤 다시 뽑기 */
export function openCards(sc, again = false) {
  sc.state = 'card';
  sc.joystick.reset();
  if (sc.stats.firstCardMs === null) sc.stats.firstCardMs = sc.clock.now;
  if (!again) {
    sfx.play('levelup');
    const p = sc.player;
    sc.effects.flash('ring', p.x, p.y, { life: 400, scale: 0.5, scaleTo: 3, tint: 0xbff0ff, depth: 40 });
  }
  const cards = rollCards(sc.book, sc.cardRng);
  const ui = showCards(sc, cards, {
    refreshLeft: sc.run.refresh,
    banishLeft: sc.run.banish,
    keepLeft: BALANCE.cards.stashMax - sc.stash.length,
    onPick: (i) => pickCard(sc, cards[i]),
    onRefresh: () => { sc.run.refresh--; openCards(sc, true); },
    onBanish: (i) => {
      const c = cards[i];
      if (c.kind === 'fusion' || c.kind === 'item') return false; // 합일·영약은 봉인 못 함
      sc.book.banned.add(c.key);
      sc.run.banish--;
      ui.destroy();
      openCards(sc, true);
      return true;
    },
    onKeep: (i) => { // 보관: 이번 레벨업은 카드를 보관함에 넣는 것으로 끝
      const c = cards[i];
      if (c.kind === 'fusion' || c.kind === 'item') return false;
      sc.stash.push({ key: c.key, gain: c.gain, rarity: c.rarity });
      sfx.play('pick');
      sc.leveling.pending--;
      sc.state = 'play';
      return true;
    },
  });
  if (sc.auto) sc.time.delayedCall(BALANCE.cardLockMs + 50, () => { ui.destroy(); pickCard(sc, cards[0]); });
}

function pickCard(sc, card) {
  if (sc.state !== 'card') return;
  sfx.play(card.rarity === 'legend' ? 'levelup' : 'pick');
  if (card.key === 'elixir') sc.player.heal(BALANCE.elixirHeal);
  else if (card.kind === 'fusion') fuse(sc, card.key);
  else sc.book.learn(card.key, card.to);
  sc.leveling.pending--;
  sc.state = 'play'; // 남은 레벨업이 있으면 update에서 바로 다음 카드를 연다
}

/** 보관함 열기 (게임 멈춤) → 카드를 고르면 지금 적용 */
export function openStash(sc) {
  if (sc.state !== 'play' || !sc.stash.length) return;
  sc.state = 'stash';
  sc.joystick.reset();
  const cards = sc.stash.map((item) => stashCard(sc.book, item));
  showStash(sc, cards, (i) => {
    const c = cards[i];
    sc.stash.splice(i, 1);
    sfx.play(c.rarity === 'legend' ? 'levelup' : 'pick');
    sc.book.learn(c.key, c.to);
    sc.state = 'play';
  }, () => { sc.state = 'play'; });
}

/** 합일 연출: 금빛 고리 + 큰 글씨 */
function fuse(sc, key) {
  sc.book.fuse(key);
  const p = sc.player;
  sc.effects.flash('ring', p.x, p.y, { life: 700, scale: 0.3, scaleTo: 5, tint: 0xffd36a, depth: 40 });
  sc.effects.burst(p.x, p.y, 0xffd36a, 20);
  sc.effects.shake('hurt');
  const t = sc.add.text(W / 2, H * 0.32, `${SPELLS[key].name}!`, {
    fontFamily: FONT, fontSize: '44px', fontStyle: 'bold', color: '#ffe7a8', stroke: '#3a3018', strokeThickness: 6,
  }).setOrigin(0.5).setScrollFactor(0).setDepth(250);
  sc.tweens.add({ targets: t, alpha: 0, y: H * 0.28, delay: 900, duration: 500, onComplete: () => t.destroy() });
}
