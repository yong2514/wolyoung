import { BALANCE } from '../config/balance.js';

const G = BALANCE.spells.guard;

// 법술 목록 (이름·설명). 수치는 config/balance_spells.js에 있다.
// kind: attack(공격 칸) · support(보조 칸). fusion: 합일 법술(재료 두 개를 최대로 올리면 나옴)
export const SPELLS = {
  flyingSword: { name: '비검', kind: 'attack', desc: '가장 가까운 적을 꿰뚫는 검을 날린다.' },
  thunder: { name: '뇌부', kind: 'attack', desc: '화면 안 요괴에게 무작위로 낙뢰를 떨어뜨린다.' },
  lotus: { name: '연화진', kind: 'attack', desc: '선 자리에 연꽃 장판을 펼쳐 안의 요괴를 계속 태운다.' },
  guard: {
    name: '호신강기', kind: 'attack',
    desc: `기운 구슬 ${G.count[0]}개가 몸 주위를 돌며 요괴를 쳐낸다. 구슬은 ${G.hitsPerOrb}번 부딪치면 깨진다.`,
  },
  frost: { name: '빙결', kind: 'attack', desc: '내 둘레를 얼려 피해를 주고 요괴를 느리게 한다.' },
  blueFlame: { name: '청염', kind: 'attack', desc: '가까운 적 쪽으로 부채꼴 푸른 불꽃을 내뿜는다.' },
  talisman: { name: '부적진', kind: 'attack', desc: '둘레에 부적을 놓는다. 요괴가 밟으면 폭발한다.' },
  moonRing: { name: '월륜', kind: 'attack', desc: '날아갔다 돌아오는 달 고리. 오가며 꿰뚫는다.' },
  annihilate: {
    name: '멸요인', kind: 'attack',
    desc: '오른쪽 「멸」 버튼 → 원을 끌어 옮기고 「발동」하면 원 안의 요괴를 모두 없앤다.',
  },

  moveSpeed: { name: '경신술', kind: 'support', desc: '이동 속도 +10%' },
  attackSpeed: { name: '속법', kind: 'support', desc: '모든 공격 법술 간격 -8%' },
  maxHp: { name: '금강체', kind: 'support', desc: '최대 체력 +20 (늘어난 만큼 회복)' },
  multiShot: { name: '연사결', kind: 'support', desc: '날아가는 법술(비검·월륜) 수 +1, 속도 +10%' },
  lifesteal: { name: '흡혈공', kind: 'support', desc: '요괴에게 준 피해의 0.6%만큼 체력 회복' },
  magnet: { name: '섭기술', kind: 'support', desc: '영기 구슬을 끌어오는 범위 +30%' },
  xpGain: { name: '취령술', kind: 'support', desc: '영기 획득량 +10%' },

  thunderSword: { name: '뇌정만검', kind: 'attack', fusion: ['flyingSword', 'thunder'], desc: '검 다섯 자루가 꿰뚫고, 맞은 자리에 낙뢰가 떨어진다.' },
  frostLotus: { name: '빙련결계', kind: 'attack', fusion: ['lotus', 'frost'], desc: '얼음 연꽃이 나를 따라다니며 안의 요괴를 얼리고 태운다.' },
  flameGuard: { name: '청염강기', kind: 'attack', fusion: ['guard', 'blueFlame'], desc: '깨지지 않는 푸른 불꽃 구슬 다섯 개가 몸을 지킨다.' },
  moonSeal: { name: '월하봉마진', kind: 'attack', fusion: ['talisman', 'moonRing'], desc: '달빛 봉인진이 퍼져 안의 요괴를 멈추고 큰 피해를 준다.' },
};

/** 합일 법술 이름들 */
export const FUSIONS = Object.keys(SPELLS).filter((k) => SPELLS[k].fusion);

/** 카드에 쓰는 수치 이름 */
const STAT_LABELS = {
  damage: '피해', count: '개수', pierce: '관통', cooldownMs: '간격', strikes: '낙뢰 수',
  radius: '범위', durationMs: '지속', orbit: '반경', spin: '회전', range: '사거리', angleDeg: '각도',
  slowMult: '둔화', slowMs: '둔화 시간',
};

function fmt(name, v) {
  if (name.endsWith('Ms')) return `${parseFloat((v / 1000).toFixed(2))}초`;
  if (name === 'slowMult') return `${Math.round((1 - v) * 100)}%`;
  if (name === 'angleDeg') return `${v}°`;
  return String(v);
}

/** 단계를 올릴 때 바뀌는 수치를 글로: "피해 12→15 · 개수 1→2" */
export function upgradeText(key, from, to) {
  const def = SPELLS[key];
  if (def.kind === 'support') return to - from > 1 ? `${def.desc} (×${to - from})` : def.desc;
  if (key === 'guard') return `구슬 ${G.count[from - 1]}개→${G.count[to - 1]}개, 모두 새것으로 · 피해 ${G.damage[from - 1]}→${G.damage[to - 1]}`;
  const cfg = BALANCE.spells[key];
  const parts = [];
  for (const [name, label] of Object.entries(STAT_LABELS)) {
    const arr = cfg[name];
    if (!Array.isArray(arr) || arr[from - 1] === arr[to - 1]) continue;
    parts.push(`${label} ${fmt(name, arr[from - 1])}→${fmt(name, arr[to - 1])}`);
  }
  return parts.join(' · ');
}
