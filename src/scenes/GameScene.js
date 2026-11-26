import Phaser from 'phaser';
import { BALANCE } from '../config/balance.js';
import { GAME_WIDTH as W, GAME_HEIGHT as H } from '../config/display.js';
import { PARAMS } from '../systems/params.js';
import { Rng, newSeed } from '../systems/rng.js';
import { GameClock, STEP } from '../systems/clock.js';
import { SpatialGrid } from '../systems/grid.js';
import { Effects } from '../systems/effects.js';
import { EnemySystem } from '../systems/enemies.js';
import { Player } from '../systems/player.js';
import { FlyingSword } from '../systems/weapons.js';
import { PerfMonitor } from '../systems/perf.js';
import { AutoPlayer } from '../systems/autoplay.js';
import { sfx } from '../systems/audio.js';
import { Joystick } from '../ui/joystick.js';
import { Hud } from '../ui/hud.js';
import { DebugPanel } from '../ui/debug.js';
import { showGameOver, showPause, runCountdown } from '../ui/overlays.js';

const GRID_MARGIN = 200; // 화면 둘레로 이만큼 더 격자에 넣는다

// 한 판. state: play(진행) · paused(일시정지) · countdown(3초 세기) · over(끝)
export class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  create() {
    this.seed = PARAMS.seed ?? newSeed();
    this.rng = new Rng(this.seed);
    this.fxRng = this.rng.fork('fx');
    this.clock = new GameClock();
    this.god = PARAMS.god;
    this.state = 'play';
    this.stats = { kills: 0, maxEnemies: 0 };

    this.bg = this.add.tileSprite(0, 0, W, H, 'bgtile').setOrigin(0).setScrollFactor(0).setDepth(-10);
    const cell = BALANCE.limits.gridCell;
    this.grid = new SpatialGrid(cell, Math.ceil((W + GRID_MARGIN * 2) / cell), Math.ceil((H + GRID_MARGIN * 2) / cell),
      BALANCE.limits.enemyCap + 100);
    this.effects = new Effects(this);
    this.player = new Player(this);
    this.enemies = new EnemySystem(this);
    this.sword = new FlyingSword(this);
    this.joystick = new Joystick(this);
    this.hud = new Hud(this);
    this.perf = new PerfMonitor(this);
    this.cameras.main.startFollow(this.player.sprite, false, 1, 1);
    this.auto = PARAMS.auto ? new AutoPlayer(this.rng.fork('auto')) : null;
    this.debug = PARAMS.debug ? new DebugPanel(this) : null;
    if (PARAMS.fill) {
      this.enemies.keepAtLeast = PARAMS.fill;
      this.enemies.fill(PARAMS.fill, 0);
    }

    const onVis = () => {
      if (document.hidden) this.pause(true);
      else {
        sfx.resume();
        if (this.state === 'paused' && this.pausedByHide) this.resume();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    this.events.once('shutdown', () => {
      document.removeEventListener('visibilitychange', onVis);
      this.debug?.destroy();
    });
    window.__wolyoung.ready = true;
  }

  canMove() { return this.state === 'play' || this.state === 'countdown'; }

  update(time, delta) {
    if (this.state === 'play') {
      this.clock.feed(delta, PARAMS.speed);
      while (this.state === 'play' && this.clock.take()) this.step(STEP);
    }
    const cam = this.cameras.main;
    this.bg.tilePositionX = cam.scrollX;
    this.bg.tilePositionY = cam.scrollY;
    this.hud.update();
    this.perf.update(delta);
    this.debug?.update();
  }

  /** 게임 한 걸음 (dt: 게임 시간 ms, 늘 STEP) */
  step(dt) {
    const now = this.clock.now;
    const move = this.auto ? this.auto.vector(dt) : this.joystick.vector;
    this.player.update(dt, move, now);
    this.enemies.updateSpawning(dt, now);
    this.enemies.move(dt, now);
    this.grid.reset(this.player.x - W / 2 - GRID_MARGIN, this.player.y - H / 2 - GRID_MARGIN);
    this.enemies.insertInto(this.grid);
    this.enemies.collide(now);
    this.sword.update(dt, now);
    this.effects.update(dt);
    this.stats.maxEnemies = Math.max(this.stats.maxEnemies, this.enemies.count);

    if (this.player.hp <= 0) this.gameOver();
    else if (this.auto && now >= PARAMS.autoMax * 1000) this.finishAuto('시간 끝');
  }

  pause(byHide) {
    if (this.state !== 'play') return;
    this.state = 'paused';
    this.clock.paused = true;
    this.pausedByHide = byHide;
    this.joystick.reset();
    this.pauseUi = showPause(this, () => this.resume());
  }

  /** 3초를 센 뒤 이어서 */
  resume() {
    if (this.state !== 'paused') return;
    this.state = 'countdown';
    this.pauseUi?.destroy();
    runCountdown(this, () => {
      if (this.state !== 'countdown') return;
      this.state = 'play';
      this.clock.paused = false;
    });
  }

  gameOver() {
    this.state = 'over';
    this.joystick.reset();
    sfx.play('gameover');
    this.effects.vibrate(200);
    if (this.auto) { this.finishAuto('사망'); return; }
    showGameOver(this, { timeMs: this.clock.now, kills: this.stats.kills }, () => this.scene.restart());
  }

  /** 자동 점검 결과 한 줄 */
  finishAuto(reason) {
    this.state = 'over';
    const w = window.__wolyoung;
    const r = {
      errors: w.errors,
      wave: Math.min(8, Math.floor(this.clock.now / (BALANCE.run.waveSec * 1000)) + 1),
      avgFps: Math.round(this.perf.avg),
      maxEnemies: this.stats.maxEnemies,
      timeSec: Math.round(this.clock.now / 1000),
      kills: this.stats.kills,
      reason,
    };
    console.log(`[자동점검] 오류 ${r.errors}개, 도달 웨이브 ${r.wave}, 평균 프레임 ${r.avgFps}, 최대 요괴 ${r.maxEnemies}마리`
      + ` (${reason}, ${r.timeSec}초, 처치 ${r.kills})`);
    w.result = r;
    showGameOver(this, { timeMs: this.clock.now, kills: this.stats.kills }, () => this.scene.restart());
  }
}
