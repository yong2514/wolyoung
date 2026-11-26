// 주인공 "월영" 그림 (도형): 여자 도사. 올림머리 + 은비녀, 발목까지 늘어지는 흰 도포, 연보라 허리띠·넓은 소매, 등에 멘 검.
// 48×64, 오른쪽을 보는 모습 (왼쪽으로 갈 때는 flipX). 기준점은 몸 가운데 (player.js setOrigin)
// 그림 이름: player (서 있음), player_w0 ~ player_w3 (걷기 4장: 왼발 듦 → 모음 → 오른발 듦 → 모음)

const HAIR = 0x1f1a33;
const HAIR_LIGHT = 0x3a3156;
const SKIN = 0xf6dcc8;
const ROBE = 0xeef1fa;
const ROBE_SHADE = 0xc9cfe4;
const LILAC = 0xb9a6e8;
const LILAC_DARK = 0x8a73c9;
const SILVER = 0xdfe4f2;
const LEG = 0xb8bfdc;   // 바지 (밝은 은회색: 남색 바닥에서 잘 보이게)
const SHOE = 0x7a62c4;  // 신발 (보라)

export const WALK_FRAMES = 4;

/** step: -1 왼발 듦 · 0 모음 · 1 오른발 듦, sway: 도포 밑단 흔들림(px) */
function drawPlayer(g, step, sway) {
  // 등에 멘 검 (오른쪽 어깨 위로 칼자루)
  g.lineStyle(3, 0x9aa6c8, 1); g.lineBetween(40, 16, 14, 46);
  g.fillStyle(LILAC_DARK, 1);
  g.fillPoints([{ x: 40, y: 10 }, { x: 45, y: 13 }, { x: 42, y: 19 }, { x: 37, y: 16 }], true); // 칼자루
  g.lineStyle(2, SILVER, 1); g.lineBetween(35, 19, 42, 23); // 코등이

  // 뒤로 늘어진 긴 머리
  g.fillStyle(HAIR, 1);
  g.fillEllipse(23, 28, 24, 32);

  // 다리 (도포 아래로 보임): 든 발은 위로 4px
  const legs = [[19, step < 0 ? -5 : 0], [29, step > 0 ? -5 : 0]];
  for (const [x, up] of legs) {
    g.fillStyle(LEG, 1); g.fillRect(x - 2.5, 50 + up, 5, 9);
    g.fillStyle(SHOE, 1); g.fillEllipse(x + 0.5, 60 + up, 8, 5);
  }

  // 발목까지 늘어지는 도포 (밑단이 걸음에 맞춰 흔들림)
  const hem = 54;
  g.fillStyle(ROBE, 1);
  g.fillPoints([
    { x: 16, y: 29 }, { x: 32, y: 29 },
    { x: 38 + sway, y: hem }, { x: 24 + sway * 0.5, y: hem + 1 }, { x: 10 + sway, y: hem },
  ], true);
  g.fillStyle(ROBE_SHADE, 1); // 오른쪽 주름 그림자
  g.fillPoints([{ x: 27, y: 41 }, { x: 33, y: 41 }, { x: 38 + sway, y: hem }, { x: 29 + sway, y: hem + 1 }], true);
  g.lineStyle(1, ROBE_SHADE, 1); g.lineBetween(22, 42, 20 + sway, hem); // 왼쪽 주름 선
  g.lineStyle(2, LILAC, 1); // 밑단 테두리
  g.lineBetween(10 + sway, hem, 24 + sway * 0.5, hem + 1);
  g.lineBetween(24 + sway * 0.5, hem + 1, 38 + sway, hem);

  // 넓은 소매 (걸을 때 다리와 반대로 살짝 흔들림)
  const arm = step * 1.5;
  for (const [x, dy] of [[11, arm], [37, -arm]]) {
    g.fillStyle(ROBE, 1); g.fillEllipse(x, 40 + dy, 11, 17);
    g.fillStyle(LILAC, 1); g.fillEllipse(x, 48 + dy, 9, 3);
    g.fillStyle(SKIN, 1); g.fillCircle(x, 50 + dy, 2);
  }

  // 깃 (V자) + 허리띠 + 매듭 끈 (끈도 흔들림)
  g.lineStyle(2, LILAC, 1);
  g.lineBetween(19, 29, 24, 36);
  g.lineBetween(29, 29, 24, 36);
  g.fillStyle(LILAC_DARK, 1); g.fillRect(15, 37, 18, 4);
  g.fillStyle(LILAC, 1);
  g.fillTriangle(22, 40, 19 + sway, 49, 23, 48);
  g.fillTriangle(26, 40, 29 + sway, 49, 25, 48);

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

  // 눈 + 볼 + 입
  g.fillStyle(0x2a2440, 1);
  g.fillEllipse(21, 21, 2.6, 3.4);
  g.fillEllipse(28, 21, 2.6, 3.4);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(21.6, 20.2, 0.8);
  g.fillCircle(28.6, 20.2, 0.8);
  g.fillStyle(0xf2a7b8, 0.6);
  g.fillCircle(18.5, 24.5, 1.8);
  g.fillCircle(30.5, 24.5, 1.8);
  g.fillStyle(0xc4707e, 1); g.fillRect(24, 26, 2, 1);
}

export function makePlayerTexture(tex) {
  tex('player', 48, 64, (g) => drawPlayer(g, 0, 0));
  const frames = [[-1, -2], [0, 0], [1, 2], [0, 0]]; // [발, 밑단 흔들림]
  frames.forEach(([step, sway], i) => tex(`player_w${i}`, 48, 64, (g) => drawPlayer(g, step, sway)));
}
