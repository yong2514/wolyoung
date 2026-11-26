import Phaser from 'phaser';

// 그림 대신 쓸 도형을 미리 그려 둔다 (나중에 그림 파일로 바꿀 때: config/assets.js)
export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    const tex = (key, w, h, draw) => { g.clear(); draw(g); g.generateTexture(key, w, h); };

    // 월영: 은빛 몸 + 연보라 테두리
    tex('player', 32, 32, (g) => {
      g.fillStyle(0xb9a6e8, 1); g.fillCircle(16, 16, 15);
      g.fillStyle(0xdfe4f2, 1); g.fillCircle(16, 16, 12);
      g.fillStyle(0x2a3370, 1); g.fillCircle(16, 13, 4);
    });
    // 기운(빛 테두리)
    tex('aura', 72, 72, (g) => {
      for (let r = 35; r > 16; r -= 3) { g.fillStyle(0xb9a6e8, 0.06); g.fillCircle(36, 36, r); }
    });
    // 잡귀: 어두운 보라 몸 + 붉은 눈
    tex('jabgwi', 30, 30, (g) => {
      g.fillStyle(0x7a3d8f, 1); g.fillCircle(15, 15, 14);
      g.fillStyle(0x3d1f52, 1); g.fillCircle(15, 16, 12);
      g.fillStyle(0xff5a3c, 1); g.fillCircle(10, 13, 2.5); g.fillCircle(20, 13, 2.5);
    });
    // 비검: 오른쪽을 향한 은빛 검
    tex('sword', 32, 8, (g) => {
      g.fillStyle(0x8fb8ff, 0.45); g.fillRect(0, 3, 10, 2);
      g.fillStyle(0xeef3ff, 1);
      g.fillPoints([{ x: 6, y: 4 }, { x: 12, y: 1 }, { x: 32, y: 4 }, { x: 12, y: 7 }], true);
    });
    tex('spark', 8, 8, (g) => { g.fillStyle(0xffffff, 1); g.fillCircle(4, 4, 4); });
    // 바닥 무늬: 움직이는 느낌이 나도록 옅은 점과 선
    tex('bgtile', 96, 96, (g) => {
      g.fillStyle(0x141a3a, 1); g.fillRect(0, 0, 96, 96);
      g.fillStyle(0x1e2550, 1); g.fillCircle(0, 0, 2); g.fillCircle(48, 48, 1.5);
      g.lineStyle(1, 0x1a2149, 1); g.strokeRect(0, 0, 96, 96);
    });
    // 조이스틱
    tex('joyBase', 124, 124, (g) => {
      g.fillStyle(0xdfe4f2, 0.08); g.fillCircle(62, 62, 60);
      g.lineStyle(2, 0xdfe4f2, 0.35); g.strokeCircle(62, 62, 60);
    });
    tex('joyKnob', 52, 52, (g) => { g.fillStyle(0xdfe4f2, 0.5); g.fillCircle(26, 26, 25); });

    g.destroy();
    this.scene.start('Game');
  }
}
