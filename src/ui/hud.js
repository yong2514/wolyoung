import { GAME_WIDTH as W, GAME_HEIGHT as H, FONT, BUTTON_ZONE_TOP } from '../config/display.js';
import { BALANCE } from '../config/balance.js';
import { settings } from '../systems/settings.js';
import { formatTime } from './overlays.js';

const BAR_W = 116;  // 체력 막대 길이
const WAVE_W = 120; // 웨이브 진행 막대 길이
const BOSS_W = 116; // 요황 체력 막대 길이 (체력 막대와 겹치지 않게)

// 상단 표시: 영기 막대(맨 위) · 체력 · 남은 시간 · 웨이브 진행 · 경지 · 처치 · 레벨, 웨이브 알림, 일시정지 버튼
export class Hud {
  constructor(scene) {
    this.scene = scene;
    const fix = (o) => o.setScrollFactor(0).setDepth(150);
    fix(scene.add.rectangle(16, 18, BAR_W + 4, 12, 0x0b0f26, 0.8).setOrigin(0).setStrokeStyle(1, 0xdfe4f2, 0.5));
    this.hpBar = fix(scene.add.rectangle(18, 20, BAR_W, 8, 0x8fd0ff, 1).setOrigin(0));
    this.hpText = fix(scene.add.text(16, 34, '', { fontFamily: FONT, fontSize: '13px', color: '#dfe4f2' }));
    this.realmText = fix(scene.add.text(16, 52, '', { fontFamily: FONT, fontSize: '15px', fontStyle: 'bold', color: '#b9a6e8' }));

    // 가운데: 남은 시간 + 웨이브 진행 막대 (7칸)
    this.timeText = fix(scene.add.text(W / 2, 12, '', { fontFamily: FONT, fontSize: '24px', fontStyle: 'bold', color: '#dfe4f2' })
      .setOrigin(0.5, 0));
    const n = BALANCE.waves.list.length;
    const x0 = W / 2 - WAVE_W / 2;
    this.waveCells = [];
    for (let i = 0; i < n; i++) {
      const cw = WAVE_W / n;
      fix(scene.add.rectangle(x0 + i * cw + 1, 44, cw - 2, 6, 0x0b0f26, 0.9).setOrigin(0));
      this.waveCells.push(fix(scene.add.rectangle(x0 + i * cw + 1, 44, 0, 6, 0xb9a6e8, 1).setOrigin(0)));
    }
    this.waveText = fix(scene.add.text(W / 2, 52, '', { fontFamily: FONT, fontSize: '12px', color: '#b9a6e8' }).setOrigin(0.5, 0));
    // 요황이 나오면 남은 시간 자리가 보스 체력 막대로 바뀐다
    this.bossBg = fix(scene.add.rectangle(W / 2, 26, BOSS_W + 4, 18, 0x0b0f26, 0.9).setStrokeStyle(1, 0xff9a6a, 0.8)).setVisible(false);
    this.bossFill = fix(scene.add.rectangle(W / 2 - BOSS_W / 2, 26, BOSS_W, 14, 0xd94a3a, 1).setOrigin(0, 0.5)).setVisible(false);
    this.bossName = fix(scene.add.text(W / 2, 26, '요황', {
      fontFamily: FONT, fontSize: '13px', fontStyle: 'bold', color: '#ffffff', stroke: '#0b0f26', strokeThickness: 3,
    }).setOrigin(0.5)).setVisible(false);

    this.killText = fix(scene.add.text(W - 16, 18, '', { fontFamily: FONT, fontSize: '15px', color: '#b9a6e8' }).setOrigin(1, 0));
    this.levelText = fix(scene.add.text(W - 16, 38, '', { fontFamily: FONT, fontSize: '15px', fontStyle: 'bold', color: '#bff0ff' })
      .setOrigin(1, 0));
    // 영기 막대: 화면 맨 위 가로줄. 돌파가 가까우면 금빛으로 빛남
    fix(scene.add.rectangle(0, 0, W, 5, 0x0b0f26, 0.9).setOrigin(0));
    this.xpBar = fix(scene.add.rectangle(0, 0, 0, 5, 0x7fd8ff, 1).setOrigin(0));
    this.nearText = fix(scene.add.text(W / 2, 74, '돌파 임박', {
      fontFamily: FONT, fontSize: '16px', fontStyle: 'bold', color: '#ffe7a8', stroke: '#0b0f26', strokeThickness: 4,
    }).setOrigin(0.5, 0).setVisible(false));

    // 웨이브 알림 (화면 위쪽 가운데, 잠깐)
    this.bannerTitle = fix(scene.add.text(W / 2, H * 0.16, '', {
      fontFamily: FONT, fontSize: '30px', fontStyle: 'bold', color: '#dfe4f2', stroke: '#0b0f26', strokeThickness: 6,
    }).setOrigin(0.5).setAlpha(0));
    this.bannerSub = fix(scene.add.text(W / 2, H * 0.16 + 34, '', {
      fontFamily: FONT, fontSize: '17px', color: '#b9a6e8', stroke: '#0b0f26', strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0));

    // 일시정지 버튼: 버튼은 화면 아래 60% 안 (오른쪽 가장자리, 왼손 모드면 왼쪽)
    const px = settings.leftHand ? 30 : W - 30;
    const py = BUTTON_ZONE_TOP + 30;
    this.pauseBtn = scene.add.circle(px, py, 24, 0x0b0f26, 0.55).setStrokeStyle(2, 0xdfe4f2, 0.6)
      .setScrollFactor(0).setDepth(150).setInteractive();
    fix(scene.add.text(px, py, 'Ⅱ', { fontFamily: FONT, fontSize: '20px', color: '#dfe4f2' }).setOrigin(0.5));
    let pressed = false; // 버튼 위에서 눌렀다 뗀 경우에만 (조이스틱 손가락이 지나가다 떼면 무시)
    this.pauseBtn.on('pointerdown', () => { pressed = true; });
    this.pauseBtn.on('pointerout', () => { pressed = false; });
    this.pauseBtn.on('pointerup', () => { if (pressed) { pressed = false; scene.pause(false); } });

    this.last = {};
  }

  /** 글자는 값이 바뀔 때만 다시 그린다 */
  set(key, obj, value) {
    if (this.last[key] === value) return;
    this.last[key] = value;
    obj.setText(value);
  }

  banner(title, sub) {
    const sc = this.scene;
    this.bannerTitle.setText(title);
    this.bannerSub.setText(sub);
    sc.tweens.killTweensOf([this.bannerTitle, this.bannerSub]);
    for (const [o, d] of [[this.bannerTitle, 0], [this.bannerSub, 120]]) {
      o.setAlpha(0);
      sc.tweens.add({ targets: o, alpha: 1, delay: d, duration: 250 });
      sc.tweens.add({ targets: o, alpha: 0, delay: 1800 + d, duration: 500 });
    }
  }

  update() {
    const sc = this.scene;
    const p = sc.player;
    const now = sc.clock.now;
    const k = Math.max(0, p.hp / p.maxHp);
    this.hpBar.width = BAR_W * k;
    this.hpBar.fillColor = k <= 0.2 ? 0xff7a5a : 0x8fd0ff;
    this.set('hp', this.hpText, `${Math.ceil(p.hp)} / ${p.maxHp}`);
    const realm = BALANCE.realms.list[sc.realm.index];
    this.set('realm', this.realmText, `경지 · ${realm.name}`);
    this.realmText.setColor(`#${realm.color.toString(16).padStart(6, '0')}`);

    // 남은 시간 (요황까지). 요황이 나오면 체력 막대 + 봉인석 붕괴까지 남은 시간
    const king = sc.bosses.king;
    const bossOn = !!king && (king.alive || sc.bosses.done);
    this.timeText.setVisible(!bossOn);
    this.bossBg.setVisible(bossOn);
    this.bossFill.setVisible(bossOn);
    this.bossName.setVisible(bossOn);
    const wv = sc.waves.index;
    for (let i = 0; i < this.waveCells.length; i++) {
      const cw = WAVE_W / this.waveCells.length - 2;
      this.waveCells[i].width = i < wv ? cw : i === wv ? cw * sc.waves.progress(now) : 0;
    }
    if (bossOn) {
      this.bossFill.width = BOSS_W * Math.max(0, king.hp / king.maxHp);
      this.bossFill.fillColor = sc.bosses.enraged ? 0xff5a3c : 0xd94a3a;
      this.set('bossName', this.bossName, sc.bosses.enraged ? '요황 · 광폭' : '요황');
      const t = Math.max(0, sc.bosses.kingTimeLeft(now));
      this.set('wave', this.waveText, `봉인석 붕괴까지 ${formatTime(t + 999)}`);
      this.waveText.setColor(t < 30000 ? '#ff9a6a' : '#b9a6e8');
    } else {
      this.set('time', this.timeText, formatTime(BALANCE.waves.bossAtSec * 1000 - now + 999));
      this.set('wave', this.waveText, `웨이브 ${wv + 1}`);
    }

    this.set('kills', this.killText, `처치 ${sc.stats.kills}`);
    this.set('level', this.levelText, `Lv ${sc.leveling.level}`);
    this.xpBar.width = W * sc.leveling.ratio;
    const near = sc.realm.near();
    this.nearText.setVisible(near);
    this.xpBar.fillColor = near && Math.floor(sc.time.now / 200) % 2 ? 0xffd36a : 0x7fd8ff;
  }
}
