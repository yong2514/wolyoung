import { GAME_WIDTH as W } from '../config/display.js';
import { BALANCE } from '../config/balance.js';
import { cardColor } from '../systems/fieldCards.js';

// 작은 지도 (오른쪽 위): 가운데 = 주인공, 떨어진 카드·보스·보물상자의 자리. 지도 밖이면 테두리에 붙여 보여 준다
export class Minimap {
  constructor(scene) {
    this.scene = scene;
    const c = BALANCE.minimap;
    this.size = c.size;
    this.range = c.range;
    this.x = W - 12 - c.size;
    this.y = c.top;
    scene.add.rectangle(this.x, this.y, c.size, c.size, 0x0b0f26, 0.6).setOrigin(0)
      .setStrokeStyle(1, 0xb9a6e8, 0.7).setScrollFactor(0).setDepth(150);
    this.g = scene.add.graphics().setScrollFactor(0).setDepth(151);
  }

  /** 월드 좌표 → 지도 위 점 (지도 밖이면 테두리에 붙임) */
  dot(wx, wy, color, r, blink) {
    const sc = this.scene;
    const p = sc.player;
    const half = this.size / 2 - 4;
    let dx = ((wx - p.x) / this.range) * half;
    let dy = ((wy - p.y) / this.range) * half;
    const m = Math.max(Math.abs(dx), Math.abs(dy));
    if (m > half) { dx = (dx / m) * half; dy = (dy / m) * half; }
    if (blink && Math.floor(sc.time.now / 250) % 2) return;
    this.g.fillStyle(color, 1);
    this.g.fillCircle(this.x + this.size / 2 + dx, this.y + this.size / 2 + dy, r);
  }

  update() {
    const sc = this.scene;
    const g = this.g;
    g.clear();
    // 화면에 보이는 범위 (네모)
    const half = this.size / 2 - 4;
    const vw = ((W / 2) / this.range) * half;
    const vh = ((sc.scale.gameSize.height / 2) / this.range) * half;
    g.lineStyle(1, 0xdfe4f2, 0.25);
    g.strokeRect(this.x + this.size / 2 - vw, this.y + this.size / 2 - vh, vw * 2, vh * 2);

    for (const c of sc.chests.pool.active) this.dot(c.x, c.y, 0xffd36a, 2, false);
    for (const b of [sc.bosses.mid, sc.bosses.king]) if (b?.alive) this.dot(b.x, b.y, 0xff5a3c, 4, false);
    for (const o of sc.fieldCards.list) {
      if (o.card) this.dot(o.x, o.y, cardColor(o.card), 3.5, o.card.rarity === 'legend' || o.card.kind === 'fusion');
    }
    // 주인공
    g.fillStyle(0xffffff, 1);
    g.fillCircle(this.x + this.size / 2, this.y + this.size / 2, 3);
  }
}
