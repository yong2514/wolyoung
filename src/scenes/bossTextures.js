// 보스 그림 (도형). 몸은 어두운 색, 눈만 붉게, 장식은 금빛

function eye(g, x, y, r) {
  g.fillStyle(0xff5a3c, 1); g.fillCircle(x, y, r);
  g.fillStyle(0xffd0b0, 1); g.fillCircle(x - r * 0.3, y - r * 0.3, r * 0.3);
}

export function makeBossTextures(tex) {
  // 요장: 갑옷을 입은 뿔 달린 장수 (76×76)
  tex('yojang', 76, 76, (g) => {
    g.fillStyle(0xc9c2d8, 1); // 큰 뿔
    g.fillTriangle(12, 26, 2, 0, 24, 16);
    g.fillTriangle(64, 26, 74, 0, 52, 16);
    g.fillStyle(0x3b2f5c, 1); g.fillCircle(38, 42, 32);        // 몸
    g.fillStyle(0x5a4a86, 1); g.fillRect(14, 46, 48, 20);      // 갑옷
    g.lineStyle(2, 0xffd36a, 0.9); g.strokeRect(14, 46, 48, 20);
    g.lineBetween(38, 46, 38, 66);
    g.fillStyle(0x1a1230, 1); g.fillCircle(38, 32, 18);        // 얼굴 그림자
    eye(g, 30, 30, 4.5); eye(g, 46, 30, 4.5);
    g.fillStyle(0xeeeeee, 1);                                  // 송곳니
    g.fillTriangle(31, 40, 35, 40, 33, 47);
    g.fillTriangle(41, 40, 45, 40, 43, 47);
  });

  // 요황: 왕관을 쓴 거대한 요괴 왕 (110×110)
  tex('yohwang', 110, 110, (g) => {
    g.fillStyle(0x2a1a3e, 1); // 망토
    g.fillPoints([{ x: 8, y: 50 }, { x: 102, y: 50 }, { x: 108, y: 108 }, { x: 2, y: 108 }], true);
    g.fillStyle(0x4a2a6a, 1); g.fillCircle(55, 58, 44);       // 몸
    g.lineStyle(3, 0xffd36a, 0.8); g.strokeCircle(55, 58, 44);
    g.fillStyle(0x160c26, 1); g.fillCircle(55, 52, 28);       // 얼굴
    g.fillStyle(0xffd36a, 1);                                 // 왕관
    g.fillPoints([
      { x: 28, y: 26 }, { x: 34, y: 4 }, { x: 44, y: 18 }, { x: 55, y: 0 }, { x: 66, y: 18 },
      { x: 76, y: 4 }, { x: 82, y: 26 },
    ], true);
    g.fillStyle(0xff5a3c, 1); g.fillCircle(55, 16, 4);        // 왕관 보석
    eye(g, 43, 50, 6); eye(g, 67, 50, 6); eye(g, 55, 38, 4);  // 눈 셋
    g.fillStyle(0xeeeeee, 1);                                 // 입과 이빨
    for (let i = 0; i < 5; i++) g.fillTriangle(41 + i * 6, 64, 47 + i * 6, 64, 44 + i * 6, 71);
    g.lineStyle(2, 0xff5a3c, 0.8); g.lineBetween(40, 64, 71, 64);
  });
}
