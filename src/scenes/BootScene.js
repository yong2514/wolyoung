import Phaser from 'phaser';
import { makeEnemyTextures } from './enemyTextures.js';

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
    makeEnemyTextures(tex); // 요괴 5단계
    // 비검: 오른쪽을 향한 은빛 검
    tex('sword', 32, 8, (g) => {
      g.fillStyle(0x8fb8ff, 0.45); g.fillRect(0, 3, 10, 2);
      g.fillStyle(0xeef3ff, 1);
      g.fillPoints([{ x: 6, y: 4 }, { x: 12, y: 1 }, { x: 32, y: 4 }, { x: 12, y: 7 }], true);
    });
    tex('spark', 8, 8, (g) => { g.fillStyle(0xffffff, 1); g.fillCircle(4, 4, 4); });
    // 영기 구슬: 푸른 마름모
    tex('orb', 14, 14, (g) => {
      g.fillStyle(0x7fd8ff, 0.35); g.fillCircle(7, 7, 7);
      g.fillStyle(0xbff0ff, 1);
      g.fillPoints([{ x: 7, y: 1 }, { x: 12, y: 7 }, { x: 7, y: 13 }, { x: 2, y: 7 }], true);
    });
    // 뇌부 낙뢰: 위에서 내려오는 지그재그 (아래 끝이 기준점)
    tex('bolt', 30, 220, (g) => {
      const pts = [[16, 0], [8, 50], [20, 90], [6, 140], [18, 180], [15, 220]];
      g.lineStyle(7, 0x8fb8ff, 0.35);
      g.strokePoints(pts.map(([x, y]) => ({ x, y })));
      g.lineStyle(3, 0xffffff, 1);
      g.strokePoints(pts.map(([x, y]) => ({ x, y })));
    });
    // 빛 고리 (반지름 32 기준)
    tex('ring', 68, 68, (g) => {
      g.lineStyle(4, 0xffffff, 1); g.strokeCircle(34, 34, 31);
      g.fillStyle(0xffffff, 0.18); g.fillCircle(34, 34, 30);
    });
    // 연화진: 꽃잎 8장 (반지름 64 기준)
    tex('lotus', 128, 128, (g) => {
      g.fillStyle(0xa77ff0, 0.28); g.fillCircle(64, 64, 63);
      g.lineStyle(2, 0xd4b8ff, 0.9); g.strokeCircle(64, 64, 62);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        g.fillStyle(0xe4c4ff, 0.55);
        g.fillEllipse(64 + Math.cos(a) * 34, 64 + Math.sin(a) * 34, 26, 26);
      }
      g.fillStyle(0xf0eaff, 0.6); g.fillCircle(64, 64, 14);
    });
    // 호신강기 구슬
    tex('guardOrb', 26, 26, (g) => {
      g.fillStyle(0x8fb8ff, 0.3); g.fillCircle(13, 13, 13);
      g.fillStyle(0xe6eeff, 1); g.fillCircle(13, 13, 8);
      g.fillStyle(0x8fb8ff, 1); g.fillCircle(11, 11, 3);
    });
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
