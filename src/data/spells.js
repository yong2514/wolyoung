import { BALANCE } from '../config/balance.js';

// 법술 목록 (이름·설명). 수치는 balance.js의 spells·supports에 있다.
export const SPELLS = {
  flyingSword: { name: '비검', kind: 'attack', desc: '가장 가까운 적을 꿰뚫는 검을 날린다.' },
  thunder: { name: '뇌부', kind: 'attack', desc: '화면 안 요괴에게 무작위로 낙뢰를 떨어뜨린다.' },
  lotus: { name: '연화진', kind: 'attack', desc: '선 자리에 연꽃 장판을 펼쳐 안의 요괴를 계속 태운다.' },
  guard: { name: '호신강기', kind: 'attack', desc: '몸 주위를 도는 기운 구슬이 닿는 요괴를 쳐낸다.' },
  moveSpeed: { name: '경신술', kind: 'support', desc: '이동 속도 +10%' },
  attackSpeed: { name: '속법', kind: 'support', desc: '모든 공격 법술 간격 -8%' },
  maxHp: { name: '금강체', kind: 'support', desc: '최대 체력 +20 (늘어난 만큼 회복)' },
};

/** 카드에 쓰는 수치 이름 */
const STAT_LABELS = {
  damage: '피해', count: '개수', pierce: '관통', cooldownMs: '간격', strikes: '낙뢰 수',
  radius: '범위', durationMs: '지속', orbit: '반경', spin: '회전',
};

function fmt(name, v) {
  if (name === 'cooldownMs' || name === 'durationMs') return `${parseFloat((v / 1000).toFixed(2))}초`;
  return String(v);
}

/** 단계를 올릴 때 바뀌는 수치를 글로: "피해 12→15 · 개수 1→2" */
export function upgradeText(key, from, to) {
  const def = SPELLS[key];
  if (def.kind === 'support') return def.desc;
  const cfg = BALANCE.spells[key];
  const parts = [];
  for (const [name, label] of Object.entries(STAT_LABELS)) {
    const arr = cfg[name];
    if (!Array.isArray(arr) || arr[from - 1] === arr[to - 1]) continue;
    parts.push(`${label} ${fmt(name, arr[from - 1])}→${fmt(name, arr[to - 1])}`);
  }
  return parts.join(' · ');
}
