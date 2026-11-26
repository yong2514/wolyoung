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

export function makeEnemyTextures(tex) {
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
