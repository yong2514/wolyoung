import { BALANCE } from '../config/balance.js';

// 주소 뒤 값(?debug=1 등) 읽기. 숫자는 정해진 형식(숫자만, 범위 안)만 받는다.
const q = new URLSearchParams(location.search);

function int(key, def, min, max) {
  const v = q.get(key);
  if (v === null || !/^\d{1,10}$/.test(v)) return def;
  return Math.min(max, Math.max(min, Number(v)));
}

const debug = q.get('debug') === '1';
const auto = debug && q.get('auto') === '1';

export const PARAMS = {
  debug,
  auto,                                          // 자동 플레이
  god: debug && q.get('god') === '1',            // 처음부터 무적
  speed: auto ? int('speed', 4, 1, 8) : 1,       // 자동 플레이 배속
  seed: q.has('seed') ? int('seed', 1, 0, 4294967295) : null,
  fill: debug ? int('fill', 0, 0, 300) : 0,      // 요괴를 이 수만큼 유지 (성능 시험)
  fusions: debug && q.get('fusions') === '1',    // 합일 4종을 처음부터 가짐 (점검용)
  autoMax: int('autoMax', BALANCE.run.autoMaxSec, 5, 600),
};
