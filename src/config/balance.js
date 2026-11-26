// 모든 밸런스 수치를 여기 모은다. 시간 단위: ms(밀리초, 1000 = 1초), 거리 단위: 픽셀.

export const BALANCE = {
  /** 첫 판·2판·3판 난이도 비율 (요괴 체력과 수에 곱한다). 4판부터는 1.0 — 4단계에서 사용 */
  runDifficulty: [0.6, 0.75, 0.9],

  player: {
    maxHp: 100,           // 시작 최대 체력
    speed: 280,           // 이동 속도 (픽셀/초). 화면 폭 390 → 1초에 화면의 약 70%
    radius: 14,           // 몸 크기 (부딪힘 판정 반지름)
    hurtInvulnMs: 500,    // 맞은 뒤 무적 시간
  },

  joystick: {
    radius: 60,           // 조이스틱 바깥 원 반지름
    fullAt: 0.3,          // 반지름의 이 비율만큼 끌면 최고 속도 (0.3 → 약 18px만 끌어도 최고 속도)
    deadZone: 4,          // 이보다 적게 끌면 움직이지 않음
  },

  // 법술 수치. [ ]로 된 값은 1~5단계 순서. 하나만 있는 값은 모든 단계 같음.
  spells: {
    maxLevel: 5,          // 같은 법술 최대 단계
    slots: { attack: 5, support: 4 }, // 한 판에 가질 수 있는 법술 수
    startWith: 'flyingSword', // 시작 법술

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
  },

  // 보조 법술: 단계마다 더해지는 양
  supports: {
    moveSpeed: { perLevel: 0.1 },     // 이동 속도 +10%씩
    attackSpeed: { perLevel: 0.08 },  // 공격 간격 -8%씩
    maxHp: { perLevel: 20 },          // 최대 체력 +20씩 (늘어난 만큼 회복)
  },
  elixirHeal: 30,         // 고를 법술이 하나도 없을 때 나오는 '영약' 카드: 체력 회복량

  // 영기 구슬과 레벨업: 요괴가 구슬을 떨어뜨리고, 주워야 영기가 오른다.
  orbs: {
    value: 1,             // 잡귀가 떨어뜨리는 영기
    magnetRange: 80,      // 이 거리 안이면 끌려옴
    pullSpeed: 260,       // 끌려오기 시작하는 속도
    pullAccel: 1400,      // 끌려오는 가속 (픽셀/초²)
    pickRadius: 10,       // 이만큼 닿으면 먹음
    max: 300,             // 화면에 이보다 많으면 합침
    mergeCount: 60,       // 넘었을 때 오래된 것부터 이만큼을 큰 구슬 하나로
  },
  xp: {                   // 다음 레벨까지 필요한 영기(= 주울 구슬 수) = base × growth^(레벨-1) + add × (레벨-1)
    base: 6,              // Lv1→2: 구슬 6개
    growth: 1.15,
    add: 10,              // 레벨마다 10개씩 더 (Lv2→3: 17, Lv3→4: 28, Lv5→6: 50 …)
  },
  cardLockMs: 400,        // 카드가 뜬 뒤 이 시간 동안 터치를 받지 않음 (오터치 방지)

  enemies: {
    jabgwi: {             // 잡귀: 플레이어를 똑바로 쫓아옴
      hp: 20,             // 체력
      speed: 62,          // 이동 속도
      speedJitter: 0.2,   // 마리마다 속도를 ±10%씩 다르게
      damage: 8,          // 닿았을 때 플레이어가 받는 피해
      radius: 13,         // 몸 크기
    },
    hpGrowthPerMin: 0.3,  // 1분마다 새로 나오는 요괴 체력 +30%
  },

  spawn: {
    startPerSec: 1.5,     // 시작할 때 1초에 나오는 요괴 수
    growthPerSec: 0.05,   // 1초 지날 때마다 늘어나는 양
    maxPerSec: 14,        // 1초에 나오는 최대 수
    ringMargin: 60,       // 화면 밖 이만큼 떨어진 곳에서 나옴
    farDistance: 900,     // 플레이어와 이보다 멀어지면 앞쪽으로 다시 옮김
  },

  limits: {
    enemyCap: 150,        // 화면 안 요괴 수 상한
    enemyCapMin: 60,      // 느린 기기에서 상한을 낮출 때 최저값
    damageNumbers: 40,    // 동시에 뜨는 숫자 최대 수
    particles: 300,       // 파티클(불꽃 조각) 최대 수
    bullets: 200,         // 검·탄 최대 수
    gridCell: 64,         // 공간 격자 한 칸 크기
  },

  performance: {
    lowFps: 45,           // 이 프레임보다 낮으면 느리다고 봄
    checkSec: 3,          // 이 시간 동안 계속 느리면 줄이기 시작
    particleStep: 0.5,    // 파티클 수를 이 배율로 줄임
    minParticleScale: 0.25, // 파티클은 이 배율까지만 줄이고, 그 뒤엔 요괴 상한을 낮춤
    capStep: 20,          // 요괴 상한을 한 번에 줄이는 양
  },

  feel: {
    killShake: { durationMs: 60, intensity: 0.003 },  // 처치 때 화면 흔들림
    hurtShake: { durationMs: 160, intensity: 0.012 }, // 맞을 때 화면 흔들림
    killParticles: 7,     // 처치 때 튀는 조각 수
    hitFlashMs: 70,       // 맞은 요괴가 하얗게 번쩍이는 시간
    vibrateHurtMs: 40,    // 맞을 때 진동 길이 (지원 기기만)
    numberLifeMs: 600,    // 피해 숫자가 떠 있는 시간
  },

  run: {
    waveSec: 30,          // 웨이브 하나 길이 (자동 점검의 '도달 웨이브' 계산에도 씀)
    autoMaxSec: 240,      // 자동 플레이 한 판 최대 시간 (게임 안 시간)
  },
};
