// 바닥·장식·그림자·화면 가장자리 그림 (사용자 요청: 배경이 요괴·구슬과 헷갈리지 않게, 선명하고 입체적으로)
// 원칙: 배경은 모나고 어두운 무채색, 땅에 붙은 사물. 게임 물체(요괴·구슬·카드)는 밝고 둥글고 그림자가 있다.

/** 바닥: 돌판 2×2, 돌판마다 밝은 윗·왼쪽 모서리와 어두운 아래·오른쪽 모서리 (흰 계열 → 장소 색을 입힘) */
function floor(g) {
  g.fillStyle(0x8a8a8a, 1); g.fillRect(0, 0, 128, 128); // 돌판 사이 틈
  const slabs = [[2, 2, 60, 60], [66, 2, 60, 60], [2, 66, 60, 60], [66, 66, 60, 60]];
  const shades = [0xd0d0d0, 0xc4c4c4, 0xc8c8c8, 0xd6d6d6];
  slabs.forEach(([x, y, w, h], i) => {
    g.fillStyle(shades[i], 1); g.fillRect(x, y, w, h);
    g.fillStyle(0xf2f2f2, 1); g.fillRect(x, y, w, 3); g.fillRect(x, y, 3, h);          // 빛 받는 모서리
    g.fillStyle(0xa0a0a0, 1); g.fillRect(x, y + h - 3, w, 3); g.fillRect(x + w - 3, y, 3, h); // 그늘진 모서리
  });
  g.lineStyle(1, 0xa8a8a8, 1); // 잔금
  g.lineBetween(20, 18, 34, 30); g.lineBetween(34, 30, 31, 44);
  g.lineBetween(90, 90, 104, 96); g.lineBetween(80, 30, 92, 26);
}

export function makeGroundTextures(scene, tex) {
  tex('bgtile', 128, 128, floor);

  // 모난 바위 (윗면 밝게, 옆면 어둡게, 아래 그림자)
  tex('decorRock', 56, 40, (g) => {
    g.fillStyle(0x000000, 0.35); g.fillEllipse(28, 34, 50, 10);
    g.fillStyle(0x5c6070, 1);
    g.fillPoints([{ x: 6, y: 30 }, { x: 12, y: 12 }, { x: 30, y: 6 }, { x: 48, y: 14 }, { x: 52, y: 30 }, { x: 30, y: 36 }], true);
    g.fillStyle(0x8c90a0, 1);
    g.fillPoints([{ x: 12, y: 12 }, { x: 30, y: 6 }, { x: 48, y: 14 }, { x: 32, y: 20 }, { x: 14, y: 20 }], true);
    g.lineStyle(1, 0x3c3f4a, 1); g.lineBetween(32, 20, 30, 36);
  });
  // 나무 그루터기 (나이테)
  tex('decorStump', 44, 40, (g) => {
    g.fillStyle(0x000000, 0.35); g.fillEllipse(22, 34, 40, 10);
    g.fillStyle(0x4a3a30, 1); g.fillRect(8, 14, 28, 18);
    g.fillStyle(0x7a6450, 1); g.fillEllipse(22, 14, 28, 12);
    g.lineStyle(1, 0x5a4636, 1); g.strokeEllipse(22, 14, 18, 7); g.strokeEllipse(22, 14, 8, 3);
  });
  // 물웅덩이 (납작, 테두리와 반사선)
  tex('decorPuddle', 70, 30, (g) => {
    g.fillStyle(0x2a3a58, 1); g.fillEllipse(35, 15, 66, 24);
    g.lineStyle(2, 0x5a6a88, 1); g.strokeEllipse(35, 15, 66, 24);
    g.lineStyle(2, 0x8a9ab8, 0.8); g.lineBetween(18, 11, 34, 9);
  });
  // 갈라진 땅
  tex('decorCrack', 64, 40, (g) => {
    g.lineStyle(3, 0x2a2a30, 1);
    g.lineBetween(4, 20, 22, 16); g.lineBetween(22, 16, 34, 24); g.lineBetween(34, 24, 52, 12); g.lineBetween(52, 12, 60, 14);
    g.lineStyle(2, 0x2a2a30, 1); g.lineBetween(22, 16, 26, 4); g.lineBetween(34, 24, 38, 36);
    g.lineStyle(1, 0x8a8a90, 0.6); g.lineBetween(5, 22, 22, 18); g.lineBetween(35, 26, 52, 14);
  });
  // 부러진 돌기둥 밑동
  tex('decorPillar', 40, 52, (g) => {
    g.fillStyle(0x000000, 0.35); g.fillEllipse(20, 46, 38, 10);
    g.fillStyle(0x6a6878, 1); g.fillRect(8, 16, 24, 30);
    g.fillStyle(0x9894a6, 1); g.fillRect(8, 16, 7, 30);
    g.fillStyle(0x8a8698, 1);
    g.fillPoints([{ x: 8, y: 16 }, { x: 14, y: 8 }, { x: 22, y: 14 }, { x: 28, y: 6 }, { x: 32, y: 16 }], true);
    g.fillStyle(0x55536a, 1); g.fillRect(4, 42, 32, 5);
  });
  // 풀 포기 (어두운 녹회색)
  tex('decorGrass', 30, 22, (g) => {
    g.lineStyle(2, 0x3a5040, 1);
    g.lineBetween(15, 21, 15, 4); g.lineBetween(15, 21, 7, 7); g.lineBetween(15, 21, 23, 6);
    g.lineBetween(15, 21, 3, 13); g.lineBetween(15, 21, 27, 13);
  });

  // 그림자 (주인공·요괴 발밑)
  tex('shadow', 48, 16, (g) => {
    g.fillStyle(0x000000, 0.18); g.fillEllipse(24, 8, 48, 16);
    g.fillStyle(0x000000, 0.22); g.fillEllipse(24, 8, 34, 11);
  });

  // 화면 가장자리를 살짝 어둡게 (깊이감). 캔버스 그라데이션
  const W = scene.scale.gameSize.width;
  const H = scene.scale.gameSize.height;
  const ct = scene.textures.createCanvas('vignette', W, H);
  const ctx = ct.getContext();
  const grad = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.62);
  grad.addColorStop(0, 'rgba(5,7,20,0)');
  grad.addColorStop(1, 'rgba(5,7,20,0.55)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  ct.refresh();
}
