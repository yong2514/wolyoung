import Phaser from 'phaser';
import { GAME_WIDTH as W, GAME_HEIGHT as H, FONT } from '../config/display.js';
import { COMPANIONS } from '../data/companions.js';

const SKIP_MS = 600; // 이만큼 길게 누르면 건너뛰기

// 인연 대화 장면 (기획서 4번): 캐릭터 그림 + 대사창. 누르면 다음 줄, 길게 누르면 건너뛰기.
// data: { companion, title, lines: [{ who, text }], auto, onDone() }
export class DialogScene extends Phaser.Scene {
  constructor() { super('Dialog'); }

  create(data) {
    const def = COMPANIONS[data.companion];
    let i = 0;
    let done = false;
    const finish = () => { if (done) return; done = true; this.scene.stop(); data.onDone(); };

    this.add.rectangle(0, 0, W, H, 0x0b0f26, 0.92).setOrigin(0);
    this.add.text(W / 2, 46, data.title, { fontFamily: FONT, fontSize: '18px', fontStyle: 'bold', color: '#b9a6e8' }).setOrigin(0.5);
    const portrait = this.add.image(W / 2, H * 0.36, def.portrait);
    const box = this.add.rectangle(W / 2, H - 190, W - 32, 170, 0x141a3a, 0.95).setStrokeStyle(2, 0xb9a6e8, 0.9);
    const who = this.add.text(36, box.y - 70, '', { fontFamily: FONT, fontSize: '18px', fontStyle: 'bold', color: '#d9ccff' });
    const text = this.add.text(36, box.y - 40, '', {
      fontFamily: FONT, fontSize: '19px', color: '#ffffff', wordWrap: { width: W - 72, useAdvancedWrap: true }, lineSpacing: 6,
    });
    this.add.text(W - 32, box.y + 66, '누르면 다음 · 길게 누르면 건너뛰기', { fontFamily: FONT, fontSize: '12px', color: '#8a90b0' }).setOrigin(1, 0.5);

    const show = () => {
      const l = data.lines[i];
      who.setText(l.who);
      text.setText(l.text);
      portrait.setAlpha(l.who === def.name ? 1 : 0.45); // 말하는 사람이 동료일 때 밝게
    };
    show();

    let downAt = 0;
    this.input.on('pointerdown', () => { downAt = this.time.now; });
    this.input.on('pointerup', () => {
      if (this.time.now - downAt >= SKIP_MS) { finish(); return; }
      i++;
      if (i >= data.lines.length) finish(); else show();
    });
    if (data.auto) this.time.addEvent({ delay: 300, repeat: data.lines.length, callback: () => { i++; if (i >= data.lines.length) finish(); else show(); } });
  }
}
