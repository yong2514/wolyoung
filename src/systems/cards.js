import { BALANCE } from '../config/balance.js';
import { SPELLS, FUSIONS, upgradeText } from '../data/spells.js';

// 레벨업 카드 3장 정하기 (시드 난수 rng로 → 같은 시드면 같은 카드). 카드는 바닥에 떨어진다 (systems/fieldCards.js)
// 규칙
//  1) 합일 재료 두 법술이 모두 최대면 그 합일 카드가 반드시 나온다 (맨 앞).
//  2) 나머지는 모두 같은 단계 (사용자 요청): 모두 '새 법술' 또는 모두 '1단계→' …
//     3장을 채울 수 있는 단계 중 하나를 무작위로. 없으면 가장 많은 단계로(1~2장).
//  3) 카드마다 등급: 일반 +1단계, 희귀 +2단계, 전설 +3단계 (최대를 넘으면 그만큼 낮은 등급으로 보인다)
//  칸(공격 5·보조 4)이 다 차면 새 법술은 안 나온다. 합일에 쓴 재료도 안 나온다.

const RARITY_BY_GAIN = { 1: 'common', 2: 'rare', 3: 'legend' };

function rollGain(rng) {
  const r = rng.next();
  const p = BALANCE.cards.rarity;
  const g = BALANCE.cards.gain;
  return r < p.legend ? g.legend : r < p.legend + p.rare ? g.rare : g.common;
}

function spellCard(book, key, gain) {
  const def = SPELLS[key];
  const from = book.level(key);
  const to = Math.min(book.maxLevel(key), from + gain);
  const step = to - from;
  let text = from === 0 ? def.desc : upgradeText(key, from, to);
  if (from === 0 && to > 1) text += ` (${to}단계로 시작)`;
  return { key, name: def.name, kind: def.kind, isNew: from === 0, from, to, gain, rarity: RARITY_BY_GAIN[step] ?? 'common', text };
}

/**
 * 주울 때 카드를 지금 상태에 맞춰 다시 만든다 (떨어질 때의 등급 = 오르는 단계 수는 그대로).
 * 떨어진 뒤 다른 카드·보물상자로 단계가 바뀌었을 수 있어서. 쓸 수 없으면 usable=false, reason에 까닭
 */
export function recheckCard(book, item) {
  const c = spellCard(book, item.key, item.gain);
  const L = book.level(item.key);
  const kind = SPELLS[item.key].kind;
  c.rarity = item.rarity;
  c.usable = true;
  if (book.fusedParts.has(item.key)) { c.usable = false; c.reason = '합일에 쓰여 더 쓸 수 없음'; }
  else if (L >= book.maxLevel(item.key)) { c.usable = false; c.reason = '이미 최대 단계'; }
  else if (L === 0 && book.count(kind) >= BALANCE.spells.slots[kind]) { c.usable = false; c.reason = '법술 칸이 가득 참'; }
  return c;
}

/** 지금 만들 수 있는 합일 (재료 두 개가 최대) */
export function readyFusion(book) {
  return FUSIONS.find((f) => !book.level(f) && SPELLS[f].fusion.every((p) => book.level(p) >= book.maxLevel(p)));
}

export function rollCards(book, rng, n = 3) {
  const cards = [];
  const fusion = readyFusion(book);
  if (fusion) {
    const [a, b] = SPELLS[fusion].fusion;
    cards.push({
      key: fusion, name: SPELLS[fusion].name, kind: 'fusion', isNew: true, rarity: 'legend',
      text: `${SPELLS[a].name} + ${SPELLS[b].name} → ${SPELLS[fusion].desc}`,
    });
  }

  const slots = BALANCE.spells.slots;
  const groups = new Map(); // 지금 단계 → 법술들
  for (const key of Object.keys(SPELLS)) {
    const def = SPELLS[key];
    if (def.fusion || book.fusedParts.has(key)) continue;
    const L = book.level(key);
    if (L >= book.maxLevel(key)) continue;
    if (L === 0 && book.count(def.kind) >= slots[def.kind]) continue;
    if (!groups.has(L)) groups.set(L, []);
    groups.get(L).push(key);
  }

  const want = n - cards.length;
  if (groups.size && want > 0) {
    const levels = [...groups.keys()].sort((a, b) => a - b);
    let choices = levels.filter((L) => groups.get(L).length >= want);
    if (!choices.length) {
      const most = Math.max(...levels.map((L) => groups.get(L).length));
      choices = levels.filter((L) => groups.get(L).length === most);
    }
    const pool = groups.get(choices[Math.floor(rng.next() * choices.length)]).slice();
    while (cards.length < n && pool.length) {
      const key = pool.splice(Math.floor(rng.next() * pool.length), 1)[0];
      cards.push(spellCard(book, key, rollGain(rng)));
    }
  }

  if (!cards.length) {
    cards.push({ key: 'elixir', name: '영약', kind: 'item', isNew: false, rarity: 'common', text: `체력 ${BALANCE.elixirHeal} 회복` });
  }
  return cards;
}
