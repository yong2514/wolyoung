// 법술 밸런스 수치 (balance.js에서 불러 쓴다. 파일이 길어서 나눔)
// [ ]로 된 값은 1~5단계 순서. 하나만 있는 값은 모든 단계 같음. 시간 ms, 거리 픽셀.

export const SPELL_BALANCE = {
  maxLevel: 5,          // 같은 법술 최대 단계 (법술마다 maxLevel로 바꿀 수 있음)
  slots: { attack: 5, support: 4 }, // 한 판에 가질 수 있는 법술 수
  startWith: 'flyingSword', // 시작 법술

  // ── 공격 법술 ──
  flyingSword: {        // 비검: 가장 가까운 적에게 날아가 꿰뚫는 검
    damage: [12, 15, 18, 22, 27],        // 한 번 맞힐 때 피해
    count: [1, 1, 2, 2, 3],              // 한 번에 날리는 검 수
    pierce: [2, 2, 3, 3, 4],             // 꿰뚫는 횟수 (2 = 세 마리까지 맞힘)
    cooldownMs: [600, 560, 520, 480, 420], // 발사 간격
    speed: 540,         // 검이 날아가는 속도 (픽셀/초)
    spread: 0.2,        // 검이 여러 개일 때 사이 각도 (라디안)
    range: 420,         // 이 거리 안의 적만 노림
    lifeMs: 1000,       // 검이 사라지기까지 시간
  },
  thunder: {            // 뇌부: 화면 안 무작위 요괴에게 낙뢰
    damage: [30, 38, 46, 56, 70],
    strikes: [1, 2, 2, 3, 4],            // 한 번에 떨어지는 낙뢰 수
    radius: [36, 38, 42, 46, 52],        // 낙뢰 범위
    cooldownMs: [1500, 1400, 1300, 1200, 1050],
  },
  lotus: {              // 연화진: 서 있던 자리에 연꽃 장판, 안의 요괴에게 계속 피해
    damage: [6, 8, 10, 12, 15],          // 한 번 피해 (tickMs마다)
    radius: [60, 66, 72, 80, 90],
    durationMs: [3000, 3200, 3400, 3700, 4000], // 장판이 남아 있는 시간
    cooldownMs: [3200, 3000, 2800, 2600, 2300],
    tickMs: 400,        // 피해 주는 간격
  },
  guard: {              // 호신강기: 주위를 도는 기운 구슬. 부딪칠 때마다 닳아서 사라진다 (사용자 요청)
    maxLevel: 3,        // 이 법술만 3단계까지
    count: [1, 2, 3],   // 구슬 수 (첫 카드 1개, 두 번째 2개, 세 번째 3개)
    hitsPerOrb: 10,     // 구슬 하나가 요괴와 이만큼 부딪치면 사라짐. 모두 사라지면 법술을 잃고 카드가 다시 나온다
    damage: [10, 12, 14],
    orbit: [58, 61, 64],    // 도는 반지름
    spin: [2.8, 3.0, 3.2],  // 1초에 도는 각도 (라디안)
    hitCooldownMs: 450, // 같은 요괴를 다시 때리기까지 시간
    knockback: 10,      // 맞은 요괴를 밀어내는 거리
    orbRadius: 11,      // 구슬 크기
  },
  frost: {              // 빙결: 내 둘레를 얼려 피해 + 느리게
    damage: [10, 13, 16, 20, 25],
    radius: [90, 100, 110, 120, 135],
    slowMult: [0.6, 0.55, 0.5, 0.45, 0.4], // 느려진 속도 배율 (0.6 = 40% 느려짐)
    slowMs: [1500, 1700, 1900, 2100, 2400], // 느려지는 시간
    cooldownMs: [2600, 2400, 2200, 2000, 1800],
  },
  blueFlame: {          // 청염: 가장 가까운 적 쪽으로 부채꼴 푸른 불꽃
    damage: [14, 18, 23, 28, 35],
    range: [130, 140, 150, 165, 180],    // 불꽃 길이
    angleDeg: [60, 65, 70, 75, 85],      // 부채꼴 각도
    cooldownMs: [900, 850, 800, 750, 700],
  },
  talisman: {           // 부적진: 둘레에 부적을 놓고, 요괴가 밟거나 시간이 지나면 폭발
    damage: [40, 50, 62, 75, 90],
    radius: [55, 60, 66, 72, 80],        // 폭발 범위
    count: [1, 1, 2, 2, 3],              // 한 번에 놓는 부적 수
    cooldownMs: [2200, 2100, 2000, 1900, 1700],
    armMs: 400,         // 놓은 뒤 이 시간이 지나야 터질 수 있음
    fuseMs: 4000,       // 아무도 안 밟으면 이 시간 뒤 저절로 폭발
    triggerRadius: 26,  // 요괴가 이만큼 가까이 오면 폭발
    scatter: 90,        // 내 둘레 이 거리 안에 흩어 놓음
  },
  moonRing: {           // 월륜: 날아갔다 돌아오는 달 고리 (오가며 꿰뚫음). 연사결 적용
    damage: [14, 18, 22, 27, 33],
    count: [1, 1, 2, 2, 3],
    range: [220, 240, 260, 280, 300],    // 날아가는 거리
    cooldownMs: [1600, 1500, 1400, 1300, 1150],
    speed: 420,         // 나가는 속도
    returnSpeed: 520,   // 돌아오는 속도
    spread: 0.5,        // 여러 개일 때 사이 각도
    hitCooldownMs: 300, // 같은 요괴를 다시 때리기까지
    radius: 16,         // 고리 크기
  },
  annihilate: {         // 멸요인 (사용자 요청): 버튼 → 원을 옮김 → '발동'하면 원 안 요괴를 모두 없앤다
    maxLevel: 3,
    radius: [90, 110, 135],               // 원 크기
    cooldownMs: [30000, 25000, 20000],    // 다시 쓰기까지 시간 (게임 시간)
  },

  // ── 합일 법술: 재료 두 법술을 최대로 올리면 다음 레벨업에 반드시 나옴. 단계 없음 ──
  thunderSword: {       // 뇌정만검 = 비검 + 뇌부: 검 여러 자루, 맞힐 때 낙뢰
    damage: 34, count: 5, pierce: 6, cooldownMs: 420, speed: 640, spread: 0.3, range: 460, lifeMs: 1100,
    boltChance: 0.35,   // 맞힐 때 낙뢰가 떨어질 확률
    boltDamage: 40, boltRadius: 44,
  },
  frostLotus: {         // 빙련결계 = 연화진 + 빙결: 나를 따라다니는 얼음 연꽃. 안의 요괴는 느려지고 계속 피해
    damage: 18, radius: 135, tickMs: 350, slowMult: 0.4, slowMs: 700,
  },
  flameGuard: {         // 청염강기 = 호신강기 + 청염: 깨지지 않는 푸른 불꽃 구슬 5개
    count: 5, damage: 26, orbit: 80, spin: 3.6, hitCooldownMs: 350, knockback: 14, orbRadius: 15,
    hitsPerOrb: Infinity, // 깨지지 않음
  },
  moonSeal: {           // 월하봉마진 = 부적진 + 월륜: 주기적으로 큰 봉인진, 안의 요괴를 멈추고 피해
    damage: 60, radius: 175, stunMs: 1500, cooldownMs: 3800,
  },
};

// 보조 법술: 단계마다 더해지는 양
export const SUPPORT_BALANCE = {
  moveSpeed: { perLevel: 0.1 },     // 경신술: 이동 속도 +10%씩
  attackSpeed: { perLevel: 0.08 },  // 속법: 공격 간격 -8%씩
  maxHp: { perLevel: 20 },          // 금강체: 최대 체력 +20씩 (늘어난 만큼 회복)
  multiShot: {                      // 연사결 (사용자 요청): 날아가는 법술(비검·월륜) 강화
    maxLevel: 3,
    perLevel: 1,                    // 한 번에 날아가는 수 +1씩
    speedPerLevel: 0.1,             // 날아가는 속도 +10%씩
  },
  lifesteal: { perLevel: 0.006 },   // 흡혈공: 준 피해의 0.6%씩 체력 회복
  magnet: { perLevel: 0.3 },        // 섭기술: 구슬 흡수 범위 +30%씩
  xpGain: { perLevel: 0.1 },        // 취령술: 영기 획득량 +10%씩
};

// 카드 등급: 일반 +1단계, 희귀 +2단계, 전설 +3단계 (최대 단계를 넘지 않음)
export const CARD_BALANCE = {
  rarity: { legend: 0.05, rare: 0.2 }, // 나올 확률 (나머지는 일반)
  gain: { common: 1, rare: 2, legend: 3 }, // 한 번에 오르는 단계
  refreshPerRun: 1,    // 한 판에 카드 새로고침 횟수 (수련으로 늘릴 예정)
  banishPerRun: 1,     // 한 판에 봉인 횟수 (봉인한 법술은 그 판에서 다시 안 나옴)
  stashMax: 3,         // 보관함에 넣어 둘 수 있는 카드 수 (사용자 요청: 나중에 꺼내 쓰기)
};
