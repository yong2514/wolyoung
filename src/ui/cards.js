import { GAME_WIDTH as W, GAME_HEIGHT as H, FONT } from '../config/display.js';
import { BALANCE } from '../config/balance.js';

export const CARD_W = W - 40;
export const CARD_H = 118;
export const GAP = 12;
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
 * 카드 한 장 그리기 (레벨업·보관함이 같이 씀). fix(o, depth)는 화면 고정 + 나중에 지울 목록에 넣는 함수.
 * 돌려주는 bg를 눌리게(setInteractive) 하는 건 부르는 쪽.
 */
export function drawCard(scene, fix, c, y, tweens) {
  const stroke = c.kind === 'fusion' ? GOLD : STROKE[c.rarity] ?? STROKE.common;
  const width = c.rarity === 'common' ? 2 : 4;
  if (c.rarity === 'legend') { // 금빛으로 빛나는 연출
    const glow = fix(scene.add.rectangle(W / 2, y, CARD_W + 14, CARD_H + 14, GOLD, 0.35), 319);
    tweens.push(scene.tweens.add({ targets: glow, alpha: 0.05, scaleX: 1.02, scaleY: 1.06, duration: 600, yoyo: true, repeat: -1 }));
  }
  const bg = fix(scene.add.rectangle(W / 2, y, CARD_W, CARD_H, FILL[c.kind] ?? FILL.attack, 1).setStrokeStyle(width, stroke, 1), 320);
  const left = 38;
  const gold = c.rarity === 'legend';
  fix(scene.add.text(left, y - 38, c.name, { fontFamily: FONT, fontSize: '22px', fontStyle: 'bold', color: gold ? '#ffe7a8' : '#ffffff' }));
  fix(scene.add.text(W - left, y - 34, tagText(c), {
    fontFamily: FONT, fontSize: '14px', fontStyle: c.rarity === 'common' ? 'normal' : 'bold',
    color: gold ? '#ffd36a' : c.rarity === 'rare' ? '#7fe0ff' : '#a9c8ff',
  }).setOrigin(1, 0));
  fix(scene.add.text(left, y - 4, c.usable === false ? `쓸 수 없음: ${c.reason}` : c.text, {
    fontFamily: FONT, fontSize: '15px', color: c.usable === false ? '#ff9a8a' : '#dfe4f2',
    wordWrap: { width: CARD_W - 36, useAdvancedWrap: true },
  }));
  bg.resetStroke = () => bg.setStrokeStyle(width, stroke, 1);
  return bg;
}

/** 눌렀다 뗀 경우에만 onTap (조이스틱 손가락이 지나가다 떼도 무시). isEnabled()가 false면 안 눌림 */
export function tappable(obj, isEnabled, onTap, onDown) {
  obj.setInteractive();
  let pressed = false;
  obj.on('pointerdown', () => { if (isEnabled()) { pressed = true; onDown?.(); } });
  obj.on('pointerout', () => { if (pressed) { pressed = false; obj.resetStroke?.(); } });
  obj.on('pointerup', () => { if (pressed) { pressed = false; onTap(); } });
}

/**
 * 레벨업 카드 화면. 카드는 아래쪽(엄지 자리). 뜬 뒤 cardLockMs 동안은 눌리지 않는다.
 * opts: onPick(i), refreshLeft, banishLeft, keepLeft, onRefresh(), onBanish(i)/onKeep(i) → 했으면 true
 */
export function showCards(scene, cards, opts) {
  const objs = [];
  const tweens = [];
  const fix = (o, depth = 321) => { objs.push(o); return o.setScrollFactor(0).setDepth(depth); };
  fix(scene.add.rectangle(0, 0, W, H, 0x0b0f26, 0.8).setOrigin(0), 315);
  const cardsTop = H - 40 - cards.length * (CARD_H + GAP) + GAP;
  const titleY = Math.min(H * 0.22, cardsTop - 150);
  fix(scene.add.text(W / 2, titleY, '레벨 업!', { fontFamily: FONT, fontSize: '36px', fontStyle: 'bold', color: '#dfe4f2' }).setOrigin(0.5));
  const HINT = '법술 하나를 고르세요';
  const hint = fix(scene.add.text(W / 2, titleY + 40, HINT, { fontFamily: FONT, fontSize: '16px', color: '#b9a6e8' }).setOrigin(0.5));

  let enabled = false;
  let mode = null; // null · 'banish' · 'keep'
  const isOn = () => enabled;
  const cardBgs = cards.map((c, i) => {
    const bg = drawCard(scene, fix, c, cardsTop + i * (CARD_H + GAP) + CARD_H / 2, tweens).setAlpha(0.55);
    tappable(bg, isOn, () => {
      bg.resetStroke();
      if (mode === 'banish') { opts.onBanish(i); return; }
      if (mode === 'keep') { if (opts.onKeep(i)) destroy(); return; }
      destroy();
      opts.onPick(i);
    }, () => bg.setStrokeStyle(5, 0xffffff, 1));
    return bg;
  });

  // 새로고침·봉인·보관 버튼 (카드 바로 위)
  const by = cardsTop - 36;
  const modeBtns = {};
  const small = (x, label, left, onTap) => {
    const b = fix(scene.add.rectangle(x, by, 114, 48, 0x1d2350, 1).setStrokeStyle(2, 0xb9a6e8, left ? 0.9 : 0.3), 320);
    const t = fix(scene.add.text(x, by, `${label} ${left}`, { fontFamily: FONT, fontSize: '15px', color: '#dfe4f2' }).setOrigin(0.5));
    if (!left) t.setAlpha(0.4);
    else tappable(b, isOn, () => onTap(b, t));
    return { b, t, label, left };
  };
  const toggle = (name, hintText) => {
    mode = mode === name ? null : name;
    for (const [k, m] of Object.entries(modeBtns)) {
      m.b.setFillStyle(mode === k ? 0x4a2350 : 0x1d2350);
      m.t.setText(mode === k ? '취소' : `${m.label} ${m.left}`);
    }
    hint.setText(mode ? hintText : HINT);
  };
  small(W / 2 - 122, '↻ 새로고침', opts.refreshLeft, () => { destroy(); opts.onRefresh(); });
  modeBtns.banish = small(W / 2, '봉인', opts.banishLeft, () => toggle('banish', '봉인할 카드를 누르세요 (이 판에서 다시 안 나와요)'));
  modeBtns.keep = small(W / 2 + 122, '보관', opts.keepLeft, () => toggle('keep', '보관할 카드를 누르세요 (나중에 꺼내 써요)'));

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
