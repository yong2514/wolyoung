import { GAME_WIDTH as W, FONT, BUTTON_ZONE_TOP } from '../config/display.js';
import { settings } from '../systems/settings.js';

const R = 32; // 버튼 반지름 (지름 64 > 48)

// 오른쪽(왼손 모드면 왼쪽) 둥근 기술 버튼. 기다리는 동안 어두운 부채꼴로 남은 시간을 보여준다.
// 버튼 위에서 눌렀다 뗀 경우에만 눌림 (조이스틱 손가락이 지나가다 떼도 안 눌림)
export class SkillButton {
  /** opts.side: 'right'(기본) · 'left' (왼손 모드면 반대), opts.dy: 아래로 얼마나, opts.fontSize */
  constructor(scene, label, onPress, opts = {}) {
    this.scene = scene;
    const right = (opts.side ?? 'right') === 'right';
    this.x = right !== settings.leftHand ? W - 42 : 42;
    this.y = BUTTON_ZONE_TOP + (opts.dy ?? 120);
    const fix = (o) => o.setScrollFactor(0).setDepth(150);
    this.bg = fix(scene.add.circle(this.x, this.y, R, opts.fill ?? 0x3a2d6e, 0.9).setStrokeStyle(3, 0xd9ccff, 1).setInteractive());
    this.cd = fix(scene.add.graphics()).setDepth(151);
    this.text = fix(scene.add.text(this.x, this.y, label, {
      fontFamily: FONT, fontSize: opts.fontSize ?? '26px', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5)).setDepth(152);
    this.wasReady = false;
    let pressed = false;
    this.bg.on('pointerdown', () => { pressed = true; });
    this.bg.on('pointerout', () => { pressed = false; });
    this.bg.on('pointerup', () => { if (pressed) { pressed = false; onPress(); } });
  }

  /** left: 남은 시간 비율 (0이면 쓸 수 있음) */
  update(left) {
    const g = this.cd;
    g.clear();
    const ready = left <= 0;
    if (!ready) {
      g.fillStyle(0x0b0f26, 0.75);
      g.slice(this.x, this.y, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * left, false);
      g.fillPath();
    }
    this.text.setAlpha(ready ? 1 : 0.5);
    if (ready && !this.wasReady) { // 다시 쓸 수 있게 되면 반짝
      this.scene.tweens.add({ targets: [this.bg, this.text], scale: 1.25, duration: 120, yoyo: true });
    }
    this.wasReady = ready;
  }

  destroy() {
    this.bg.destroy();
    this.cd.destroy();
    this.text.destroy();
  }
}
