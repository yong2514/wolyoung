import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config/display.js';

// 0단계 확인용 화면: 남색 배경에 "월영"
export class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }

  create() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT * 0.42;

    // 달
    this.add.circle(cx, cy - 150, 46, 0xdfe4f2, 0.9);
    this.add.circle(cx + 18, cy - 162, 42, 0x141a3a, 1);

    const title = this.add.text(cx, cy, '월영', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '72px',
      fontStyle: 'bold',
      color: COLORS.silver,
    }).setOrigin(0.5).setPadding(24);
    title.setShadow(0, 0, COLORS.lilac, 18, true, true);

    this.add.text(cx, cy + 70, '죽는 순간, 인연이 너를 다시 일으킨다.', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '17px',
      color: COLORS.lilac,
    }).setOrigin(0.5);

    this.tweens.add({ targets: title, alpha: 0.75, duration: 1600, yoyo: true, repeat: -1 });

    window.__wolyoung.ready = true;
  }
}
