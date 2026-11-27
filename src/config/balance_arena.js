// 장소·장애물·점프·은형부 밸런스 (balance.js에서 불러 쓴다). 시간 ms, 거리 픽셀
// 사용자 요청: 장소마다 1분 → 그 장소의 대형 요괴 → 쓰러뜨리면 다음 장소 (주인공·요괴 모두 강해짐).
//             장식은 장애물(지나갈 수 없음), 점프로 넘는다. 은형부 카드: 잠깐 투명해져 부딪쳐도 괜찮음

export const ARENA_BALANCE = {
  width: 1400,          // 장소 너비 (화면 390의 약 3.6배)
  height: 1900,         // 장소 높이 (화면 844의 약 2.3배)
  spawnInset: 30,       // 요괴는 벽에서 이만큼 안쪽, 화면 밖에서 나온다
  fadeMs: 400,          // 장소를 옮길 때 어두워지는·밝아지는 시간 (실제 시간)
  placeSec: 60,         // 장소마다 싸우는 시간. 끝나면 그 장소의 대형 요괴가 나온다
  travelDelayMs: 2200,  // 대형 요괴를 쓰러뜨리고 다음 장소로 가기까지 (게임 시간, 보물상자 줍기)
  decor: 30,            // 장소마다 놓이는 장애물 수
  startClear: 170,      // 장소 가운데(시작 자리) 이 거리 안에는 장애물을 두지 않음

  // 장소마다 강해짐 (장소 번호 0,1,2,3마다 곱함·더함)
  power: {
    playerDamage: 0.25, // 주인공 공격력 +25%씩
    playerHp: 20,       // 최대 체력 +20씩 (늘어난 만큼 회복)
    enemyHp: 0.4,       // 요괴 체력 +40%씩 (보스 포함)
    enemyDamage: 0.15,  // 요괴 공격력 +15%씩
  },

  // bg 바닥 색, wall 벽 색, decor 장애물 종류, light 장애물에 비치는 빛 색, boss 그 장소의 대형 요괴
  places: [
    { name: '달빛 숲', bg: 0x2a3462, wall: 0xb9a6e8, decor: ['decorRock', 'decorStump', 'decorGrass'], light: 0xb0b8d8, boss: 'yojang' },
    { name: '연꽃 호수', bg: 0x1e3c68, wall: 0x8fd0ff, decor: ['decorPuddle', 'decorRock', 'decorGrass'], light: 0xa8bce0, boss: 'yojang' },
    { name: '부서진 사당', bg: 0x3a3448, wall: 0xd9ccff, decor: ['decorPillar', 'decorCrack', 'decorRock'], light: 0xc8beb4, boss: 'yojang' },
    { name: '봉인의 제단', bg: 0x44284e, wall: 0xffd36a, decor: ['decorPillar', 'decorCrack'], light: 0xd0b4c4, boss: 'yohwang' },
  ],

  // 장애물 부딪힘 반지름 (그림 크기에 맞춤, scale을 곱함)
  obstacleRadius: { decorRock: 22, decorStump: 17, decorPuddle: 28, decorCrack: 22, decorPillar: 16, decorGrass: 11 },
};

export const JUMP_BALANCE = {
  durationMs: 550,      // 공중에 있는 시간 (장애물·요괴를 넘고, 요괴와 부딪혀도 안 다침)
  distance: 110,        // 점프하면 가던 방향으로 이만큼 앞으로 날아감 (요괴 무리를 뛰어넘기, 사용자 요청)
  landingSafeMs: 200,   // 착지 직후 이만큼은 몸 부딪힘에 안 다침
  cooldownMs: 1200,     // 다시 뛰기까지
  height: 30,           // 뛰어오르는 높이 (그림)
  hintRange: 70,        // 장애물이 이 거리 안이면 점프 버튼이 반짝임
};

export const VEIL_BALANCE = {
  durationMs: 12000,    // 은형부: 투명해지는 시간
  chance: 0.15,         // 카드 무리마다 은형부가 1장 섞일 확률
  alpha: 0.35,          // 투명할 때 주인공 그림 투명도
};
