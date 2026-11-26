import { BALANCE } from '../config/balance.js';
import { GAME_WIDTH as W, GAME_HEIGHT as H, FONT } from '../config/display.js';
import { sfx } from './audio.js';

// 경지: 연기 → 축기 → 금단 → 원영 → 화신. 레벨이 닿으면 돌파 연출 (게임에서 가장 기분 좋은 순간)
//   1.5초 느려짐 · 하늘에서 빛기둥 · 주변 요괴가 날아감 · 큰 글씨 · 무적 · 체력 30% 회복 · 공격력 상승 · 기운 색 바뀜
export class Realm {
  constructor(scene) {
    this.scene = scene;
    this.cfg = BALANCE.realms;
    this.index = 0;
    this.breaking = false; // 돌파 연출 중 (무적, 카드는 연출 뒤에)
    this.times = [0];      // 경지마다 도달한 게임 시간 (ms)
  }

  get name() { return this.cfg.list[this.index].name; }

  get next() { return this.cfg.list[this.index + 1]; }

  /** 다음 돌파가 가까운가 (돌파 한 레벨 전, 영기 막대가 nearRatio 이상) */
  near() {
    const n = this.next;
    const lv = this.scene.leveling;
    return !!n && !this.breaking && lv.level === n.level - 1 && lv.ratio >= this.cfg.nearRatio;
  }

  /** 매 걸음: 돌파할 레벨이면 시작, 연출 시간이 끝나면 원래 속도로 */
  check() {
    const now = this.scene.clock.now;
    if (this.breaking && now >= this.breakEnd) {
      this.breaking = false;
      this.scene.clock.scale = 1;
    }
    const n = this.next;
    if (!this.breaking && n && this.scene.leveling.level >= n.level) this.breakthrough();
  }

  breakthrough() {
    const sc = this.scene;
    const c = this.cfg;
    this.index++;
    this.times.push(sc.clock.now);
    this.breaking = true;
    const realm = this.cfg.list[this.index];
    const p = sc.player;

    // 보상
    p.heal(p.maxHp * c.healRatio);
    sc.book.damageMult *= 1 + c.damageBonus;
    p.aura.setTint(realm.color);
    p.auraScale = 1 + this.index * 0.12; // 경지가 오를수록 기운이 커진다

    // 느려짐: 게임 시계를 slowScale로. 끝나는 때도 게임 시간으로 잰다 (같은 시드 = 같은 판)
    sc.clock.scale = c.slowScale;
    this.breakEnd = sc.clock.now + c.slowMs * c.slowScale;

    // 빛기둥 + 충격파 + 요괴 날리기
    const cam = sc.cameras.main;
    const pillar = sc.add.image(p.x, cam.scrollY - 20, 'pillar').setOrigin(0.5, 0).setDepth(45)
      .setTint(realm.color).setScale(0.2, (p.y - cam.scrollY + 40) / 256).setAlpha(0);
    sc.tweens.add({ targets: pillar, alpha: 1, scaleX: 1.4, duration: 220, ease: 'Cubic.easeOut' });
    sc.tweens.add({ targets: pillar, alpha: 0, scaleX: 2.4, delay: 650, duration: 750, onComplete: () => pillar.destroy() });
    sc.enemies.blast(p.x, p.y, c.blastRadius, c.blastPush, c.blastDamage * sc.book.damageMult, sc.clock.now);
    const fx = sc.effects;
    fx.flash('ring', p.x, p.y, { life: 900, scale: 0.3, scaleTo: c.blastRadius / 32, tint: realm.color, depth: 44 });
    fx.flash('ring', p.x, p.y, { life: 600, scale: 0.2, scaleTo: (c.blastRadius / 32) * 0.6, tint: 0xffffff, depth: 44 });
    fx.burst(p.x, p.y, realm.color, 30);
    cam.flash(250, 255, 255, 255);
    fx.shake('hurt');
    fx.vibrate(120);
    sfx.play('breakthrough');

    // 화면 가운데 큰 글씨
    const t = sc.add.text(W / 2, H * 0.36, `${realm.name} 돌파!`, {
      fontFamily: FONT, fontSize: '56px', fontStyle: 'bold', color: '#ffffff', stroke: '#141a3a', strokeThickness: 8,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(260).setScale(2.2).setAlpha(0).setPadding(30);
    t.setShadow(0, 0, `#${realm.color.toString(16).padStart(6, '0')}`, 24, true, true);
    sc.tweens.add({ targets: t, scale: 1, alpha: 1, duration: 260, ease: 'Back.easeOut' });
    sc.tweens.add({ targets: t, alpha: 0, y: H * 0.32, delay: 1300, duration: 500, onComplete: () => t.destroy() });
    const sub = sc.add.text(W / 2, H * 0.36 + 52, `체력 회복 · 공격력 +${Math.round(c.damageBonus * 100)}%`, {
      fontFamily: FONT, fontSize: '18px', fontStyle: 'bold', color: '#dfe4f2', stroke: '#141a3a', strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(260).setAlpha(0);
    sc.tweens.add({ targets: sub, alpha: 1, delay: 250, duration: 250 });
    sc.tweens.add({ targets: sub, alpha: 0, delay: 1400, duration: 400, onComplete: () => sub.destroy() });
  }
}
