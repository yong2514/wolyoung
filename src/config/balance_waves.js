// 웨이브·특수 요괴·정예·보물상자·경지 밸런스 (balance.js에서 불러 쓴다)

// 특수 요괴 (행동이 다른 요괴). 쫓아오는 요괴(잡귀 등)는 balance.js enemies.tiers
// hp 체력 · speed 속도 · damage 피해 · radius 크기 · orb 영기
export const ENEMY_TYPES = {
  charger: {            // 돌진귀: 다가오다 멈춰 예고선(0.7초) → 그 방향으로 돌진
    name: '돌진귀', hp: 40, speed: 70, damage: 14, radius: 15, orb: 2,
    triggerRange: 230,  // 이 거리 안이면 돌진 준비
    windupMs: 700,      // 예고선 보여 주는 시간
    dashSpeed: 440, dashMs: 500, restMs: 1600,
  },
  ranged: {             // 원귀: 거리를 두고 빛을 모았다가(0.6초) 탄을 쏜다
    name: '원귀', hp: 28, speed: 64, damage: 6, radius: 14, orb: 2,
    keepRange: 230,     // 이 거리를 유지하려 함
    fireEveryMs: 2600, chargeMs: 600,
    bulletDamage: 10, bulletSpeed: 190, bulletLifeMs: 4000, bulletRadius: 7,
  },
  splitter: {           // 분열귀: 죽으면 작은 분열귀 둘로 나뉜다
    name: '분열귀', hp: 45, speed: 58, damage: 9, radius: 16, orb: 1, splitCount: 2,
  },
  splitling: {          // 작은 분열귀 (분열귀가 죽을 때만 나옴)
    name: '작은 분열귀', hp: 14, speed: 88, damage: 6, radius: 10, orb: 1,
  },
  shield: {             // 방패귀: 앞(나를 보는 쪽)에서 날아온 공격은 80% 막는다 → 장판·도는 구슬로 잡기
    name: '방패귀', hp: 60, speed: 50, damage: 12, radius: 16, orb: 2,
    blockArcDeg: 120,   // 막는 각도
    blockMult: 0.2,     // 막았을 때 들어가는 피해 비율
  },
  bomber: {             // 폭귀: 빨리 다가와 멈추고 예고 원(0.8초) 뒤 폭발
    name: '폭귀', hp: 22, speed: 100, damage: 26, radius: 13, orb: 1,
    triggerRange: 60, fuseMs: 800, blastRadius: 75,
  },
};

// 정예: 크고 금빛 테두리. 잡으면 보물상자
export const ELITE = { hpMult: 7, damageMult: 1.4, scale: 1.5, orbMult: 4 };

// 보물상자: 가진 법술 하나 즉시 강화 (올릴 게 없으면 선옥)
export const CHEST = { radius: 18, seonok: 15 };

// 웨이브 7개 × 30초 = 3분 30초, 그다음 보스(3b). mix는 요괴 종류 비율 (chaser = 잡귀~혈귀)
// rate: 1초에 나오는 수, elites: 그 웨이브에서 정예가 나오는 초, chests: 웨이브 시작 때 놓는 보물상자 수
export const WAVES = {
  waveSec: 30,
  bossAtSec: 210,
  list: [
    { label: '몸풀기', rate: 1.6, mix: { chaser: 1 } },
    { label: '몸풀기', rate: 2.4, mix: { chaser: 0.8, charger: 0.2 } },
    { label: '정예 출현', rate: 3.0, mix: { chaser: 0.6, charger: 0.2, ranged: 0.2 }, elites: [8] },
    { label: '요괴가 거세진다', rate: 3.8, mix: { chaser: 0.5, charger: 0.15, ranged: 0.15, splitter: 0.2 }, elites: [12] },
    { label: '숨 고르기', rate: 1.3, mix: { chaser: 0.6, splitter: 0.2, shield: 0.2 }, chests: 2 },
    { label: '요괴의 물결', rate: 6.0, mix: { chaser: 0.4, charger: 0.15, ranged: 0.15, shield: 0.15, bomber: 0.15 }, elites: [5, 20] },
    { label: '마지막 고비', rate: 7.5, mix: { chaser: 0.35, charger: 0.15, ranged: 0.15, splitter: 0.1, shield: 0.1, bomber: 0.15 }, elites: [3, 15, 25] },
    { label: '요황 출현', rate: 0.6, mix: { chaser: 0.8, ranged: 0.2 }, boss: true }, // 웨이브 8: 보스전 (요괴는 적게, 요황이 나올 때 남은 요괴는 흩어짐)
  ],
};

// 경지: 레벨이 level에 닿으면 돌파 (첫 돌파 60초 안, 화신은 보스 직전쯤)
export const REALMS = {
  list: [
    { name: '연기', level: 1, color: 0xb9a6e8 },
    { name: '축기', level: 3, color: 0x8fd0ff },
    { name: '금단', level: 7, color: 0xffd36a },
    { name: '원영', level: 11, color: 0x9fffd0 },
    { name: '화신', level: 14, color: 0xffffff },
  ],
  slowMs: 1500,         // 느려지는 시간 (실제 시간)
  slowScale: 0.3,       // 그동안 게임 속도
  healRatio: 0.3,       // 체력 회복 (최대 체력의 30%)
  damageBonus: 0.15,    // 돌파마다 공격력 +15% (그 판 동안)
  blastRadius: 300,     // 이 안의 요괴가 날아감
  blastPush: 700,       // 날아가는 처음 속도
  blastDamage: 40,      // 날아가며 받는 피해
  nearRatio: 0.6,       // 돌파 한 레벨 전, 영기 막대가 이만큼 차면 '돌파 임박'
};
