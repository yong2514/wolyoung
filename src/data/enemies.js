import { BALANCE } from '../config/balance.js';

// 요괴 종류. 수치는 balance.js에서 가져온다.
export const ENEMIES = {
  jabgwi: { key: 'jabgwi', name: '잡귀', texture: 'jabgwi', ...BALANCE.enemies.jabgwi },
};
