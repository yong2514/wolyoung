import { BALANCE } from '../config/balance.js';

// 가상 조이스틱: 화면 아무 곳이나 누르면 그 자리에 나타나고, 떼면 멈춘다.
export class Joystick {
  constructor(scene) {
    const cfg = BALANCE.joystick;
    this.scene = scene;
    this.R = cfg.radius;
    this.vector = { x: 0, y: 0 };
    this.pointerId = null;
    this.base = scene.add.image(0, 0, 'joyBase').setScrollFactor(0).setDepth(200).setVisible(false);
    this.knob = scene.add.image(0, 0, 'joyKnob').setScrollFactor(0).setDepth(201).setVisible(false);

    scene.input.on('pointerdown', (p, over) => {
      if (over.length || this.pointerId !== null || !scene.canMove()) return; // 버튼 위면 무시
      this.pointerId = p.id;
      this.bx = p.x;
      this.by = p.y;
      this.base.setPosition(p.x, p.y).setVisible(true);
      this.knob.setPosition(p.x, p.y).setVisible(true);
    });
    scene.input.on('pointermove', (p) => {
      if (p.id !== this.pointerId) return;
      let dx = p.x - this.bx;
      let dy = p.y - this.by;
      const len = Math.hypot(dx, dy);
      if (len > this.R) { // 손가락이 원 밖으로 나가면 원도 따라간다
        this.bx += (dx / len) * (len - this.R);
        this.by += (dy / len) * (len - this.R);
        dx = p.x - this.bx;
        dy = p.y - this.by;
        this.base.setPosition(this.bx, this.by);
      }
      this.knob.setPosition(p.x, p.y);
      const l = Math.hypot(dx, dy);
      if (l < cfg.deadZone) { this.vector.x = 0; this.vector.y = 0; return; }
      const m = Math.min(1, l / (this.R * cfg.fullAt));
      this.vector.x = (dx / l) * m;
      this.vector.y = (dy / l) * m;
    });
    const up = (p) => { if (p.id === this.pointerId) this.reset(); };
    scene.input.on('pointerup', up);
    scene.input.on('pointerupoutside', up);
  }

  reset() {
    this.pointerId = null;
    this.vector.x = 0;
    this.vector.y = 0;
    this.base.setVisible(false);
    this.knob.setVisible(false);
  }
}
