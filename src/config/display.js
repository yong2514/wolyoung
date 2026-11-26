// 화면 크기와 색 (밸런스 수치가 아닌 보이는 모양 설정)

/** 기준 해상도 (세로) */
export const GAME_WIDTH = 390;
export const GAME_HEIGHT = 844;

/** 기기 기본 글꼴 */
export const FONT = 'system-ui, -apple-system, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';

/** 색감: 아군은 남색·은색·연보라, 요괴의 공격·예고는 붉은·주황 */
export const COLORS = {
  night: '#141a3a',      // 남색 배경
  silver: '#dfe4f2',     // 은색 글자
  lilac: '#b9a6e8',      // 연보라
  enemy: '#ff5a3c',      // 요괴 공격
  warn: '#ff9a2e',       // 요괴 예고
};

/** 버튼은 화면 아래 60% 안에 둔다: 이 y보다 아래 */
export const BUTTON_ZONE_TOP = GAME_HEIGHT * 0.4;
