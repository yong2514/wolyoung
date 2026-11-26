import Phaser from 'phaser';
import { BALANCE } from '../config/balance.js';
import { GAME_WIDTH as W, GAME_HEIGHT as H } from '../config/display.js';
import { SPELLS, FUSIONS } from '../data/spells.js';
import { PARAMS } from '../systems/params.js';
import { Rng, newSeed } from '../systems/rng.js';
import { GameClock, STEP } from '../systems/clock.js';
import { SpatialGrid } from '../systems/grid.js';
import { Effects } from '../systems/effects.js';
import { EnemySystem } from '../systems/enemies.js';
import { EnemyBullets } from '../systems/enemyBullets.js';
import { Waves } from '../systems/waves.js';
import { Chests } from '../systems/chests.js';
import { Realm } from '../systems/realm.js';
import { Player } from '../systems/player.js';
import { SpellBook } from '../systems/spellbook.js';
import { Orbs } from '../systems/orbs.js';
import { Leveling } from '../systems/leveling.js';
import { PerfMonitor } from '../systems/perf.js';
import { AutoPlayer } from '../systems/autoplay.js';
import { sfx } from '../systems/audio.js';
import { Joystick } from '../ui/joystick.js';
import { Hud } from '../ui/hud.js';
import { StashButton } from '../ui/stash.js';
import { DebugPanel } from '../ui/debug.js';
import { showGameOver, showPause, runCountdown } from '../ui/overlays.js';
import { openCards, openStash } from './levelUpFlow.js';

const GRID_MARGIN = 200; // 화면 둘레로 이만큼 더 격자에 넣는다

// 한 판. state: play(진행) · card(카드 고르기) · stash(보관함) · target(멸요인 구역) · paused(일시정지) · countdown(3초) · over(끝)
export class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  create() {
    this.seed = PARAMS.seed ?? newSeed();
    this.rng = new Rng(this.seed);
    this.fxRng = this.rng.fork('fx');
    this.cardRng = this.rng.fork('cards'); // 카드 순서 전용 → 같은 시드면 같은 카드
    this.clock = new GameClock();
    this.god = PARAMS.god;
    this.state = 'play';
    this.stats = { kills: 0, elites: 0, chests: 0, seonok: 0, maxEnemies: 0, firstCardMs: null };
    this.run = { refresh: BALANCE.cards.refreshPerRun, banish: BALANCE.cards.banishPerRun }; // 이 판에 남은 횟수
    this.stash = []; // 보관한 카드 { key, gain, rarity }

    this.bg = this.add.tileSprite(0, 0, W, H, 'bgtile').setOrigin(0).setScrollFactor(0).setDepth(-10);
    const cell = BALANCE.limits.gridCell;
    this.grid = new SpatialGrid(cell, Math.ceil((W + GRID_MARGIN * 2) / cell), Math.ceil((H + GRID_MARGIN * 2) / cell),
      BALANCE.limits.enemyCap + 100);
    this.effects = new Effects(this);
    this.player = new Player(this);
    this.enemies = new EnemySystem(this);
    this.enemyBullets = new EnemyBullets(this);
    this.orbs = new Orbs(this);
    this.chests = new Chests(this);
    this.leveling = new Leveling();
    this.realm = new Realm(this);
    this.waves = new Waves(this);
    this.book = new SpellBook(this);
    this.book.learn(BALANCE.spells.startWith);
    this.joystick = new Joystick(this);
    this.hud = new Hud(this);
    this.stashBtn = new StashButton(this, () => openStash(this));
    this.perf = new PerfMonitor(this);
    this.cameras.main.startFollow(this.player.sprite, false, 1, 1);
    this.auto = PARAMS.auto ? new AutoPlayer(this.rng.fork('auto')) : null;
    this.debug = PARAMS.debug ? new DebugPanel(this) : null;
    if (PARAMS.fusions) FUSIONS.forEach((k) => this.book.fuse(k)); // 점검용: 합일 4종을 처음부터
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

  spellName(key) { return SPELLS[key].name; }

  update(time, delta) {
    if (this.state === 'play') {
      this.realm.check(); // 돌파할 레벨이면 카드보다 먼저 돌파
      this.clock.feed(delta, PARAMS.speed);
      // 레벨업 카드는 돌파 연출이 끝난 뒤에 (돌파가 먼저)
      while (this.state === 'play' && (this.leveling.pending === 0 || this.realm.breaking) && this.clock.take()) this.step(STEP);
      if (this.state === 'play' && this.leveling.pending > 0 && !this.realm.breaking) openCards(this);
    }
    const cam = this.cameras.main;
    this.bg.tilePositionX = cam.scrollX;
    this.bg.tilePositionY = cam.scrollY;
    this.hud.update();
    this.stashBtn.update(this.stash.length);
    this.perf.update(delta);
    this.debug?.update();
  }

  /** 게임 한 걸음 (dt: 게임 시간 ms, 늘 STEP) */
  step(dt) {
    const now = this.clock.now;
    const move = this.auto ? this.auto.vector(dt) : this.joystick.vector;
    this.player.update(dt, move, now);
    this.waves.update(dt, now);
    this.enemies.move(dt, now);
    this.grid.reset(this.player.x - W / 2 - GRID_MARGIN, this.player.y - H / 2 - GRID_MARGIN);
    this.enemies.insertInto(this.grid);
    this.enemies.collide(now);
    this.enemyBullets.update(dt, now);
    this.book.update(dt, now);
    this.orbs.update(dt);
    this.chests.update(dt, now);
    this.realm.check();
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
    const sec = (ms) => +(ms / 1000).toFixed(1);
    const r = {
      errors: w.errors,
      wave: this.waves.index + 1,
      avgFps: Math.round(this.perf.avg),
      maxEnemies: this.stats.maxEnemies,
      timeSec: Math.round(this.clock.now / 1000),
      kills: this.stats.kills,
      elites: this.stats.elites,
      chests: this.stats.chests,
      level: this.leveling.level,
      firstCardSec: this.stats.firstCardMs === null ? null : sec(this.stats.firstCardMs),
      realmSecs: this.realm.times.slice(1).map(sec), // 축기·금단·원영·화신 돌파 시각(초)
      spells: this.book.order.map((k) => `${k}${this.book.level(k)}`).join(','),
      reason,
    };
    console.log(`[자동점검] 오류 ${r.errors}개, 도달 웨이브 ${r.wave}, 평균 프레임 ${r.avgFps}, 최대 요괴 ${r.maxEnemies}마리`
      + ` (${reason}, ${r.timeSec}초, 처치 ${r.kills}, 정예 ${r.elites}, 상자 ${r.chests}, Lv ${r.level}, 첫 카드 ${r.firstCardSec}초,`
      + ` 돌파 ${r.realmSecs.join('/')}초, ${r.spells})`);
    w.result = r;
    showGameOver(this, { timeMs: this.clock.now, kills: this.stats.kills }, () => this.scene.restart());
  }
}
