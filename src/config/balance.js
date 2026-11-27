// 모든 밸런스 수치를 여기 모은다. 시간 단위: ms(밀리초, 1000 = 1초), 거리 단위: 픽셀.

import { SPELL_BALANCE, SUPPORT_BALANCE, CARD_BALANCE } from './balance_spells.js';
import { ENEMY_TYPES, ELITE, CHEST, WAVES, REALMS } from './balance_waves.js';
import { BOSS_BALANCE } from './balance_boss.js';
import { COMPANION_BALANCE, REVIVE_BALANCE, FIRST_RUN } from './balance_companion.js';
import { ARENA_BALANCE, JUMP_BALANCE, VEIL_BALANCE } from './balance_arena.js';

export const BALANCE = {
  /** 첫 판·2판·3판 난이도 비율 (요괴 체력과 수에 곱한다). 4판부터는 1.0 */
  runDifficulty: [0.6, 0.75, 0.9],
  // 점수 = 처치 수 + 버틴 초 × perSecond + 경지 보너스 + 클리어 보너스 (× 심마 배율, 6b)
  score: {
    perSecond: 10,
    realmBonus: [0, 200, 500, 1000, 2000], // 연기·축기·금단·원영·화신에 닿았을 때
    clearBonus: 3000,     // 요황 처치
    keepRecords: 10,      // 이 기기 순위표에 남기는 기록 수 (사용자 요청: 게임 끝에 순위)
  },
  companion: COMPANION_BALANCE, // 동료 → balance_companion.js
  revive: REVIVE_BALANCE,       // 인연 부활 → balance_companion.js
  firstRun: FIRST_RUN,          // 첫 판 각본 → balance_companion.js

  player: {
    maxHp: 100,           // 시작 최대 체력
    speed: 330,           // 이동 속도 (픽셀/초). 화면 폭 390 → 1초에 화면의 약 85%
    radius: 14,           // 몸 크기 (부딪힘 판정 반지름)
    hurtInvulnMs: 350,    // 맞은 뒤 무적 시간 (사용자 요청 '너무 안 죽어'로 500→350)
  },

  // 손가락 따라 움직이기 (사용자 요청): 손가락이 움직인 거리 × ratio 만큼 주인공이 움직인다
  drag: {
    ratio: 1,             // 1 = 손가락과 똑같이
    maxStep: 40,          // 한 걸음(1/60초)에 이보다 많이 움직이면 나눠서 (장애물을 뚫지 않게)
  },
  joystick: {             // (예전 조이스틱 방식, 지금은 안 씀)
    radius: 60,           // 조이스틱 바깥 원 반지름
    fullAt: 0.3,          // 반지름의 이 비율만큼 끌면 최고 속도 (0.3 → 약 18px만 끌어도 최고 속도)
    deadZone: 4,          // 이보다 적게 끌면 움직이지 않음
  },

  spells: SPELL_BALANCE,      // 법술 수치 → balance_spells.js
  supports: SUPPORT_BALANCE,  // 보조 법술 → balance_spells.js
  cards: CARD_BALANCE,        // 카드 등급 → balance_spells.js
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
    // 카드 효과가 45초만 가므로(사용자 요청) 카드가 꾸준히 나오게 뒤로 갈수록 덜 가파르게
    base: 5,              // Lv1→2: 구슬 5개
    growth: 1.0,
    add: 3,               // 레벨마다 3개씩 더 (Lv2→3: 8, Lv10→11: 35, Lv20→21: 65, Lv30→31: 95)
  },
  // 레벨업 카드는 바닥에 떨어진다 (사용자 요청: 고르는 화면 대신 주우러 간다)
  fieldCards: {
    minDist: 200,         // 주인공에게서 이 거리 이상 떨어진 곳에 (대부분 화면 밖)
    maxDist: 450,         // 이 거리 안에
    pickRadius: 18,       // 이만큼 닿으면 주움 (3장 모두 주울 수 있음)
    max: 30,              // 바닥에 동시에 있을 수 있는 카드 수 (넘으면 바로 적용)
    effectSec: 45,        // 주운 카드(보물상자·합일 포함) 효과가 유지되는 시간(초). 끝나면 그만큼 단계가 내려감
  },
  minimap: {              // 작은 지도 (오른쪽 위): 장소 전체를 보여 준다
    height: 96,           // 지도 높이 (픽셀). 너비는 장소 비율대로
    top: 62,              // 화면 위에서 떨어진 거리
  },

  arena: ARENA_BALANCE,   // 장소·장애물 → balance_arena.js
  jump: JUMP_BALANCE,     // 점프 → balance_arena.js
  veil: VEIL_BALANCE,     // 은형부 카드 → balance_arena.js

  enemies: {
    // 플레이어를 똑바로 쫓아오는 요괴. 내 레벨이 fromLevel 이상이면 그 요괴가 나온다 (사용자 요청: 레벨이 오를수록 모양이 바뀌고 세진다)
    // hp 체력 · speed 이동 속도 · damage 닿았을 때 피해 · radius 몸 크기 · orb 떨어뜨리는 영기
    tiers: [
      // 잡귀: 비검 한 방(피해 12)에 죽게 (사용자 요청: 쾌감). noGrowth = 시간이 지나도 체력이 안 오름
      { key: 'jabgwi', name: '잡귀', fromLevel: 1, hp: 12, noGrowth: true, speed: 62, damage: 8, radius: 13, orb: 1 },
      { key: 'yagwi', name: '야귀', fromLevel: 3, hp: 34, speed: 68, damage: 10, radius: 14, orb: 1 },
      { key: 'hyunggwi', name: '흉귀', fromLevel: 5, hp: 55, speed: 74, damage: 13, radius: 15, orb: 2 },
      { key: 'akgwi', name: '악귀', fromLevel: 7, hp: 85, speed: 80, damage: 16, radius: 17, orb: 2 },
      { key: 'hyeolgwi', name: '혈귀', fromLevel: 10, hp: 125, speed: 86, damage: 20, radius: 19, orb: 3 },
    ],
    lowerTierChance: 0.3, // 이 확률로 한 단계 아래 요괴가 섞여 나옴
    speedJitter: 0.2,     // 마리마다 속도를 ±10%씩 다르게
    hpGrowthPerMin: 0.3,  // 1분마다 새로 나오는 요괴 체력 +30%
    damageMult: 1.5,      // 모든 요괴 공격력 배율 (사용자 요청 '너무 안 죽어')
    countMult: 1.25,      // 나오는 요괴 수 배율 (같은 까닭)
    types: ENEMY_TYPES,   // 특수 요괴 5종 → balance_waves.js
    elite: ELITE,         // 정예 → balance_waves.js
  },
  waves: WAVES,           // 웨이브 7개 (나오는 수·종류·정예·보물상자) → balance_waves.js
  realms: REALMS,         // 경지 돌파 → balance_waves.js
  chest: CHEST,           // 보물상자 → balance_waves.js
  boss: BOSS_BALANCE,     // 요장·요황 → balance_boss.js

  spawn: {
    ringMargin: 60,       // 화면 밖 이만큼 떨어진 곳에서 나옴
    farDistance: 2500,    // 플레이어와 이보다 멀어지면 다시 옮김 (결계 장소 대각선보다 길게 = 사실상 안 씀)
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
