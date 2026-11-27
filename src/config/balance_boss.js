// 보스 밸런스 (balance.js에서 불러 쓴다). 시간 ms, 거리 픽셀

export const BOSS_BALANCE = {
  annihilateRatio: 0.12, // 멸요인을 맞으면 보스는 즉사 대신 최대 체력의 이만큼 피해
  slowFloor: 0.7,        // 보스는 이보다 더 느려지지 않는다 (빙결)
  catchUpRange: 320,     // 플레이어와 이보다 멀면
  catchUpMult: 4,        // 이만큼 빠르게 따라온다 (보스가 화면 밖에 오래 있지 않게)
  shedEveryRatio: 0.04,  // 보스가 최대 체력의 4%를 잃을 때마다 영기 구슬을 떨어뜨림 (카드 효과가 끝나도 보스전에 카드가 나오게)
  shedOrb: 12,           // 그 구슬의 영기 (저절로 날아옴)

  yojang: {              // 요장: 중간 보스. 돌진 + 잡귀 부르기
    name: '요장', hp: 1500, speed: 58, damage: 20, radius: 34, orb: 25,
    chargeEveryMs: 4500, windupMs: 900, dashSpeed: 470, dashMs: 600,
    summonEveryMs: 7000, summonCount: 6,
  },

  yohwang: {             // 요황: 최종 보스. 패턴 3개(돌진·탄막·내려찍기), 50%에서 2단계, 75초 광폭화, 120초 넘으면 패배
    // 체력 2500: 마지막 장소에서 장소 강화(+40%×3)가 곱해져 약 5500. 120초 제한 안에 쓰러지게
    name: '요황', hp: 2500, speed: 52, damage: 25, radius: 48, orb: 0,
    patternGapMs: [2600, 1700],   // 패턴 사이 쉬는 시간 [1단계, 2단계]
    charge: { windupMs: 900, dashSpeed: 520, dashMs: 700 },
    volley: {                     // 탄막: 빛을 모았다가 둥글게 탄을 퍼뜨림
      chargeMs: 800, count: [12, 18], waves: [1, 2], waveGapMs: 350,
      bulletSpeed: 170, bulletDamage: 14, bulletLifeMs: 5000, bulletRadius: 9,
    },
    slam: {                       // 내려찍기: 내 자리와 둘레에 예고 원 → 폭발
      warnMs: 1000, radius: 70, count: [3, 5], spread: 130, damage: 30,
    },
    phase2At: 0.5,                // 체력이 이 비율 아래면 2단계
    phase2SpeedMult: 1.25,
    summonEveryMs: 6000, summonCount: 5, // 2단계에서 부하 부르기
    enrageSec: 75,                // 나온 뒤 이 시간이 지나면 광폭화
    enrageMult: 1.5,              // 광폭화: 속도·피해 ×, 쉬는 시간 ÷
    defeatSec: 120,               // 나온 뒤 이 시간이 지나면 봉인석이 부서져 패배
  },
};
