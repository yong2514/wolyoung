// 이미지·소리 경로를 한곳에 모은다.
// 지금은 그림 대신 도형(src/scenes/BootScene.js에서 만듦), 소리 대신 합성음(src/systems/audio.js)을 쓴다.
// 그림으로 바꿀 때: IMAGES에 '이름: 경로'를 넣으면 BootScene이 도형 대신 그 파일을 읽게 바꾼다.

export const IMAGES = {
  player: null,   // 월영
  jabgwi: null,   // 잡귀
  sword: null,    // 비검
};

/** 효과음 목록. null이면 합성음을 쓴다. */
export const SOUNDS = {
  shoot: null,    // 비검 발사
  hit: null,      // 요괴 맞음
  kill: null,     // 요괴 처치
  hurt: null,     // 플레이어 맞음
  gameover: null, // 쓰러짐
};
