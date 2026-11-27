// 이미지·소리 경로를 한곳에 모은다.
// 지금은 그림 대신 도형(src/scenes/BootScene.js에서 만듦), 소리 대신 합성음(src/systems/audio.js)을 쓴다.
// 그림으로 바꿀 때: IMAGES에 '이름: 경로'를 넣으면 BootScene이 도형 대신 그 파일을 읽게 바꾼다.

export const IMAGES = {
  player: null,   // 월영
  jabgwi: null,   // 잡귀 (요괴 1단계)
  yagwi: null,    // 야귀 (2단계)
  hyunggwi: null, // 흉귀 (3단계)
  akgwi: null,    // 악귀 (4단계)
  hyeolgwi: null, // 혈귀 (5단계)
  sword: null,    // 비검
  orb: null,      // 영기 구슬
  bolt: null,     // 뇌부 낙뢰
  ring: null,     // 둥근 빛 고리
  lotus: null,    // 연화진 장판
  guardOrb: null, // 호신강기 구슬
  fan: null,      // 청염 부채꼴
  talisman: null, // 부적진 부적
  moonRing: null, // 월륜
  charger: null, ranged: null, splitter: null, splitling: null, shield: null, bomber: null, // 특수 요괴
  warnLine: null, ebullet: null, eliteGlow: null, // 예고선·요괴 탄·정예 테두리
  chest: null,    // 보물상자
  pillar: null,   // 경지 돌파 빛기둥
  fieldCard: null, // 바닥에 떨어진 카드
  decorRock: null, decorLotus: null, decorGrass: null, // 장소 장식
};

/** 효과음 목록. null이면 합성음을 쓴다. */
export const SOUNDS = {
  shoot: null,    // 비검 발사
  hit: null,      // 요괴 맞음
  kill: null,     // 요괴 처치
  hurt: null,     // 플레이어 맞음
  gameover: null, // 쓰러짐
  pickup: null,   // 영기 구슬 먹음
  levelup: null,  // 레벨 업
  pick: null,     // 카드 고름
  thunder: null,  // 뇌부 낙뢰
  lotus: null,    // 연화진 펼침
  annihilate: null, // 멸요인 발동 (월하봉마진도)
  frost: null,    // 빙결
  flame: null,    // 청염
  boom: null,     // 부적 폭발·폭귀 폭발
  breakthrough: null, // 경지 돌파
  travel: null,   // 다음 장소로
};
