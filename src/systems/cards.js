import { BALANCE } from '../config/balance.js';
import { SPELLS, upgradeText } from '../data/spells.js';

// 레벨업 카드 고르기 (시드 난수 rng로 → 같은 시드면 같은 카드)
// 규칙(사용자 요청): 한 번에 나오는 카드는 모두 같은 단계.
//   예) 모두 '새 법술'(0→1) 또는 모두 '1단계→2단계'.
//   3장 이상 모을 수 있는 단계 중 하나를 무작위로 고른다. 그런 단계가 없으면 가장 많은 단계로(1~2장).
// 칸(공격 5·보조 4)이 다 차면 새 법술은 나오지 않는다.

function option(book, key) {
  const def = SPELLS[key];
  const from = book.level(key);
  return {
    key,
    name: def.name,
    kind: def.kind,
    isNew: from === 0,
    from,
    to: from + 1,
    text: from === 0 ? def.desc : upgradeText(key, from, from + 1),
  };
}

export function rollCards(book, rng, n = 3) {
  const maxL = BALANCE.spells.maxLevel;
  const slots = BALANCE.spells.slots;
  const groups = new Map(); // 지금 단계 → 법술들
  for (const key of Object.keys(SPELLS)) {
    const L = book.level(key);
    const kind = SPELLS[key].kind;
    if (L >= maxL) continue;
    if (L === 0 && book.count(kind) >= slots[kind]) continue;
    if (!groups.has(L)) groups.set(L, []);
    groups.get(L).push(key);
  }
  if (!groups.size) {
    return [{ key: 'elixir', name: '영약', kind: 'item', isNew: false, text: `체력 ${BALANCE.elixirHeal} 회복` }];
  }

  const levels = [...groups.keys()].sort((a, b) => a - b);
  let choices = levels.filter((L) => groups.get(L).length >= n);
  if (!choices.length) {
    const most = Math.max(...levels.map((L) => groups.get(L).length));
    choices = levels.filter((L) => groups.get(L).length === most);
  }
  const level = choices[Math.floor(rng.next() * choices.length)];

  const pool = groups.get(level).slice();
  const picked = [];
  while (picked.length < n && pool.length) picked.push(pool.splice(Math.floor(rng.next() * pool.length), 1)[0]);
  return picked.map((k) => option(book, k));
}
