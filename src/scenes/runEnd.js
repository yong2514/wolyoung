import { BALANCE } from '../config/balance.js';
import { STORY, reviveLine } from '../data/story.js';
import { sfx } from '../systems/audio.js';
import { writeSave } from '../systems/save.js';
import { PARAMS } from '../systems/params.js';
import { runScore, addRecord, shortDate } from '../systems/score.js';
import { showResult } from '../ui/result.js';
import { victoryBurst } from '../systems/victory.js';

// 판의 끝 흐름: 쓰러짐 → 인연 부활(또는 끝) · 봉인 성공 · 봉인석 붕괴 · 결과 화면 · 자동 점검 결과
// sc = GameScene

/** 체력 0: 흑백 + 시간 멈춤 → 동료가 달려와 인연 부활 장면 (부활할 수 없으면 끝) */
export function onDeath(sc) {
  if (sc.state !== 'play') return;
  sc.state = 'dying';
  sc.joystick.reset();
  sc.effects.setGray(true);
  sfx.play('gameover');
  sc.effects.vibrate(200);
  const scripted = sc.firstRun.sealStruck && !sc.firstRun.scriptRevived; // 첫 판 각본 부활 (횟수에 안 셈)
  if (!scripted && sc.run.revivesLeft <= 0) {
    sc.time.delayedCall(900, () => endRun(sc, 'dead'));
    return;
  }
  // 동료가 달려온다 (부르지 않았어도 쓰러지면 나타난다)
  const c = sc.companion;
  if (!c.active) c.appear();
  sc.tweens.add({ targets: c, x: sc.player.x - 30, y: sc.player.y, duration: 500, ease: 'Cubic.easeOut',
    onUpdate: () => { c.sprite.setPosition(c.x, c.y); c.shadow.setPosition(c.x, c.y + 20); } });
  const line = scripted ? STORY.seoha.scriptRevive : reviveLine(c.key, sc.save.bonds[c.key] ?? 1, sc.fxRng);
  sc.time.delayedCall(700, () => sc.scene.launch('Revive', {
    companion: c.key, line, scripted, auto: !!sc.auto,
    onRevive: () => revive(sc, scripted),
    onGiveUp: () => endRun(sc, 'dead'),
  }));
}

/** 인연 부활: 체력 50%, 3초 무적, 동료 법술이 크게 터져 주변을 쓸어낸다 */
function revive(sc, scripted) {
  const R = BALANCE.revive;
  const p = sc.player;
  const now = sc.clock.now;
  sc.effects.setGray(false);
  p.hp = p.maxHp * R.hpRatio;
  p.invulnUntil = now + R.invulnMs;
  sc.companion.burst(now);
  if (!sc.companion.active) sc.time.delayedCall(900, () => { if (!sc.companion.active) sc.companion.leave(); }); // 살려 주고 떠남
  if (scripted) sc.firstRun.afterScriptRevive(now);
  else { sc.run.revivesLeft--; sc.stats.revives++; }
  sc.cameras.main.flash(300, 230, 220, 255);
  sc.state = 'play';
}

/** 요황 처치: 큰 폭발 연출 → 잠시 뒤 결과 (봉인 성공) */
export function clearRun(sc, x = sc.player.x, y = sc.player.y) {
  sc.state = 'over';
  sc.joystick.reset();
  victoryBurst(sc, x, y, '봉인 성공!');
  if (sc.auto) { endRun(sc, 'clear'); return; }
  sc.time.delayedCall(BALANCE.victory.resultDelayMs, () => endRun(sc, 'clear'));
}

/** 요황이 120초 안에 쓰러지지 않음 */
export function loseRun(sc) {
  sc.state = 'over';
  sc.joystick.reset();
  sfx.play('gameover');
  sc.cameras.main.shake(600, 0.02);
  endRun(sc, 'seal');
}

const ENDS = {
  clear: { title: '봉인 성공!', color: '#ffe7a8', sub: '요황을 다시 봉인했다', auto: '클리어' },
  seal: { title: '봉인석이 부서졌다…', sub: '요황이 봉인석을 부쉈다', auto: '봉인석 붕괴' },
  dead: { title: '쓰러졌다…', auto: '사망' },
};

/** 판의 끝: 점수·순위 저장 → 결과 화면(최고 점수·순위) → 첫 판이면 서하 인연 2단계 대화 → 새 판 */
function endRun(sc, kind) {
  sc.state = 'over';
  sc.effects.setGray(false);
  const e = ENDS[kind];
  const first = sc.scripted;
  // 점수와 이 기기 순위표 (사용자 요청). 디버그 판은 저장하지 않는다
  const score = runScore(sc, kind === 'clear');
  const rec = { score, date: shortDate(), realm: BALANCE.realms.list[sc.realm.index].name,
    kills: sc.stats.kills, sec: Math.round(sc.clock.now / 1000), clear: kind === 'clear' };
  const { rank, list, prevBest } = addRecord(sc.save.records, rec);
  sc.stats.score = score;
  sc.stats.rank = rank;
  sc.lastRanking = { rank, list, prevBest };
  if (!PARAMS.debug) sc.save.records = list;
  if (first && !sc.isDebugFirst) { // 첫 판 각본은 기기당 한 번
    sc.save.firstRunDone = true;
    sc.save.bonds.seoha = Math.max(sc.save.bonds.seoha ?? 1, 2);
  }
  if (!PARAMS.debug || (first && !sc.isDebugFirst)) writeSave(sc.save);

  const next = () => (first ? openBondDialog(sc) : sc.scene.restart());
  if (sc.auto) { finishAuto(sc, e.auto); if (first) openBondDialog(sc, true); return; }
  showResult(sc, { title: e.title, color: e.color, sub: e.sub, score, prevBest, rank, list,
    timeMs: sc.clock.now, kills: sc.stats.kills, button: first ? '계속' : '다시 도전' }, next);
}

/** 결과 화면 직후: 서하 인연 2단계 대화 (첫 판) */
function openBondDialog(sc, auto = false) {
  sc.scene.launch('Dialog', {
    companion: 'seoha', title: '서하 · 인연 2단계', lines: STORY.seoha.bond[2], auto,
    onDone: () => { if (auto) window.__wolyoung.dialogDone = true; else sc.scene.restart(); },
  });
}

/** 자동 점검 결과 한 줄 */
export function finishAuto(sc, reason) {
  sc.state = 'over';
  const w = window.__wolyoung;
  const sec = (ms) => +(ms / 1000).toFixed(1);
  const r = {
    errors: w.errors,
    wave: sc.waves.index + 1,
    avgFps: Math.round(sc.perf.avg),
    maxEnemies: sc.stats.maxEnemies,
    timeSec: Math.round(sc.clock.now / 1000),
    kills: sc.stats.kills,
    elites: sc.stats.elites,
    chests: sc.stats.chests,
    level: sc.leveling.level,
    firstCardSec: sc.stats.firstCardMs === null ? null : sec(sc.stats.firstCardMs),
    firstCardRare: sc.stats.firstCardRare,
    realmSecs: sc.realm.times.slice(1).map(sec), // 축기·금단·원영·화신 돌파 시각(초)
    revives: sc.stats.revives,
    scripted: !!sc.scripted,
    sealStruck: sc.firstRun.sealStruck,
    scriptRevived: sc.firstRun.scriptRevived,
    kingSeen: !!sc.bosses.king,
    bossesSeen: sc.stats.bosses ?? 0,      // 나온 대형 요괴 수
    place: sc.arena.index + 1,             // 도달한 장소
    score: sc.stats.score ?? runScore(sc, reason === '클리어'),
    rank: sc.stats.rank ?? null,
    spells: sc.book.order.map((k) => `${k}${sc.book.level(k)}`).join(','),
    reason,
  };
  console.log(`[자동점검] 오류 ${r.errors}개, 도달 웨이브 ${r.wave}, 평균 프레임 ${r.avgFps}, 최대 요괴 ${r.maxEnemies}마리`
    + ` (${reason}, ${r.timeSec}초, 장소 ${r.place}, 대형 요괴 ${r.bossesSeen}, 점수 ${r.score}, 처치 ${r.kills}, 정예 ${r.elites}, 상자 ${r.chests}, Lv ${r.level}, 첫 카드 ${r.firstCardSec}초,`
    + ` 돌파 ${r.realmSecs.join('/')}초, 부활 ${r.revives}${r.scripted ? `, 첫 판 각본(봉인의 일격 ${r.sealStruck}, 각본 부활 ${r.scriptRevived})` : ''}, ${r.spells})`);
  w.result = r;
  if (!sc.scripted) {
    const { rank, list, prevBest } = sc.lastRanking
      ?? addRecord(sc.save.records, { score: r.score, date: shortDate(), realm: BALANCE.realms.list[sc.realm.index].name, clear: false });
    showResult(sc, { title: reason, score: r.score, prevBest, rank, list, timeMs: sc.clock.now, kills: sc.stats.kills },
      () => sc.scene.restart());
  }
}
