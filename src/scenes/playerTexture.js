// 주인공 "월영" 그림 (도형): 여자 도사. 올림머리 + 은비녀, 흰 도포, 연보라 허리띠·넓은 소매, 등에 멘 검.
// 48×60, 오른쪽을 보는 모습 (왼쪽으로 갈 때는 flipX). 기준점은 몸 가운데 (player.js setOrigin)

const HAIR = 0x1f1a33;
const HAIR_LIGHT = 0x3a3156;
const SKIN = 0xf6dcc8;
const ROBE = 0xeef1fa;
const ROBE_SHADE = 0xc9cfe4;
const LILAC = 0xb9a6e8;
const LILAC_DARK = 0x8a73c9;
const SILVER = 0xdfe4f2;

export function makePlayerTexture(tex) {
  tex('player', 48, 60, (g) => {
    // 등에 멘 검 (어깨 위로 비스듬히 칼자루)
    g.lineStyle(3, 0x9aa6c8, 1); g.lineBetween(40, 16, 14, 46);
    g.fillStyle(LILAC_DARK, 1);
    g.fillPoints([{ x: 40, y: 10 }, { x: 45, y: 13 }, { x: 42, y: 19 }, { x: 37, y: 16 }], true); // 칼자루
    g.lineStyle(2, SILVER, 1); g.lineBetween(35, 19, 42, 23); // 코등이

    // 뒤로 늘어진 긴 머리
    g.fillStyle(HAIR, 1);
    g.fillEllipse(23, 27, 24, 30);

    // 도포 (아래로 퍼지는 모양)
    g.fillStyle(ROBE, 1);
    g.fillPoints([{ x: 16, y: 29 }, { x: 32, y: 29 }, { x: 38, y: 54 }, { x: 10, y: 54 }], true);
    g.fillStyle(ROBE_SHADE, 1);
    g.fillPoints([{ x: 26, y: 40 }, { x: 33, y: 40 }, { x: 38, y: 54 }, { x: 28, y: 54 }], true);
    g.fillStyle(LILAC, 1); g.fillRect(10, 52, 28, 2); // 도포 밑단

    // 넓은 소매
    g.fillStyle(ROBE, 1);
    g.fillEllipse(11, 40, 11, 17);
    g.fillEllipse(37, 40, 11, 17);
    g.fillStyle(LILAC, 1);
    g.fillEllipse(11, 48, 9, 3);
    g.fillEllipse(37, 48, 9, 3);
    g.fillStyle(SKIN, 1);
    g.fillCircle(11, 50, 2);
    g.fillCircle(37, 50, 2);

    // 깃 (V자) + 허리띠 + 매듭 끈
    g.lineStyle(2, LILAC, 1);
    g.lineBetween(19, 29, 24, 36);
    g.lineBetween(29, 29, 24, 36);
    g.fillStyle(LILAC_DARK, 1); g.fillRect(15, 37, 18, 4);
    g.fillStyle(LILAC, 1);
    g.fillTriangle(22, 40, 19, 48, 23, 47);
    g.fillTriangle(26, 40, 29, 48, 25, 47);

    // 신발
    g.fillStyle(0x2a3370, 1);
    g.fillEllipse(19, 56, 7, 4);
    g.fillEllipse(29, 56, 7, 4);

    // 얼굴
    g.fillStyle(SKIN, 1); g.fillCircle(24, 20, 9.5);
    // 앞머리와 옆머리
    g.fillStyle(HAIR, 1);
    g.fillEllipse(24, 13, 22, 11);
    g.fillRect(14, 13, 4, 12);
    g.fillRect(30, 13, 4, 12);
    g.fillStyle(HAIR_LIGHT, 1); g.fillEllipse(21, 11, 8, 3); // 머리 윤기
    // 올림머리 + 은비녀 + 구슬
    g.fillStyle(HAIR, 1); g.fillCircle(24, 5, 5.5);
    g.lineStyle(2, SILVER, 1); g.lineBetween(16, 6, 33, 3);
    g.fillStyle(LILAC, 1); g.fillCircle(33, 3, 2);

    // 눈 (오른쪽을 보는 쪽으로 살짝) + 볼
    g.fillStyle(0x2a2440, 1);
    g.fillEllipse(21, 21, 2.6, 3.4);
    g.fillEllipse(28, 21, 2.6, 3.4);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(21.6, 20.2, 0.8);
    g.fillCircle(28.6, 20.2, 0.8);
    g.fillStyle(0xf2a7b8, 0.6);
    g.fillCircle(18.5, 24.5, 1.8);
    g.fillCircle(30.5, 24.5, 1.8);
    g.fillStyle(0xc4707e, 1); g.fillRect(24, 26, 2, 1); // 입
  });
}
