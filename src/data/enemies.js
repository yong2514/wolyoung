import { BALANCE } from '../config/balance.js';

// 요괴 종류. 수치는 balance.js(enemies.tiers) · balance_waves.js(ENEMY_TYPES)에서 가져온다.
// behavior: chaser(쫓아옴) · charger(돌진) · ranged(원거리) · splitter(분열) · shield(방패) · bomber(자폭)
// 그림(texture) 이름 = key
const BEHAVIOR = { splitling: 'chaser', splitter: 'chaser', shield: 'chaser' };

export const ENEMIES = {
  ...Object.fromEntries(BALANCE.enemies.tiers.map((t, i) => [t.key, { ...t, tier: i, behavior: 'chaser', texture: t.key }])),
  ...Object.fromEntries(Object.entries(BALANCE.enemies.types).map(([k, t]) => [k, {
    ...t, key: k, tier: -1, behavior: BEHAVIOR[k] ?? k, texture: k,
  }])),
  // 보스: 움직임은 systems/bosses.js가 직접
  yojang: { ...BALANCE.boss.yojang, key: 'yojang', tier: -1, behavior: 'boss', boss: true, texture: 'yojang' },
  yohwang: { ...BALANCE.boss.yohwang, key: 'yohwang', tier: -1, behavior: 'boss', boss: true, texture: 'yohwang' },
};

/** 내 레벨에서 새로 나올 수 있는 가장 센 쫓는 요괴 단계 (0부터) */
export function topTier(level) {
  const tiers = BALANCE.enemies.tiers;
  let i = 0;
  while (i + 1 < tiers.length && level >= tiers[i + 1].fromLevel) i++;
  return i;
}
