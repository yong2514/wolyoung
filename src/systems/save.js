// 기기에 저장 (localStorage). 판 수·첫 판을 했는지·서하 인연 단계·점수 순위표(records).
// 5단계에서 버전 옮기기·저장 코드·재화로 넓힌다. 저장 데이터에는 버전 번호(v)가 있다.
// records: [{ score, date, realm, kills, sec, clear }] 점수 높은 순
const KEY = 'wolyoung.save';
const DEFAULT = { v: 1, runs: 0, firstRunDone: false, bonds: { seoha: 1 }, records: [] };

export function loadSave() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && s.v === 1) return { ...DEFAULT, ...s, bonds: { ...DEFAULT.bonds, ...s.bonds } };
  } catch { /* 저장이 깨졌으면 새로 */ }
  return structuredClone(DEFAULT);
}

export function writeSave(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* 저장 못 해도 게임은 계속 */ }
}
