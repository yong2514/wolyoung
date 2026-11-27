import { GAME_WIDTH as W, GAME_HEIGHT as H, FONT } from '../config/display.js';
import { makeButton } from './button.js';
import { formatTime } from './overlays.js';

const TAP_DELAY = 400;

/**
 * 판의 끝 결과 화면 (사용자 요청: 최고 점수 · 순위). 5단계에서 선옥·다음 목표·기록 카드를 더한다.
 * info: { title, color, sub, score, prevBest, rank, list(순위표), timeMs, kills, button }
 * "다시 도전"(또는 첫 판이면 "계속")이 가장 크고 엄지 자리에 있다.
 */
export function showResult(scene, info, onNext) {
  const objs = [];
  const fix = (o, depth = 305) => { objs.push(o); return o.setScrollFactor(0).setDepth(depth); };
  const txt = (x, y, s, size, color = '#dfe4f2', bold = true, ox = 0.5) => fix(scene.add.text(x, y, s, {
    fontFamily: FONT, fontSize: size, fontStyle: bold ? 'bold' : 'normal', color,
  }).setOrigin(ox, 0.5));

  const dim = fix(scene.add.rectangle(0, 0, W, H, 0x0b0f26, 0).setOrigin(0), 300);
  scene.tweens.add({ targets: dim, fillAlpha: 0.9, duration: 400 });

  txt(W / 2, H * 0.08, info.title, '34px', info.color ?? '#dfe4f2');
  if (info.sub) txt(W / 2, H * 0.08 + 36, info.sub, '15px', '#b9a6e8', false);
  txt(W / 2, H * 0.08 + 62, `버틴 시간 ${formatTime(info.timeMs)}  ·  처치 ${info.kills}`, '14px', '#8a90b0', false);

  // 점수와 최고 기록
  txt(W / 2, H * 0.215, `${info.score.toLocaleString('ko-KR')}점`, '40px', '#ffffff');
  const newBest = info.score > info.prevBest;
  const cmp = newBest ? (info.prevBest ? '최고 기록 경신!' : '첫 기록!')
    : `최고 기록까지 ${(info.prevBest - info.score + 1).toLocaleString('ko-KR')}점!`;
  txt(W / 2, H * 0.215 + 36, cmp, '17px', newBest ? '#ffd36a' : '#d9ccff');

  // 순위표 (이 기기 안 상위 기록)
  const top = H * 0.32;
  fix(scene.add.rectangle(W / 2, top + 126, W - 40, 262, 0x141a3a, 0.95).setStrokeStyle(1, 0xb9a6e8, 0.7), 302);
  txt(W / 2, top + 10, `내 순위 · 이번 판 ${info.rank}위`, '16px', '#b9a6e8');
  info.list.slice(0, 10).forEach((r, i) => {
    const y = top + 36 + i * 22;
    const me = i + 1 === info.rank;
    if (me) fix(scene.add.rectangle(W / 2, y, W - 48, 20, 0x4a3590, 0.9), 303);
    const c = me ? '#ffe7a8' : '#dfe4f2';
    txt(38, y, `${i + 1}`, '14px', c, true, 0);
    txt(70, y, r.score.toLocaleString('ko-KR'), '14px', c, me, 0);
    txt(170, y, `${r.realm}${r.clear ? ' · 봉인' : ''}`, '13px', me ? c : '#b9a6e8', false, 0);
    txt(W - 38, y, r.date, '12px', me ? c : '#8a90b0', false, 1);
  });
  if (info.rank > 10) txt(W / 2, top + 36 + 10 * 22, `이번 판은 ${info.rank}위`, '13px', '#ffe7a8', false);

  const btn = makeButton(scene, W / 2, H - 110, W - 60, 88, info.button ?? '다시 도전', () => { destroy(); onNext(); },
    { fontSize: '32px', delayMs: TAP_DELAY });
  function destroy() { objs.forEach((o) => o.destroy()); btn.destroy(); }
  return { destroy };
}
