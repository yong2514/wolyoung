import { BALANCE } from '../config/balance.js';
import { SPELLS, upgradeText } from '../data/spells.js';

// 레벨업 카드 3장 고르기 (시드 난수 rng로 → 같은 시드면 같은 카드)
// 규칙: 가진 법술 중 올릴 수 있는 게 있으면 최소 1장은 그 강화. 칸이 다 차면 가진 법술 강화만.

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
  const upgrades = [];
  const fresh = [];
  for (const key of Object.keys(SPELLS)) {
    const L = book.level(key);
    if (L > 0) {
      if (L < maxL) upgrades.push(key);
    } else if (book.count(SPELLS[key].kind) < slots[SPELLS[key].kind]) {
      fresh.push(key);
    }
  }

  const picked = [];
  const take = (arr) => picked.push(arr.splice(Math.floor(rng.next() * arr.length), 1)[0]);
  if (upgrades.length) take(upgrades); // 최소 1장은 강화
  const rest = upgrades.concat(fresh);
  while (picked.length < n && rest.length) take(rest);

  const cards = picked.map((k) => option(book, k));
  // 강화 카드가 늘 맨 앞에 오지 않도록 섞는다
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  if (!cards.length) {
    cards.push({ key: 'elixir', name: '영약', kind: 'item', isNew: false, text: `체력 ${BALANCE.elixirHeal} 회복` });
  }
  return cards;
}
