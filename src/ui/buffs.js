import { FONT } from '../config/display.js';
import { BALANCE } from '../config/balance.js';
import { SPELLS } from '../data/spells.js';

const ROWS = 9;     // 최대 줄 수
const BAR_W = 46;   // 남은 시간 막대 길이

// 가진 법술과 남은 효과 시간 (왼쪽 위, 경지 아래). 카드 효과는 일정 시간만 가므로 언제 끝나는지 보여 준다.
//   "뇌부 3 ▮▮▮▯" — 막대 = 가장 빨리 끝나는 효과까지 남은 시간. 늘 있는 법술(시작 비검)은 막대 없음
export class BuffList {
  constructor(scene) {
    this.scene = scene;
    this.rows = [];
    for (let i = 0; i < ROWS; i++) {
      const y = 76 + i * 17;
      const text = scene.add.text(16, y, '', {
        fontFamily: FONT, fontSize: '12px', color: '#dfe4f2', stroke: '#0b0f26', strokeThickness: 3,
      }).setScrollFactor(0).setDepth(150);
      const bg = scene.add.rectangle(92, y + 8, BAR_W, 4, 0x0b0f26, 0.8).setOrigin(0, 0.5).setScrollFactor(0).setDepth(150);
      const bar = scene.add.rectangle(92, y + 8, BAR_W, 4, 0xb9a6e8, 1).setOrigin(0, 0.5).setScrollFactor(0).setDepth(151);
      this.rows.push({ text, bg, bar, label: '' });
    }
  }

  update() {
    const sc = this.scene;
    const book = sc.book;
    const now = sc.clock.now;
    const full = BALANCE.fieldCards.effectSec * 1000;
    const veil = sc.player.veiled(now); // 은형부·서하는 맨 위 줄
    const seoha = sc.companion.active;
    const keys = (seoha ? ['seoha'] : []).concat(veil ? ['veil'] : [], book.order).slice(0, ROWS);
    this.rows.forEach((r, i) => {
      const key = keys[i];
      const on = !!key;
      r.text.setVisible(on);
      if (!on) { r.bg.setVisible(false); r.bar.setVisible(false); return; }
      if (key === 'seoha') {
        if (r.label !== '서하') { r.label = '서하'; r.text.setText('서하'); }
        r.bg.setVisible(true);
        r.bar.setVisible(true);
        r.bar.width = BAR_W * Math.min(1, sc.companion.timeLeft(now) / BALANCE.companion.summon.durationMs);
        r.bar.fillColor = 0xe6ecff;
        return;
      }
      if (key === 'veil') {
        if (r.label !== '은형') { r.label = '은형'; r.text.setText('은형부'); }
        r.bg.setVisible(true);
        r.bar.setVisible(true);
        r.bar.width = BAR_W * Math.max(0, (sc.player.veilUntil - now) / BALANCE.veil.durationMs);
        r.bar.fillColor = 0xd9ccff;
        return;
      }
      const label = `${SPELLS[key].name} ${book.level(key)}`;
      if (r.label !== label) { r.label = label; r.text.setText(label); }
      const left = book.timeLeft(key, now);
      const timed = Number.isFinite(left);
      r.bg.setVisible(timed);
      r.bar.setVisible(timed);
      if (timed) {
        const k = Math.max(0, Math.min(1, left / full));
        r.bar.width = BAR_W * k;
        r.bar.fillColor = left < 8000 ? 0xff9a6a : SPELLS[key].kind === 'support' ? 0x8fe0d0 : 0xb9a6e8; // 곧 끝나면 주황
      }
    });
  }
}
