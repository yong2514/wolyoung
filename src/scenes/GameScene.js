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
import { Arena } from '../systems/arena.js';
import { Player } from '../systems/player.js';
import { SpellBook } from '../systems/spellbook.js';
import { Orbs } from '../systems/orbs.js';
import { Leveling } from '../systems/leveling.js';
import { PerfMonitor } from '../systems/perf.js';
import { AutoPlayer } from '../systems/autoplay.js';
import { Companion } from '../systems/companion.js';
import { FirstRun } from '../systems/firstRun.js';
import { loadSave, writeSave } from '../systems/save.js';
import { sfx } from '../systems/audio.js';
import { FieldCards } from '../systems/fieldCards.js';
import { Joystick } from '../ui/joystick.js';
import { Hud } from '../ui/hud.js';
import { Minimap } from '../ui/minimap.js';
import { BuffList } from '../ui/buffs.js';
import { JumpButton } from '../ui/jumpButton.js';
import { DebugPanel } from '../ui/debug.js';
import { showPause, runCountdown } from '../ui/overlays.js';
import { onDeath, clearRun, loseRun, finishAuto } from './runEnd.js';

const GRID_MARGIN = 200; // 화면 둘레로 이만큼 더 격자에 넣는다

// 한 판. state: play(진행) · target(멸요인 구역) · travel(다음 장소로) · cinematic(봉인의 일격) · dying(쓰러짐·부활 장면)
//   · paused(일시정지) · countdown(3초) · over(끝). 레벨업 카드는 멈추지 않고 바닥에 떨어진다 (systems/fieldCards.js)
export class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  create() {
    this.setupRun();
    this.rng = new Rng(this.seed);
    this.fxRng = this.rng.fork('fx');
    this.cardRng = this.rng.fork('cards'); // 카드 순서 전용 → 같은 시드면 같은 카드
    this.clock = new GameClock();
    this.god = PARAMS.god;
    this.state = 'play';
    this.stats = { kills: 0, elites: 0, chests: 0, seonok: 0, revives: 0, maxEnemies: 0, firstCardMs: null, firstCardRare: null };
    this.run = { revivesLeft: BALANCE.revive.freePerRun }; // 인연 부활 남은 횟수

    this.bg = this.add.tileSprite(0, 0, W, H, 'bgtile').setOrigin(0).setScrollFactor(0).setDepth(-10);
    this.arena = new Arena(this); // 결계 벽으로 둘러싼 장소 (사용자 요청)
    this.add.image(0, 0, 'vignette').setOrigin(0).setScrollFactor(0).setDepth(140); // 화면 가장자리를 살짝 어둡게 (깊이감)
    const cell = BALANCE.limits.gridCell;
    this.grid = new SpatialGrid(cell, Math.ceil((W + GRID_MARGIN * 2) / cell), Math.ceil((H + GRID_MARGIN * 2) / cell),
      BALANCE.limits.enemyCap + 100);
    this.grid.bodyPad = BALANCE.boss.yohwang.radius; // 가장 큰 요괴(요황) 몸만큼 넓게 검사
    this.effects = new Effects(this);
    this.player = new Player(this);
    this.enemies = new EnemySystem(this);
    this.enemies.hpMult = this.difficulty; // 첫 판 60% · 2판 75% · 3판 90%
    this.enemyBullets = new EnemyBullets(this);
    this.orbs = new Orbs(this);
    this.chests = new Chests(this);
    this.leveling = new Leveling(this.scripted ? BALANCE.firstRun.firstLevelXp : undefined);
    this.realm = new Realm(this);
    this.waves = new Waves(this);
    this.waves.countMult = this.difficulty;
    this.book = new SpellBook(this);
    this.book.learn(BALANCE.spells.startWith);
    this.companion = new Companion(this, 'seoha'); // 동료 (6a에서 고르기)
    this.joystick = new Joystick(this);
    this.fieldCards = new FieldCards(this);
    this.hud = new Hud(this);
    this.bosses = new Bosses(this);
    this.firstRun = new FirstRun(this);
    this.minimap = new Minimap(this);
    this.buffList = new BuffList(this);
    this.jumpBtn = new JumpButton(this);
    this.hud.banner(this.arena.place.name, `1번째 장소 · ${BALANCE.arena.placeSec}초 버티면 대형 요괴`);
    this.perf = new PerfMonitor(this);
    this.cameras.main.startFollow(this.player.sprite, false, 1, 1);
    this.auto = PARAMS.auto ? new AutoPlayer(this.rng.fork('auto')) : null;
    this.debug = PARAMS.debug ? new DebugPanel(this) : null;
    if (PARAMS.fusions) FUSIONS.forEach((k) => this.book.fuse(k, 0, true)); // 점검용: 합일 4종을 처음부터 (늘 유지)
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
      this.scene.stop('Revive');
    });
    window.__wolyoung.ready = true;
  }

  /** 몇 번째 판인지 → 첫 판 각본·난이도·시드 */
  setupRun() {
    this.save = loadSave();
    this.isDebugFirst = PARAMS.first; // 디버그로 첫 판을 시험 (저장 안 바꿈)
    this.scripted = PARAMS.first || (!PARAMS.debug && !this.save.firstRunDone);
    const runIndex = this.scripted ? 0 : PARAMS.debug ? 3 : this.save.runs;
    this.difficulty = BALANCE.runDifficulty[runIndex] ?? 1;
    if (!PARAMS.debug) { this.save.runs++; writeSave(this.save); }
    this.seed = PARAMS.seed ?? (this.scripted ? BALANCE.firstRun.seed : newSeed());
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
    this.buffList.update();
    this.jumpBtn.update();
    this.firstRun.tick(this.clock.now);
    this.perf.update(delta);
    this.debug?.update();
  }

  /** 게임 한 걸음 (dt: 게임 시간 ms, 늘 STEP) */
  step(dt) {
    const now = this.clock.now;
    const move = this.auto ? this.auto.vector(dt, this) : this.joystick.take(); // 사람: 손가락 따라 그대로
    this.player.update(dt, move, now);
    if (!this.player.jumping(now)) this.arena.block(this.player, this.player.radius); // 장애물은 점프로만 넘는다
    this.arena.clamp(this.player, this.player.radius); // 결계 벽 안에만
    this.waves.update(dt, now);
    this.bosses.update(dt, now);
    if (this.state !== 'play') return; // 봉인석 붕괴로 끝남
    this.enemies.move(dt, now);
    this.grid.reset(this.player.x - W / 2 - GRID_MARGIN, this.player.y - H / 2 - GRID_MARGIN);
    this.enemies.insertInto(this.grid);
    this.enemies.collide(now);
    this.enemyBullets.update(dt, now);
    this.book.update(dt, now);
    this.companion.update(dt, now);
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
    this.firstRun.update();
    this.stats.maxEnemies = Math.max(this.stats.maxEnemies, this.enemies.count);

    if (this.state !== 'play') return; // 요황 처치·봉인의 일격
    if (this.player.hp <= 0) this.onDeath();
    else if (this.auto && now >= PARAMS.autoMax * 1000) finishAuto(this, '시간 끝');
  }

  onDeath() { onDeath(this); }

  clear() { clearRun(this); }

  lose() { loseRun(this); }

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
}
