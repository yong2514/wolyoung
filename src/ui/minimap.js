import { GAME_WIDTH as W } from '../config/display.js';
import { BALANCE } from '../config/balance.js';
import { cardColor } from '../systems/fieldCards.js';

// 작은 지도 (오른쪽 위): 지금 장소 전체에서 주인공(흰 점)과 떨어진 카드(색 점)만 보여 준다 (사용자 요청)
export class Minimap {
  constructor(scene) {
    this.scene = scene;
    const a = BALANCE.arena;
    this.h = BALANCE.minimap.height;
    this.w = Math.round((this.h * a.width) / a.height);
    this.k = this.h / a.height; // 월드 1픽셀 → 지도
    this.x = W - 12 - this.w;
    this.y = BALANCE.minimap.top;
    this.bg = scene.add.rectangle(this.x, this.y, this.w, this.h, 0x0b0f26, 0.6).setOrigin(0)
      .setStrokeStyle(1, 0xb9a6e8, 0.8).setScrollFactor(0).setDepth(150);
    this.g = scene.add.graphics().setScrollFactor(0).setDepth(151);
  }

  dot(wx, wy, color, r) {
    const a = this.scene.arena;
    this.g.fillStyle(color, 1);
    this.g.fillCircle(this.x + (wx - a.x0) * this.k, this.y + (wy - a.y0) * this.k, r);
  }

  update() {
    const sc = this.scene;
    this.g.clear();
    this.bg.setStrokeStyle(1, sc.arena.place.wall, 0.9); // 장소 벽 색
    const blink = Math.floor(sc.time.now / 250) % 2;
    for (const o of sc.fieldCards.list) {
      if (!o.card) continue;
      const gold = o.card.rarity === 'legend' || o.card.kind === 'fusion';
      if (gold && blink) continue;
      this.dot(o.x, o.y, cardColor(o.card), 3);
    }
    this.dot(sc.player.x, sc.player.y, 0xffffff, 3.5); // 주인공
  }
}
