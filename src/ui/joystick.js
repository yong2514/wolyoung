import { BALANCE } from '../config/balance.js';

// 손가락 따라 움직이기 (사용자 요청: 주인공 움직임 = 손가락 움직임 속도와 똑같이)
//  화면 아무 곳이나 누르고 끌면, 손가락이 움직인 거리만큼 주인공이 그대로 움직인다. 떼면 멈춘다.
//  (예전 조이스틱 방식 대신. 이름은 그대로 Joystick)
export class Joystick {
  constructor(scene) {
    this.scene = scene;
    this.cfg = BALANCE.drag;
    this.pending = { x: 0, y: 0 }; // 아직 주인공에 옮기지 않은 손가락 이동량
    this.pointerId = null;
    this.dot = scene.add.image(0, 0, 'joyKnob').setScrollFactor(0).setDepth(200).setScale(0.45).setAlpha(0.5).setVisible(false);

    scene.input.on('pointerdown', (p, over) => {
      if (over.length || this.pointerId !== null || !scene.canMove()) return; // 버튼 위면 무시
      this.pointerId = p.id;
      this.lx = p.x;
      this.ly = p.y;
      this.dot.setPosition(p.x, p.y).setVisible(true);
    });
    scene.input.on('pointermove', (p) => {
      if (p.id !== this.pointerId) return;
      if (scene.canMove()) {
        this.pending.x += (p.x - this.lx) * this.cfg.ratio;
        this.pending.y += (p.y - this.ly) * this.cfg.ratio;
      }
      this.lx = p.x;
      this.ly = p.y;
      this.dot.setPosition(p.x, p.y);
    });
    const up = (p) => { if (p.id === this.pointerId) this.reset(); };
    scene.input.on('pointerup', up);
    scene.input.on('pointerupoutside', up);
  }

  /** 이번 걸음에 옮길 만큼 꺼내기 (한 걸음에 maxStep까지 → 장애물을 뚫고 지나가지 않게, 나머지는 다음 걸음) */
  take() {
    const p = this.pending;
    const d = Math.hypot(p.x, p.y);
    if (d < 0.01) return { x: 0, y: 0, direct: true };
    const k = Math.min(1, this.cfg.maxStep / d);
    const out = { x: p.x * k, y: p.y * k, direct: true };
    p.x -= out.x;
    p.y -= out.y;
    return out;
  }

  reset() {
    this.pointerId = null;
    this.pending.x = 0;
    this.pending.y = 0;
    this.dot.setVisible(false);
  }
}
