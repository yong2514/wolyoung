import { GAME_WIDTH as W, GAME_HEIGHT as H } from '../config/display.js';
import { BALANCE } from '../config/balance.js';
import { cardColor } from '../systems/fieldCards.js';

// 작은 지도 (오른쪽 위): 지금 장소 전체. 주인공(흰 점)·떨어진 카드·보스·보물상자·화면에 보이는 범위(네모)
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

  /** 월드 좌표 → 지도 위 */
  mx(wx) { return this.x + (wx - this.scene.arena.x0) * this.k; }

  my(wy) { return this.y + (wy - this.scene.arena.y0) * this.k; }

  dot(wx, wy, color, r) {
    this.g.fillStyle(color, 1);
    this.g.fillCircle(this.mx(wx), this.my(wy), r);
  }

  update() {
    const sc = this.scene;
    const g = this.g;
    g.clear();
    this.bg.setStrokeStyle(1, sc.arena.place.wall, 0.9); // 장소 벽 색
    // 화면에 보이는 범위
    const cam = sc.cameras.main;
    g.lineStyle(1, 0xdfe4f2, 0.3);
    g.strokeRect(this.mx(cam.scrollX), this.my(cam.scrollY), W * this.k, H * this.k);

    const blink = Math.floor(sc.time.now / 250) % 2;
    for (const c of sc.chests.pool.active) this.dot(c.x, c.y, 0xffd36a, 2);
    for (const b of [sc.bosses.mid, sc.bosses.king]) if (b?.alive) this.dot(b.x, b.y, 0xff5a3c, 4);
    for (const o of sc.fieldCards.list) {
      if (!o.card) continue;
      const gold = o.card.rarity === 'legend' || o.card.kind === 'fusion';
      if (gold && blink) continue;
      this.dot(o.x, o.y, cardColor(o.card), 3);
    }
    this.dot(sc.player.x, sc.player.y, 0xffffff, 3); // 주인공
  }
}
