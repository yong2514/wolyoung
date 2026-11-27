// 동료 서하 그림 (도형, 오리지널): 은발을 높이 묶은 냉정한 검선. 남색 도포 + 은빛 테, 허리에 검.
// 'seoha' 44×60 (게임 안), 'seohaPortrait' 200×240 (부활·대화 장면). 손가락 안내, 붉은 화면 가장자리.

const HAIR = 0xdfe4f2;     // 은발
const HAIR_SHADE = 0xaab2cc;
const SKIN = 0xf3dccb;
const ROBE = 0x26306a;     // 남색 도포
const ROBE_LIGHT = 0x37428a;
const TRIM = 0xc9d2ec;     // 은빛 테
const EYE = 0x3a5a9a;      // 푸른 눈

export function makeCompanionTextures(scene, tex) {
  tex('seoha', 44, 60, (g) => {
    g.fillStyle(HAIR_SHADE, 1); g.fillEllipse(22, 26, 22, 30);           // 뒤로 늘어진 머리
    g.fillStyle(ROBE, 1);
    g.fillPoints([{ x: 14, y: 28 }, { x: 30, y: 28 }, { x: 36, y: 56 }, { x: 8, y: 56 }], true);
    g.fillStyle(ROBE_LIGHT, 1); g.fillRect(20, 30, 4, 26);
    g.lineStyle(2, TRIM, 1); g.lineBetween(8, 56, 36, 56); g.lineBetween(17, 28, 22, 36); g.lineBetween(27, 28, 22, 36);
    g.fillStyle(TRIM, 1); g.fillRect(13, 37, 18, 3);                     // 허리띠
    g.lineStyle(3, 0x9aa6c8, 1); g.lineBetween(30, 38, 42, 50);           // 허리의 검
    g.fillStyle(SKIN, 1); g.fillCircle(22, 18, 8.5);                      // 얼굴
    g.fillStyle(HAIR, 1); g.fillEllipse(22, 12, 20, 10); g.fillRect(13, 12, 3, 12); g.fillRect(28, 12, 3, 12);
    g.fillStyle(HAIR, 1); g.fillEllipse(22, 3, 8, 7);                     // 높이 묶은 머리
    g.lineStyle(2, ROBE, 1); g.lineBetween(18, 6, 26, 6);                 // 머리끈
    g.fillStyle(EYE, 1); g.fillRect(17, 18, 3, 2); g.fillRect(24, 18, 3, 2); // 가늘게 뜬 눈
    g.fillStyle(0x2a2440, 1); g.fillEllipse(19, 59, 6, 3); g.fillEllipse(26, 59, 6, 3);
  });

  tex('seohaPortrait', 200, 240, (g) => {
    g.fillStyle(HAIR_SHADE, 1); g.fillEllipse(100, 120, 120, 170);      // 뒷머리
    g.fillStyle(ROBE, 1);                                                  // 어깨·도포
    g.fillPoints([{ x: 24, y: 240 }, { x: 40, y: 170 }, { x: 100, y: 150 }, { x: 160, y: 170 }, { x: 176, y: 240 }], true);
    g.fillStyle(ROBE_LIGHT, 1);
    g.fillPoints([{ x: 100, y: 150 }, { x: 130, y: 160 }, { x: 112, y: 240 }, { x: 88, y: 240 }], true);
    g.lineStyle(5, TRIM, 1); g.lineBetween(76, 158, 100, 205); g.lineBetween(124, 158, 100, 205); // 깃
    g.lineStyle(8, 0x9aa6c8, 1); g.lineBetween(150, 130, 188, 70);       // 어깨 위 칼자루
    g.fillStyle(0x5a4a96, 1); g.fillRect(178, 60, 14, 20);
    g.fillStyle(SKIN, 1); g.fillRect(88, 130, 24, 26);                    // 목
    g.fillStyle(SKIN, 1); g.fillEllipse(100, 98, 76, 88);                 // 얼굴
    g.fillStyle(HAIR, 1);                                                  // 앞머리
    g.fillEllipse(100, 62, 92, 50);
    g.fillTriangle(60, 60, 58, 130, 72, 80);
    g.fillTriangle(140, 60, 142, 130, 128, 80);
    g.fillTriangle(86, 70, 100, 96, 108, 68);
    g.fillStyle(HAIR, 1); g.fillEllipse(100, 22, 36, 30);                 // 높이 묶은 머리
    g.lineStyle(6, ROBE, 1); g.lineBetween(84, 34, 116, 34);
    g.fillStyle(0xffffff, 1); g.fillEllipse(80, 102, 18, 8); g.fillEllipse(120, 102, 18, 8); // 눈
    g.fillStyle(EYE, 1); g.fillEllipse(81, 102, 9, 8); g.fillEllipse(119, 102, 9, 8);
    g.lineStyle(3, 0x2a2440, 1); g.lineBetween(70, 97, 90, 95); g.lineBetween(110, 95, 130, 97); // 눈썹선
    g.lineStyle(2, 0xb07080, 1); g.lineBetween(94, 126, 106, 126);       // 입
  });

  // 손가락 안내 (끌어서 움직이기)
  tex('hand', 40, 48, (g) => {
    g.fillStyle(0xffffff, 0.95);
    g.fillRoundedRect(14, 2, 10, 26, 5);   // 검지
    g.fillRoundedRect(8, 20, 26, 24, 9);   // 손바닥
    g.fillStyle(0xdfe4f2, 1); g.fillCircle(19, 6, 4);
  });

  // 체력 20% 이하: 붉은 화면 가장자리
  const W = scene.scale.gameSize.width;
  const H = scene.scale.gameSize.height;
  const ct = scene.textures.createCanvas('vignetteRed', W, H);
  const ctx = ct.getContext();
  const grad = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.6);
  grad.addColorStop(0, 'rgba(255,60,40,0)');
  grad.addColorStop(1, 'rgba(255,60,40,0.55)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  ct.refresh();
}
