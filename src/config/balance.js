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

  spells: {
    flyingSword: {        // 비검: 가장 가까운 적에게 날아가 꿰뚫는 검
      damage: 12,         // 한 번 맞힐 때 피해
      cooldownMs: 600,    // 발사 간격
      speed: 540,         // 검이 날아가는 속도 (픽셀/초)
      pierce: 2,          // 꿰뚫는 횟수 (2 = 세 마리까지 맞힘)
      range: 420,         // 이 거리 안의 적만 노림
      lifeMs: 1000,       // 검이 사라지기까지 시간
    },
  },

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
