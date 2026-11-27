import Phaser from 'phaser';
import { GAME_WIDTH as W, GAME_HEIGHT as H, FONT } from '../config/display.js';
import { BALANCE } from '../config/balance.js';
import { COMPANIONS } from '../data/companions.js';
import { makeButton } from '../ui/button.js';

// 인연 부활 장면 (게임 장면 위에 따로 띄움 → 게임은 흑백이어도 동료 그림은 색이 그대로)
// data: { companion, line, scripted, auto, onRevive(), onGiveUp() }
//   보통: 카운트다운 5초 + 「인연 부활」 (0.4초 뒤부터 눌림). 시간이 지나면 onGiveUp
//   첫 판 각본: 카운트다운 없이 「서하의 손을 잡는다」 하나
export class ReviveScene extends Phaser.Scene {
  constructor() { super('Revive'); }

  create(data) {
    const R = BALANCE.revive;
    const def = COMPANIONS[data.companion];
    let done = false;
    const finish = (fn) => { if (done) return; done = true; this.scene.stop(); fn(); };

    this.add.rectangle(0, 0, W, H, 0x05070f, 0).setOrigin(0).setAlpha(1)
      .setFillStyle(0x05070f, 0.55);
    const portrait = this.add.image(W / 2, H * 0.3, def.portrait).setAlpha(0).setScale(0.9);
    this.tweens.add({ targets: portrait, alpha: 1, scale: 1, y: H * 0.29, duration: 450, ease: 'Cubic.easeOut' });
    this.add.text(W / 2, H * 0.3 + 135, def.name, {
      fontFamily: FONT, fontSize: '20px', fontStyle: 'bold', color: '#b9a6e8',
    }).setOrigin(0.5);
    const box = this.add.rectangle(W / 2, H * 0.58, W - 40, 96, 0x0b0f26, 0.85).setStrokeStyle(2, 0xb9a6e8, 0.8);
    const line = this.add.text(W / 2, box.y, `“${data.line}”`, {
      fontFamily: FONT, fontSize: '20px', color: '#ffffff', align: 'center', wordWrap: { width: W - 80, useAdvancedWrap: true },
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: line, alpha: 1, delay: 250, duration: 400 });

    const label = data.scripted ? `${def.name}의 손을 잡는다` : '인연 부활';
    makeButton(this, W / 2, H - 130, W - 60, 92, label, () => finish(data.onRevive),
      { fontSize: data.scripted ? '26px' : '30px', fill: 0x4a3590, delayMs: R.tapDelayMs, depth: 10 });

    if (!data.scripted) { // 5초 카운트다운
      let left = R.countdownSec;
      const t = this.add.text(W / 2, H - 210, `${left}`, {
        fontFamily: FONT, fontSize: '40px', fontStyle: 'bold', color: '#dfe4f2',
      }).setOrigin(0.5);
      this.time.addEvent({
        delay: 1000, repeat: R.countdownSec - 1,
        callback: () => { left--; t.setText(`${left}`); if (left <= 0) finish(data.onGiveUp); },
      });
    }
    if (data.auto) this.time.delayedCall(R.tapDelayMs + 150, () => finish(data.onRevive)); // 자동 점검: 늘 부활
  }
}
