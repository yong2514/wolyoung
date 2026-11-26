import { GAME_WIDTH as W, GAME_HEIGHT as H, FONT, BUTTON_ZONE_TOP } from '../config/display.js';
import { settings } from '../systems/settings.js';
import { drawCard, tappable, CARD_H, GAP } from './cards.js';
import { makeButton } from './button.js';

/** 게임 중 왼쪽(왼손 모드면 오른쪽) 「보관 N」 버튼. 보관한 카드가 있을 때만 보인다 */
export class StashButton {
  constructor(scene, onPress) {
    const x = settings.leftHand ? W - 42 : 42;
    const y = BUTTON_ZONE_TOP + 120;
    this.bg = scene.add.circle(x, y, 32, 0x23405a, 0.9).setStrokeStyle(3, 0x7fe0ff, 1).setScrollFactor(0).setDepth(150);
    this.text = scene.add.text(x, y, '', { fontFamily: FONT, fontSize: '15px', fontStyle: 'bold', color: '#ffffff', align: 'center' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(152);
    tappable(this.bg, () => true, onPress);
    this.shown = null;
  }

  update(count) {
    if (count === this.shown) return;
    this.shown = count;
    this.bg.setVisible(count > 0);
    this.text.setVisible(count > 0).setText(`보관\n${count}`);
  }
}

/** 보관함 화면: 카드를 누르면 onUse(i) (쓸 수 있을 때만), 닫기 → onClose() */
export function showStash(scene, cards, onUse, onClose) {
  const objs = [];
  const tweens = [];
  const fix = (o, depth = 321) => { objs.push(o); return o.setScrollFactor(0).setDepth(depth); };
  fix(scene.add.rectangle(0, 0, W, H, 0x0b0f26, 0.8).setOrigin(0), 315);
  const bottom = H - 140;
  const top = bottom - cards.length * (CARD_H + GAP) + GAP;
  fix(scene.add.text(W / 2, Math.min(H * 0.22, top - 70), '보관함', { fontFamily: FONT, fontSize: '32px', fontStyle: 'bold', color: '#dfe4f2' })
    .setOrigin(0.5));
  fix(scene.add.text(W / 2, Math.min(H * 0.22, top - 70) + 38, '지금 쓸 카드를 누르세요', { fontFamily: FONT, fontSize: '16px', color: '#7fe0ff' })
    .setOrigin(0.5));

  let enabled = false;
  cards.forEach((c, i) => {
    const bg = drawCard(scene, fix, c, top + i * (CARD_H + GAP) + CARD_H / 2, tweens);
    if (c.usable === false) { bg.setAlpha(0.5); return; }
    tappable(bg, () => enabled, () => { destroy(); onUse(i); }, () => bg.setStrokeStyle(5, 0xffffff, 1));
  });
  const close = makeButton(scene, W / 2, H - 80, 200, 64, '닫기', () => { destroy(); onClose(); }, { fontSize: '22px', depth: 322 });
  scene.time.delayedCall(250, () => { enabled = true; });

  let gone = false;
  function destroy() {
    if (gone) return;
    gone = true;
    tweens.forEach((t) => t.remove());
    objs.forEach((o) => o.destroy());
    close.destroy();
  }
  return { destroy };
}
