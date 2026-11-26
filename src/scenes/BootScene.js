import Phaser from 'phaser';
import { makeEnemyTextures } from './enemyTextures.js';
import { makePlayerTexture } from './playerTexture.js';

// 그림 대신 쓸 도형을 미리 그려 둔다 (나중에 그림 파일로 바꿀 때: config/assets.js)
export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    const tex = (key, w, h, draw) => { g.clear(); draw(g); g.generateTexture(key, w, h); };

    makePlayerTexture(tex); // 월영: 여자 도사 (사용자 요청)
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
    // 청염 부채꼴: 오른쪽으로 60°, 반지름 128 (왼쪽 가운데가 기준점)
    tex('fan', 128, 148, (g) => {
      const a = Math.PI / 6;
      for (let r = 128; r > 10; r -= 14) {
        g.fillStyle(0xbfe0ff, 0.12 + (1 - r / 128) * 0.25);
        g.slice(0, 74, r, -a, a, false);
        g.fillPath();
      }
    });
    // 부적: 옅은 금빛 종이 + 남색 글씨 선
    tex('talisman', 16, 24, (g) => {
      g.fillStyle(0xf3e6b0, 1); g.fillRect(0, 0, 16, 24);
      g.lineStyle(2, 0x2a3370, 1);
      g.lineBetween(8, 3, 8, 21); g.lineBetween(4, 8, 12, 8); g.lineBetween(4, 15, 12, 15);
    });
    // 월륜: 은빛 초승달 고리
    tex('moonRing', 34, 34, (g) => {
      // 바깥 원호(반지름 15)와 안쪽 원호(중심을 옮긴 반지름 12)로 초승달 모양
      const pts = [];
      for (let i = 0; i <= 24; i++) {
        const a = Math.PI * 0.15 + (i / 24) * Math.PI * 1.7;
        pts.push({ x: 17 + Math.cos(a) * 15, y: 17 + Math.sin(a) * 15 });
      }
      for (let i = 24; i >= 0; i--) {
        const a = Math.PI * 0.3 + (i / 24) * Math.PI * 1.4;
        pts.push({ x: 21 + Math.cos(a) * 11, y: 17 + Math.sin(a) * 11 });
      }
      g.fillStyle(0x9fb8ff, 0.35); g.fillCircle(17, 17, 17);
      g.fillStyle(0xeef3ff, 1); g.fillPoints(pts, true);
    });
    // 보물상자: 짙은 나무 + 금테
    tex('chest', 30, 24, (g) => {
      g.fillStyle(0x4a3424, 1); g.fillRoundedRect(1, 4, 28, 19, 3);
      g.fillStyle(0x6a4a30, 1); g.fillRoundedRect(1, 1, 28, 9, 3);
      g.lineStyle(2, 0xffd36a, 1); g.strokeRoundedRect(1, 1, 28, 22, 3); g.lineBetween(1, 10, 29, 10);
      g.fillStyle(0xffd36a, 1); g.fillRect(12, 8, 6, 6);
    });
    // 경지 돌파 빛기둥 (가운데가 밝은 세로 띠)
    tex('pillar', 64, 256, (g) => {
      for (let i = 0; i < 8; i++) {
        const w = 64 - i * 8;
        g.fillStyle(0xffffff, 0.08 + i * 0.05);
        g.fillRect((64 - w) / 2, 0, w, 256);
      }
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
