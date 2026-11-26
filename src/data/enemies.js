import { BALANCE } from '../config/balance.js';

// 요괴 종류. 수치는 balance.js의 enemies.tiers에서 가져온다. 그림(texture) 이름 = key
export const ENEMIES = Object.fromEntries(
  BALANCE.enemies.tiers.map((t, i) => [t.key, { ...t, tier: i, texture: t.key }]),
);

/** 내 레벨에서 새로 나올 수 있는 가장 센 요괴 단계 (0부터) */
export function topTier(level) {
  const tiers = BALANCE.enemies.tiers;
  let i = 0;
  while (i + 1 < tiers.length && level >= tiers[i + 1].fromLevel) i++;
  return i;
}
