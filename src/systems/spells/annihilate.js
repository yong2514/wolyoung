import { sfx } from '../audio.js';
import { SkillButton } from '../../ui/skillButton.js';
import { startTargeting } from '../../ui/targeting.js';
import { AttackSpell } from './base.js';

// 멸요인: 버튼 → 원 옮기기 → 발동 → 원 안 요괴를 모두 없앤다. 쓰고 나면 cooldownMs 뒤에 다시.
export class Annihilate extends AttackSpell {
  constructor(scene, book) {
    super(scene, book, 'annihilate');
    this.nextAt = 0; // 얻자마자 쓸 수 있다
    this.button = new SkillButton(scene, '멸', () => this.press());
  }

  press() {
    const sc = this.scene;
    if (sc.state !== 'play' || !this.ready(sc.clock.now)) return;
    startTargeting(sc, this.stat('radius'), (x, y) => this.fire(x, y));
  }

  update(dt, now) {
    const left = Math.max(0, this.nextAt - now);
    this.button.update(left / this.cooldown());
    // 자동 플레이: 쓸 수 있으면 바로 내 자리에
    if (this.scene.auto && left <= 0) this.fire(this.scene.player.x, this.scene.player.y);
  }

  /** (x,y) 둘레 radius 안의 요괴를 모두 없앤다 */
  fire(x, y) {
    const sc = this.scene;
    const r = this.stat('radius');
    const list = sc.enemies.pool.active;
    let n = 0;
    for (let i = list.length - 1; i >= 0; i--) {
      const e = list[i];
      if (!e.alive) continue;
      const dx = e.x - x;
      const dy = e.y - y;
      const rr = r + e.radius;
      if (dx * dx + dy * dy <= rr * rr) { sc.enemies.kill(e); n++; }
    }
    const fx = sc.effects;
    fx.flash('ring', x, y, { life: 500, scale: (r / 32) * 0.3, scaleTo: (r / 32) * 1.15, tint: 0xe6dcff, depth: 40 });
    fx.flash('ring', x, y, { life: 350, scale: r / 32, scaleTo: (r / 32) * 0.2, tint: 0xffffff, alpha: 0.8, depth: 40 });
    fx.burst(x, y, 0xe6dcff, 16);
    fx.shake('hurt');
    fx.vibrate(60);
    sfx.play('annihilate');
    this.nextAt = sc.clock.now + this.cooldown();
    return n;
  }

  destroy() { this.button.destroy(); }
}
