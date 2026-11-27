import { BALANCE } from '../config/balance.js';

// 점수 (기획서 7번): 처치 수 + 버틴 초 × 10 + 경지 보너스 + 클리어 보너스, × 심마 배율(6b, 지금은 1)
// 최고 기록 비교·순위(이 기기 안, 사용자 요청)·도전장·랭킹은 모두 이 점수를 쓴다.
export function runScore(sc, cleared = false) {
  const S = BALANCE.score;
  const base = sc.stats.kills
    + Math.floor(sc.clock.now / 1000) * S.perSecond
    + (S.realmBonus[sc.realm.index] ?? 0)
    + (cleared ? S.clearBonus : 0);
  return Math.round(base * (sc.simaMult ?? 1));
}

/**
 * 이 판 기록을 순위표(이 기기)에 넣는다. 돌려주는 값: { rank(1부터), list(상위 N), prevBest }
 * 같은 점수면 새 기록이 위. save에 반영할지는 부르는 쪽이 정한다(디버그 판은 저장 안 함).
 */
export function addRecord(records, rec) {
  const prevBest = records[0]?.score ?? 0;
  const list = records.slice();
  let i = list.findIndex((r) => rec.score >= r.score);
  if (i < 0) i = list.length;
  list.splice(i, 0, rec);
  return { rank: i + 1, list: list.slice(0, BALANCE.score.keepRecords), prevBest };
}

/** 오늘 날짜 'MM.DD' (기록 표시용) */
export function shortDate() {
  const d = new Date();
  return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}
