// 게임 안 시계: 웨이브·쿨타임·무적 시간은 모두 이 시계로 잰다 (Date.now 금지).
// 일시정지·카드 선택 중에는 멈추고, 느려지기 연출 중에는 scale만큼 느리게 간다.
// 게임은 늘 STEP(1/60초)씩 같은 크기로 진행한다 → 기기 속도가 달라도 같은 시드면 같은 흐름.

export const STEP = 1000 / 60;

export class GameClock {
  constructor() {
    this.now = 0;        // 판이 시작된 뒤 흐른 게임 시간 (ms)
    this.scale = 1;      // 느려지기 연출: 0.3이면 30% 속도
    this.paused = false;
    this.pending = 0;    // 아직 진행하지 않은 시간
    this.maxFeed = 100;  // 한 프레임에 최대 100ms까지만 (탭 전환 뒤 순간이동 방지)
  }

  /** 실제 지난 시간(ms)을 넣는다. speed는 자동 점검 배속 */
  feed(realDelta, speed = 1) {
    if (this.paused) return;
    this.pending += Math.min(realDelta, this.maxFeed) * this.scale * speed;
  }

  /** 한 걸음 진행할 만큼 쌓였으면 진행하고 true */
  take() {
    if (this.paused || this.pending < STEP) return false;
    this.pending -= STEP;
    this.now += STEP;
    return true;
  }
}
