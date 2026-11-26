import { GAME_WIDTH as W, GAME_HEIGHT as H, FONT } from '../config/display.js';
import { BALANCE } from '../config/balance.js';

const CARD_W = W - 40;
const CARD_H = 118;
const GAP = 12;
const FILL = { attack: 0x2a3370, support: 0x23405a, item: 0x3a2d5c, fusion: 0x3a3018 };
const GOLD = 0xffd36a;
const STROKE = { common: 0x8fb8ff, rare: 0x7fe0ff, legend: GOLD };
const RARITY_NAME = { common: '', rare: '희귀', legend: '전설' };

function tagText(c) {
  if (c.kind === 'fusion') return '합일';
  if (c.kind === 'item') return '';
  const r = RARITY_NAME[c.rarity];
  const step = c.isNew ? (c.kind === 'support' ? '새 보조 법술' : '새 법술') : `${c.from}단계 → ${c.to}단계`;
  return r ? `${r} · ${step}` : step;
}

/**
 * 레벨업 카드 화면. 카드는 아래쪽(엄지 자리). 뜬 뒤 cardLockMs 동안은 눌리지 않는다.
 * opts: onPick(i), refreshLeft, banishLeft, onRefresh(), onBanish(i) → 봉인했으면 true
 */
export function showCards(scene, cards, opts) {
  const objs = [];
  const tweens = [];
  const fix = (o, depth = 321) => { objs.push(o); return o.setScrollFactor(0).setDepth(depth); };
  fix(scene.add.rectangle(0, 0, W, H, 0x0b0f26, 0.8).setOrigin(0), 315);
  const cardsTop = H - 40 - cards.length * (CARD_H + GAP) + GAP;
  const titleY = Math.min(H * 0.22, cardsTop - 150);
  fix(scene.add.text(W / 2, titleY, '레벨 업!', { fontFamily: FONT, fontSize: '36px', fontStyle: 'bold', color: '#dfe4f2' }).setOrigin(0.5));
  const hint = fix(scene.add.text(W / 2, titleY + 40, '법술 하나를 고르세요', { fontFamily: FONT, fontSize: '16px', color: '#b9a6e8' })
    .setOrigin(0.5));

  let enabled = false;
  let banishMode = false;
  const cardBgs = [];

  cards.forEach((c, i) => {
    const y = cardsTop + i * (CARD_H + GAP) + CARD_H / 2;
    const stroke = c.kind === 'fusion' ? GOLD : STROKE[c.rarity] ?? STROKE.common;
    if (c.rarity === 'legend') { // 금빛으로 빛나는 연출
      const glow = fix(scene.add.rectangle(W / 2, y, CARD_W + 14, CARD_H + 14, GOLD, 0.35), 319);
      tweens.push(scene.tweens.add({ targets: glow, alpha: 0.05, scaleX: 1.02, scaleY: 1.06, duration: 600, yoyo: true, repeat: -1 }));
    }
    const bg = fix(scene.add.rectangle(W / 2, y, CARD_W, CARD_H, FILL[c.kind] ?? FILL.attack, 1)
      .setStrokeStyle(c.rarity === 'common' ? 2 : 4, stroke, 1), 320);
    cardBgs.push(bg);
    const left = 38;
    const gold = c.rarity === 'legend';
    fix(scene.add.text(left, y - 38, c.name, { fontFamily: FONT, fontSize: '22px', fontStyle: 'bold', color: gold ? '#ffe7a8' : '#ffffff' }));
    fix(scene.add.text(W - left, y - 34, tagText(c), {
      fontFamily: FONT, fontSize: '14px', fontStyle: c.rarity === 'common' ? 'normal' : 'bold',
      color: gold ? '#ffd36a' : c.rarity === 'rare' ? '#7fe0ff' : '#a9c8ff',
    }).setOrigin(1, 0));
    fix(scene.add.text(left, y - 4, c.text, {
      fontFamily: FONT, fontSize: '15px', color: '#dfe4f2', wordWrap: { width: CARD_W - 36, useAdvancedWrap: true },
    }));

    bg.setAlpha(0.55).setInteractive();
    let pressed = false;
    bg.on('pointerdown', () => { if (enabled) { pressed = true; bg.setStrokeStyle(5, 0xffffff, 1); } });
    bg.on('pointerout', () => { pressed = false; bg.setStrokeStyle(c.rarity === 'common' ? 2 : 4, stroke, 1); });
    bg.on('pointerup', () => {
      if (!enabled || !pressed) return;
      pressed = false;
      if (banishMode) {
        if (!opts.onBanish(i)) bg.setStrokeStyle(c.rarity === 'common' ? 2 : 4, stroke, 1); // 봉인 못 하는 카드
        return;
      }
      destroy();
      opts.onPick(i);
    });
  });

  // 새로고침·봉인 버튼 (카드 바로 위)
  const by = cardsTop - 36;
  const small = (x, label, left, onTap) => {
    const b = fix(scene.add.rectangle(x, by, 160, 48, 0x1d2350, 1).setStrokeStyle(2, 0xb9a6e8, left ? 0.9 : 0.3), 320);
    const t = fix(scene.add.text(x, by, `${label} ${left}`, { fontFamily: FONT, fontSize: '16px', color: '#dfe4f2' }).setOrigin(0.5));
    if (!left) { t.setAlpha(0.4); return { b, t }; }
    b.setInteractive();
    let pressed = false;
    b.on('pointerdown', () => { pressed = enabled; });
    b.on('pointerout', () => { pressed = false; });
    b.on('pointerup', () => { if (pressed) { pressed = false; onTap(b, t); } });
    return { b, t };
  };
  small(W / 2 - 88, '↻ 새로고침', opts.refreshLeft, () => { destroy(); opts.onRefresh(); });
  small(W / 2 + 88, '봉인', opts.banishLeft, (b, t) => {
    banishMode = !banishMode;
    b.setFillStyle(banishMode ? 0x4a2350 : 0x1d2350);
    t.setText(banishMode ? '봉인 취소' : `봉인 ${opts.banishLeft}`);
    hint.setText(banishMode ? '봉인할 카드를 누르세요 (이 판에서 다시 안 나와요)' : '법술 하나를 고르세요');
  });

  // 오터치 방지: 잠깐 흐리게 보였다가 눌리게
  scene.time.delayedCall(BALANCE.cardLockMs, () => {
    enabled = true;
    cardBgs.forEach((b) => b.active && b.setAlpha(1));
  });

  let gone = false;
  function destroy() {
    if (gone) return;
    gone = true;
    tweens.forEach((t) => t.remove());
    objs.forEach((o) => o.destroy());
  }
  return { destroy };
}
