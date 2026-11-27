import { GAME_WIDTH as W, FONT } from '../config/display.js';
import { BALANCE } from '../config/balance.js';
import { cardColor, SEOHA } from '../systems/fieldCards.js';

const SEOHA_LABELS = 4; // 지도에 '서하' 글자를 붙일 수 있는 수

// 작은 지도 (오른쪽 위): 지금 장소 전체에서 주인공(흰 점)과 떨어진 카드(색 점)만 보여 준다 (사용자 요청)
// 서하 카드는 은빛 네모 + '서하' 글자로 따로 표시 (사용자 요청)
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
    this.labels = [];
    for (let i = 0; i < SEOHA_LABELS; i++) {
      this.labels.push(scene.add.text(0, 0, '서하', {
        fontFamily: FONT, fontSize: '9px', fontStyle: 'bold', color: '#e6ecff', stroke: '#0b0f26', strokeThickness: 2,
      }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(152).setVisible(false));
    }
  }

  mx(wx) { return this.x + (wx - this.scene.arena.x0) * this.k; }

  my(wy) { return this.y + (wy - this.scene.arena.y0) * this.k; }

  update() {
    const sc = this.scene;
    const g = this.g;
    g.clear();
    this.bg.setStrokeStyle(1, sc.arena.place.wall, 0.9); // 장소 벽 색
    const blink = Math.floor(sc.time.now / 250) % 2;
    let li = 0;
    for (const o of sc.fieldCards.list) {
      if (!o.card) continue;
      const x = this.mx(o.x);
      const y = this.my(o.y);
      if (o.card.key === 'seoha') { // 서하 카드: 은빛 네모 + 글자
        g.fillStyle(SEOHA, 1);
        g.fillRect(x - 3, y - 3, 6, 6);
        g.lineStyle(1, 0x26306a, 1);
        g.strokeRect(x - 3, y - 3, 6, 6);
        if (li < this.labels.length) this.labels[li++].setPosition(x, y - 4).setVisible(true);
        continue;
      }
      const gold = o.card.rarity === 'legend' || o.card.kind === 'fusion';
      if (gold && blink) continue;
      g.fillStyle(cardColor(o.card), 1);
      g.fillCircle(x, y, 3);
    }
    for (; li < this.labels.length; li++) this.labels[li].setVisible(false);
    g.fillStyle(0xffffff, 1); // 주인공
    g.fillCircle(this.mx(sc.player.x), this.my(sc.player.y), 3.5);
  }
}
