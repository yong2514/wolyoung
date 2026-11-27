import { BALANCE } from '../config/balance.js';
import { GAME_WIDTH as W, GAME_HEIGHT as H, FONT } from '../config/display.js';
import { STORY } from '../data/story.js';
import { sfx } from './audio.js';

// 첫 판 각본 (기획서 3번, 기기당 한 번):
//  · 요황이 나오기 전까지 체력이 1 밑으로 안 내려감. 1이 되면 잠깐 흑백 + 서하 "버텨라."
//  · 요황 체력 30% 이하 → '봉인의 일격': 화면이 1초 어두워지고 체력 0 → 각본 부활(카운트다운 없음, 「서하의 손을 잡는다」)
//  · 부활 폭발이 요황을 거의 쓰러뜨림(3%만 남김) → 마무리는 직접 → 클리어
export class FirstRun {
  constructor(scene) {
    this.scene = scene;
    this.active = !!scene.scripted;
    this.cfg = BALANCE.firstRun;
    this.holdAt = -Infinity;
    this.sealing = false;
    this.sealStruck = false; // 봉인의 일격을 맞음 → 다음 부활은 각본 부활
    this.scriptRevived = false;
    if (this.active) this.showTutorial();
  }

  /** 체력이 1 밑으로 안 내려가는 때: 첫 장소(첫 대형 요괴까지)만 — 판이 길어져 끝까지 지켜 주면 너무 안 죽음(사용자 요청) */
  hpFloor() { return this.active && this.scene.arena.index === 0 && !this.scene.bosses.king; }

  /** 체력이 1에 닿음: 잠깐 흑백 + "버텨라." */
  onHitFloor(now) {
    const sc = this.scene;
    sc.effects.setGray(true);
    sc.time.delayedCall(350, () => { if (sc.state === 'play') sc.effects.setGray(false); });
    if (now - this.holdAt >= this.cfg.holdLineCooldownMs) {
      this.holdAt = now;
      sc.companion.say(STORY.seoha.hold);
    }
  }

  update() {
    const sc = this.scene;
    const k = sc.bosses.king;
    if (!this.active || this.sealing || this.sealStruck || !k?.alive) return;
    if (k.hp <= k.maxHp * this.cfg.sealAtRatio) this.seal();
  }

  /** 봉인의 일격: 피할 수 없는 공격 → 실수가 아니라 이야기로 */
  seal() {
    const sc = this.scene;
    this.sealing = true;
    sc.state = 'cinematic';
    sc.joystick.reset();
    const dark = sc.add.rectangle(0, 0, W, H, 0x000000, 1).setOrigin(0).setScrollFactor(0).setDepth(270).setAlpha(0);
    const t = sc.add.text(W / 2, H * 0.4, '봉인의 일격', {
      fontFamily: FONT, fontSize: '38px', fontStyle: 'bold', color: '#ff7a5a', stroke: '#000000', strokeThickness: 6,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(271).setAlpha(0).setPadding(10);
    sc.tweens.add({ targets: dark, alpha: 0.88, duration: this.cfg.sealDarkMs });
    sc.tweens.add({ targets: t, alpha: 1, duration: 300 });
    sfx.play('boom');
    sc.time.delayedCall(this.cfg.sealDarkMs, () => {
      sc.cameras.main.shake(400, 0.02);
      sc.effects.flash('ring', sc.player.x, sc.player.y, { life: 500, scale: 0.3, scaleTo: 6, tint: 0xff5a3c, depth: 272 });
      dark.destroy();
      t.destroy();
      this.sealStruck = true;
      sc.state = 'play';
      sc.player.hp = 0;
      sc.onDeath();
    });
  }

  /** 각본 부활 뒤: 폭발이 요황에게 큰 피해 (3%만 남김) */
  afterScriptRevive(now) {
    const sc = this.scene;
    this.scriptRevived = true;
    const k = sc.bosses.king;
    if (k?.alive) {
      const left = k.maxHp * this.cfg.afterReviveBossRatio;
      if (k.hp > left) sc.enemies.hit(k, k.hp - left, now);
      sc.effects.flash('ring', k.x, k.y, { life: 700, scale: 0.4, scaleTo: 4, tint: 0xe6dcff, depth: 44 });
    }
  }

  /** 처음 5초: 손가락 안내 */
  showTutorial() {
    const sc = this.scene;
    const y = H * 0.72;
    const hand = sc.add.image(W / 2 - 50, y, 'hand').setScrollFactor(0).setDepth(200).setAlpha(0.9);
    const txt = sc.add.text(W / 2, y + 50, '화면을 끌어서 움직이세요', {
      fontFamily: FONT, fontSize: '18px', fontStyle: 'bold', color: '#ffffff', stroke: '#0b0f26', strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200);
    const tw = sc.tweens.add({ targets: hand, x: W / 2 + 50, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tutorial = { hand, txt, tw };
  }

  /** 매 프레임: 5초가 지나면 안내를 지운다 */
  tick(now) {
    if (!this.tutorial || now < this.cfg.tutorialMs) return;
    const { hand, txt, tw } = this.tutorial;
    this.tutorial = null;
    tw.remove();
    this.scene.tweens.add({ targets: [hand, txt], alpha: 0, duration: 300, onComplete: () => { hand.destroy(); txt.destroy(); } });
  }
}
