import { GAME_WIDTH as W, FONT, BUTTON_ZONE_TOP } from '../config/display.js';
import { BALANCE } from '../config/balance.js';
import { settings } from '../systems/settings.js';
import { tappable } from './tappable.js';

const R = 32; // 버튼 반지름 (지름 64 > 48)

// 점프 버튼 (왼쪽, 왼손 모드면 오른쪽): 장애물을 넘는다. 장애물이 가까우면 반짝이고, 다시 뛰기까지는 흐리게
export class JumpButton {
  constructor(scene) {
    this.scene = scene;
    const x = settings.leftHand ? W - 42 : 42;
    const y = BUTTON_ZONE_TOP + 120;
    this.bg = scene.add.circle(x, y, R, 0x23405a, 0.9).setStrokeStyle(3, 0x8fd0ff, 1).setScrollFactor(0).setDepth(150);
    this.text = scene.add.text(x, y, '점프', { fontFamily: FONT, fontSize: '17px', fontStyle: 'bold', color: '#ffffff' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(152);
    tappable(this.bg, () => scene.state === 'play', () => scene.player.jump(scene.clock.now));
  }

  update() {
    const sc = this.scene;
    const p = sc.player;
    const now = sc.clock.now;
    const ready = now >= p.jumpReadyAt;
    const near = ready && sc.arena.obstacleNear(p.x, p.y, BALANCE.jump.hintRange);
    this.bg.setAlpha(ready ? 1 : 0.45);
    this.text.setAlpha(ready ? 1 : 0.5);
    this.bg.setScale(near ? 1 + 0.08 * Math.sin(sc.time.now / 90) : 1); // 장애물 가까이: 반짝
    this.bg.setStrokeStyle(3, near ? 0xffffff : 0x8fd0ff, 1);
  }
}
