import { GAME_WIDTH as W, GAME_HEIGHT as H, FONT } from '../config/display.js';
import { BALANCE } from '../config/balance.js';

const CARD_W = W - 40;
const CARD_H = 124;
const GAP = 14;
const KIND_COLOR = { attack: 0x2a3370, support: 0x23405a, item: 0x3a2d5c };

// 레벨업 카드 화면. 카드는 화면 아래쪽(엄지 자리)에, 뜬 뒤 cardLockMs 동안은 눌리지 않는다.
export function showCards(scene, cards, onPick) {
  const objs = [];
  const fix = (o, depth = 320) => { objs.push(o); return o.setScrollFactor(0).setDepth(depth); };
  fix(scene.add.rectangle(0, 0, W, H, 0x0b0f26, 0.78).setOrigin(0), 315);
  fix(scene.add.text(W / 2, H * 0.3, '레벨 업!', {
    fontFamily: FONT, fontSize: '36px', fontStyle: 'bold', color: '#dfe4f2',
  }).setOrigin(0.5));
  fix(scene.add.text(W / 2, H * 0.3 + 40, '법술 하나를 고르세요', { fontFamily: FONT, fontSize: '16px', color: '#b9a6e8' })
    .setOrigin(0.5));

  let enabled = false;
  const bottom = H - 40;
  cards.forEach((c, i) => {
    const y = bottom - (cards.length - i) * (CARD_H + GAP) + GAP + CARD_H / 2;
    const bg = fix(scene.add.rectangle(W / 2, y, CARD_W, CARD_H, KIND_COLOR[c.kind] ?? 0x2a3370, 1)
      .setStrokeStyle(2, c.isNew ? 0xb9a6e8 : 0x8fb8ff, 1));
    const left = 20 + 18;
    fix(scene.add.text(left, y - 40, c.name, { fontFamily: FONT, fontSize: '22px', fontStyle: 'bold', color: '#ffffff' }), 321);
    const tag = c.kind === 'item' ? '' : c.isNew ? (c.kind === 'support' ? '새 보조 법술' : '새 법술') : `${c.from}단계 → ${c.to}단계`;
    fix(scene.add.text(W - left, y - 36, tag, {
      fontFamily: FONT, fontSize: '14px', color: c.isNew ? '#d9ccff' : '#a9c8ff',
    }).setOrigin(1, 0), 321);
    fix(scene.add.text(left, y - 2, c.text, {
      fontFamily: FONT, fontSize: '15px', color: '#dfe4f2', wordWrap: { width: CARD_W - 36, useAdvancedWrap: true },
    }), 321);

    bg.setAlpha(0.55);
    bg.setInteractive();
    let pressed = false;
    bg.on('pointerdown', () => { if (enabled) { pressed = true; bg.setStrokeStyle(4, 0xffffff, 1); } });
    bg.on('pointerout', () => { pressed = false; bg.setStrokeStyle(2, c.isNew ? 0xb9a6e8 : 0x8fb8ff, 1); });
    bg.on('pointerup', () => { if (enabled && pressed) { destroy(); onPick(i); } });
  });

  // 오터치 방지: 잠깐 흐리게 보였다가 눌리게
  scene.time.delayedCall(BALANCE.cardLockMs, () => {
    enabled = true;
    objs.forEach((o) => { if (o.type === 'Rectangle' && o.depth === 320) o.setAlpha(1); });
  });

  function destroy() { objs.forEach((o) => o.destroy()); }
  return { destroy };
}
