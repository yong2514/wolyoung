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
import { Bosses } from '../systems/bosses.js';
import { Player } from '../systems/player.js';
import { SpellBook } from '../systems/spellbook.js';
import { Orbs } from '../systems/orbs.js';
import { Leveling } from '../systems/leveling.js';
import { PerfMonitor } from '../systems/perf.js';
import { AutoPlayer } from '../systems/autoplay.js';
import { sfx } from '../systems/audio.js';
import { FieldCards } from '../systems/fieldCards.js';
import { Joystick } from '../ui/joystick.js';
import { Hud } from '../ui/hud.js';
import { Minimap } from '../ui/minimap.js';
import { DebugPanel } from '../ui/debug.js';
import { showGameOver, showPause, runCountdown } from '../ui/overlays.js';

const GRID_MARGIN = 200; // 화면 둘레로 이만큼 더 격자에 넣는다

// 한 판. state: play(진행) · target(멸요인 구역) · paused(일시정지) · countdown(3초) · over(끝)
// 레벨업 카드는 멈추지 않고 바닥에 떨어진다 (systems/fieldCards.js)
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

    this.bg = this.add.tileSprite(0, 0, W, H, 'bgtile').setOrigin(0).setScrollFactor(0).setDepth(-10);
    const cell = BALANCE.limits.gridCell;
    this.grid = new SpatialGrid(cell, Math.ceil((W + GRID_MARGIN * 2) / cell), Math.ceil((H + GRID_MARGIN * 2) / cell),
      BALANCE.limits.enemyCap + 100);
    this.grid.bodyPad = BALANCE.boss.yohwang.radius; // 가장 큰 요괴(요황) 몸만큼 넓게 검사
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
    this.fieldCards = new FieldCards(this);
    this.hud = new Hud(this);
    this.bosses = new Bosses(this);
    this.minimap = new Minimap(this);
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
      this.clock.feed(delta, PARAMS.speed);
      while (this.state === 'play' && this.clock.take()) this.step(STEP);
    }
    const cam = this.cameras.main;
    this.bg.tilePositionX = cam.scrollX;
    this.bg.tilePositionY = cam.scrollY;
    this.hud.update();
    this.minimap.update();
    this.perf.update(delta);
    this.debug?.update();
  }

  /** 게임 한 걸음 (dt: 게임 시간 ms, 늘 STEP) */
  step(dt) {
    const now = this.clock.now;
    const move = this.auto ? this.auto.vector(dt, this) : this.joystick.vector;
    this.player.update(dt, move, now);
    this.waves.update(dt, now);
    this.bosses.update(dt, now);
    if (this.state !== 'play') return; // 봉인석 붕괴로 끝남
    this.enemies.move(dt, now);
    this.grid.reset(this.player.x - W / 2 - GRID_MARGIN, this.player.y - H / 2 - GRID_MARGIN);
    this.enemies.insertInto(this.grid);
    this.enemies.collide(now);
    this.enemyBullets.update(dt, now);
    this.book.update(dt, now);
    this.orbs.update(dt);
    this.chests.update(dt, now);
    this.fieldCards.update(dt, now);
    this.realm.check();
    // 레벨업 → 카드 무리를 바닥에 (돌파 연출이 먼저, 카드는 연출이 끝난 뒤)
    while (this.leveling.pending > 0 && !this.realm.breaking) {
      this.leveling.pending--;
      this.fieldCards.dropGroup(now);
    }
    this.effects.update(dt);
    this.stats.maxEnemies = Math.max(this.stats.maxEnemies, this.enemies.count);

    if (this.state !== 'play') return; // 요황 처치로 끝남
    if (this.player.hp <= 0) this.gameOver();
    else if (this.auto && now >= PARAMS.autoMax * 1000) this.finishAuto('시간 끝');
  }

  /** 요황 처치: 봉인 성공 */
  clear() {
    this.state = 'over';
    this.joystick.reset();
    const p = this.player;
    this.effects.flash('ring', p.x, p.y, { life: 1200, scale: 0.5, scaleTo: 12, tint: 0xffd36a, depth: 45 });
    this.effects.burst(p.x, p.y, 0xffd36a, 40);
    this.cameras.main.flash(500, 255, 240, 200);
    sfx.play('breakthrough');
    if (this.auto) { this.finishAuto('클리어'); return; }
    showGameOver(this, { title: '봉인 성공!', color: '#ffe7a8', sub: '요황을 다시 봉인했다', timeMs: this.clock.now, kills: this.stats.kills },
      () => this.scene.restart());
  }

  /** 요황이 120초 안에 쓰러지지 않음: 패배 */
  lose(reason) {
    this.state = 'over';
    this.joystick.reset();
    sfx.play('gameover');
    this.cameras.main.shake(600, 0.02);
    if (this.auto) { this.finishAuto('봉인석 붕괴'); return; }
    showGameOver(this, { title: '봉인석이 부서졌다…', sub: reason, timeMs: this.clock.now, kills: this.stats.kills },
      () => this.scene.restart());
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
