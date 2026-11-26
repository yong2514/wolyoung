// 요괴 그림 (도형). 단계가 오를수록 크고 무섭게. 몸은 어두운 색, 눈만 붉게
// (붉은·주황은 요괴 공격·예고에 쓰므로 몸에는 쓰지 않는다)

function eyes(g, pts, r) {
  g.fillStyle(0xff5a3c, 1);
  for (const [x, y] of pts) g.fillCircle(x, y, r);
}

function spikes(g, cx, cy, r0, r1, n, color, offset = 0) {
  g.fillStyle(color, 1);
  for (let i = 0; i < n; i++) {
    const a = offset + (i / n) * Math.PI * 2;
    const w = Math.PI / n;
    g.fillTriangle(
      cx + Math.cos(a - w) * r0, cy + Math.sin(a - w) * r0,
      cx + Math.cos(a) * r1, cy + Math.sin(a) * r1,
      cx + Math.cos(a + w) * r0, cy + Math.sin(a + w) * r0,
    );
  }
}

/** 특수 요괴 5종 + 예고·탄·정예 테두리 */
function makeTypeTextures(tex) {
  // 돌진귀: 짙은 남회색 쐐기 몸 + 앞뿔
  tex('charger', 36, 32, (g) => {
    g.fillStyle(0x4a5470, 1);
    g.fillPoints([{ x: 2, y: 6 }, { x: 26, y: 2 }, { x: 34, y: 16 }, { x: 26, y: 30 }, { x: 2, y: 26 }], true);
    g.fillStyle(0xd8d8e0, 1); g.fillTriangle(28, 12, 36, 16, 28, 20);
    g.fillStyle(0x232838, 1); g.fillCircle(14, 16, 10);
    eyes(g, [[18, 12], [18, 20]], 2.4);
  });
  // 원귀: 떠다니는 등불 (큰 외눈)
  tex('ranged', 32, 34, (g) => {
    g.fillStyle(0x5b3f7a, 1); g.fillEllipse(16, 15, 26, 24);
    g.fillTriangle(8, 22, 16, 34, 24, 22);
    g.fillStyle(0x1e1030, 1); g.fillCircle(16, 14, 8);
    eyes(g, [[16, 14]], 4.5);
  });
  // 분열귀: 회녹색 물방울 (가운데 금)
  tex('splitter', 36, 36, (g) => {
    g.fillStyle(0x4f6b5a, 1); g.fillCircle(18, 19, 16);
    g.fillStyle(0x26362c, 1); g.fillCircle(18, 20, 13);
    g.lineStyle(2, 0x8fb8a0, 0.8); g.lineBetween(18, 5, 18, 33);
    eyes(g, [[12, 18], [24, 18]], 2.5);
  });
  tex('splitling', 22, 22, (g) => {
    g.fillStyle(0x4f6b5a, 1); g.fillCircle(11, 11, 10);
    g.fillStyle(0x26362c, 1); g.fillCircle(11, 12, 8);
    eyes(g, [[8, 10], [14, 10]], 1.8);
  });
  // 방패귀: 바위색 몸 + 앞쪽 은빛 방패 (방패는 그림 오른쪽 = 나를 보는 쪽, flipX로 돌아감)
  tex('shield', 40, 36, (g) => {
    g.fillStyle(0x5a5550, 1); g.fillCircle(17, 18, 15);
    g.fillStyle(0x2a2724, 1); g.fillCircle(17, 19, 12);
    eyes(g, [[13, 16], [21, 16]], 2.4);
    g.fillStyle(0xc9cdd8, 1); g.fillRoundedRect(29, 2, 9, 32, 4);
    g.lineStyle(2, 0x7d8292, 1); g.strokeRoundedRect(29, 2, 9, 32, 4);
  });
  // 폭귀: 짙은 몸 + 심지
  tex('bomber', 30, 34, (g) => {
    g.fillStyle(0x3a2a40, 1); g.fillCircle(15, 20, 13);
    g.fillStyle(0x1a1020, 1); g.fillCircle(15, 21, 10);
    g.lineStyle(2, 0xb8a890, 1); g.lineBetween(15, 7, 19, 1);
    g.fillStyle(0xffd36a, 1); g.fillCircle(19, 2, 2);
    eyes(g, [[11, 19], [19, 19]], 2.2);
  });
  // 예고선 (오른쪽으로 100, 흰색 → 주황/붉은으로 칠함)
  tex('warnLine', 100, 8, (g) => {
    g.fillStyle(0xffffff, 0.35); g.fillRect(0, 0, 100, 8);
    g.fillStyle(0xffffff, 1); g.fillRect(0, 3, 100, 2);
  });
  // 요괴 탄 (붉은)
  tex('ebullet', 16, 16, (g) => {
    g.fillStyle(0xff5a3c, 0.4); g.fillCircle(8, 8, 8);
    g.fillStyle(0xff9a6a, 1); g.fillCircle(8, 8, 5);
  });
  // 정예 테두리 (금빛, 반지름 20 기준)
  tex('eliteGlow', 52, 52, (g) => {
    g.lineStyle(3, 0xffd36a, 0.9); g.strokeCircle(26, 26, 23);
    g.lineStyle(6, 0xffd36a, 0.25); g.strokeCircle(26, 26, 22);
  });
}

export function makeEnemyTextures(tex) {
  makeTypeTextures(tex);
  // 1 잡귀: 보라 동그라미
  tex('jabgwi', 30, 30, (g) => {
    g.fillStyle(0x7a3d8f, 1); g.fillCircle(15, 15, 14);
    g.fillStyle(0x3d1f52, 1); g.fillCircle(15, 16, 12);
    eyes(g, [[10, 13], [20, 13]], 2.5);
  });
  // 2 야귀: 청록, 뿔 두 개
  tex('yagwi', 34, 36, (g) => {
    g.fillStyle(0x3c8a8c, 1);
    g.fillTriangle(6, 14, 9, 0, 14, 10);
    g.fillTriangle(20, 10, 25, 0, 28, 14);
    g.fillCircle(17, 21, 14);
    g.fillStyle(0x17403f, 1); g.fillCircle(17, 22, 12);
    eyes(g, [[12, 20], [22, 20]], 2.8);
  });
  // 3 흉귀: 올리브, 가시 테두리, 눈 세 개
  tex('hyunggwi', 40, 40, (g) => {
    spikes(g, 20, 20, 13, 19, 10, 0x6d7330);
    g.fillStyle(0x6d7330, 1); g.fillCircle(20, 20, 15);
    g.fillStyle(0x2e3115, 1); g.fillCircle(20, 21, 13);
    eyes(g, [[13, 18], [27, 18], [20, 13]], 2.6);
  });
  // 4 악귀: 짙은 남보라, 굽은 뿔, 송곳니
  tex('akgwi', 46, 46, (g) => {
    g.fillStyle(0xc9c2d8, 1);
    g.fillTriangle(6, 18, 2, 2, 14, 12);
    g.fillTriangle(40, 18, 44, 2, 32, 12);
    g.fillStyle(0x4b3a8a, 1); g.fillCircle(23, 25, 18);
    g.fillStyle(0x1c1440, 1); g.fillCircle(23, 26, 15);
    eyes(g, [[16, 22], [30, 22]], 3.4);
    g.fillStyle(0xeeeeee, 1);
    g.fillTriangle(17, 31, 20, 31, 18.5, 36);
    g.fillTriangle(26, 31, 29, 31, 27.5, 36);
  });
  // 5 혈귀: 짙은 자홍, 왕관 가시, 눈 네 개
  tex('hyeolgwi', 52, 52, (g) => {
    spikes(g, 26, 28, 16, 25, 5, 0xe0d6ff, -Math.PI / 2 - 0.6);
    g.fillStyle(0x7a1f63, 1); g.fillCircle(26, 28, 21);
    g.fillStyle(0x2c0a26, 1); g.fillCircle(26, 29, 18);
    eyes(g, [[18, 24], [34, 24], [21, 32], [31, 32]], 3);
    g.lineStyle(2, 0xe0d6ff, 0.6); g.strokeCircle(26, 28, 21);
  });
}
