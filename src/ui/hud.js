import { GAME_WIDTH as W, FONT, BUTTON_ZONE_TOP } from '../config/display.js';
import { settings } from '../systems/settings.js';
import { formatTime } from './overlays.js';

const BAR_W = 116; // 체력 막대 길이

// 상단 표시(체력, 시간, 처치 수)와 일시정지 버튼
export class Hud {
  constructor(scene) {
    this.scene = scene;
    const fix = (o) => o.setScrollFactor(0).setDepth(150);
    fix(scene.add.rectangle(16, 18, BAR_W + 4, 12, 0x0b0f26, 0.8).setOrigin(0).setStrokeStyle(1, 0xdfe4f2, 0.5));
    this.hpBar = fix(scene.add.rectangle(18, 20, BAR_W, 8, 0x8fd0ff, 1).setOrigin(0));
    this.hpText = fix(scene.add.text(16, 34, '', { fontFamily: FONT, fontSize: '13px', color: '#dfe4f2' }));
    this.timeText = fix(scene.add.text(W / 2, 14, '00:00', {
      fontFamily: FONT, fontSize: '24px', fontStyle: 'bold', color: '#dfe4f2',
    }).setOrigin(0.5, 0));
    this.killText = fix(scene.add.text(W - 16, 18, '', { fontFamily: FONT, fontSize: '15px', color: '#b9a6e8' }).setOrigin(1, 0));
    this.levelText = fix(scene.add.text(W - 16, 38, '', { fontFamily: FONT, fontSize: '15px', fontStyle: 'bold', color: '#bff0ff' })
      .setOrigin(1, 0));
    // 영기 막대: 화면 맨 위 가로줄
    fix(scene.add.rectangle(0, 0, W, 5, 0x0b0f26, 0.9).setOrigin(0));
    this.xpBar = fix(scene.add.rectangle(0, 0, 0, 5, 0x7fd8ff, 1).setOrigin(0));

    // 일시정지 버튼: 버튼은 화면 아래 60% 안 (오른쪽 가장자리, 왼손 모드면 왼쪽)
    const px = settings.leftHand ? 30 : W - 30;
    const py = BUTTON_ZONE_TOP + 30;
    this.pauseBtn = scene.add.circle(px, py, 24, 0x0b0f26, 0.55).setStrokeStyle(2, 0xdfe4f2, 0.6)
      .setScrollFactor(0).setDepth(150).setInteractive();
    fix(scene.add.text(px, py, 'Ⅱ', { fontFamily: FONT, fontSize: '20px', color: '#dfe4f2' }).setOrigin(0.5));
    this.pauseBtn.on('pointerup', () => scene.pause(false));

    this.last = {};
  }

  /** 글자는 값이 바뀔 때만 다시 그린다 */
  set(key, obj, value) {
    if (this.last[key] === value) return;
    this.last[key] = value;
    obj.setText(value);
  }

  update() {
    const sc = this.scene;
    const p = sc.player;
    const k = Math.max(0, p.hp / p.maxHp);
    this.hpBar.width = BAR_W * k;
    this.hpBar.fillColor = k <= 0.2 ? 0xff7a5a : 0x8fd0ff;
    this.set('hp', this.hpText, `${Math.ceil(p.hp)} / ${p.maxHp}`);
    this.set('time', this.timeText, formatTime(sc.clock.now));
    this.set('kills', this.killText, `처치 ${sc.stats.kills}`);
    this.set('level', this.levelText, `Lv ${sc.leveling.level}`);
    this.xpBar.width = W * sc.leveling.ratio;
  }
}
