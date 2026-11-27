// 동료·인연 부활·첫 판 각본 밸런스 (balance.js에서 불러 쓴다). 시간 ms, 거리 픽셀

export const COMPANION_BALANCE = {
  followDist: 46,        // 주인공 뒤 이만큼 떨어져 따라감
  teleportDist: 340,     // 이보다 멀어지면 곁으로 순간이동
  synergyBonus: 1.2,     // 궁합 법술 효과 배율 (그 동료와 함께일 때 +20%)
  effectAlpha: 0.55,     // 동료 법술은 내 법술보다 연하게
  seoha: {               // 서하 · 천검결: 주기적으로 둘레 요괴에게 검비
    cooldownMs: 4000,
    firstMs: 2500,       // 판 시작 뒤 첫 천검결까지
    swords: 6,           // 한 번에 떨어지는 검 수
    damage: 26,
    radius: 300,         // 주인공 둘레 이 안의 요괴를 노림
  },
};

export const REVIVE_BALANCE = {
  hpRatio: 0.5,          // 인연 부활: 최대 체력의 50%로 (인연 5단계부터 70% — 6a)
  invulnMs: 3000,        // 부활 뒤 무적
  countdownSec: 5,       // 부활 화면 카운트다운
  tapDelayMs: 400,       // 부활 버튼은 화면이 뜨고 이만큼 뒤부터 눌림
  freePerRun: 1,         // 인연 부활은 한 판에 1번 무료 (두 번째 부활 '혼등'은 5단계)
  burstRadius: 280,      // 부활 순간 동료 법술이 크게 터져 이 안의 요괴를 쓸어냄
  burstSwords: 20,
  bossBurstRatio: 0.05,  // 그때 보스는 최대 체력의 이만큼 피해
  lowHpRatio: 0.2,       // 체력이 이 아래면 화면 가장자리가 붉게 깜빡임
};

// 첫 판 각본 (기기당 한 번). 기획서 3번
export const FIRST_RUN = {
  seed: 20261127,        // 고정 시드 → 누구나 같은 흐름
  tutorialMs: 5000,      // 처음 5초 손가락 안내
  firstLevelXp: 3,       // 첫 레벨업에 필요한 영기 (요괴가 60%라 적게 → 20초 안에 첫 카드)
  holdLineCooldownMs: 8000, // '버텨라.' 다시 말하기까지
  sealAtRatio: 0.3,      // 요황 체력이 이 아래면 '봉인의 일격'
  sealDarkMs: 1000,      // 화면이 어두워지는 연출 (실제 시간)
  afterReviveBossRatio: 0.03, // 각본 부활 폭발 뒤 요황 체력 (최대 체력의 3%만 남김 → 마무리는 직접)
};
