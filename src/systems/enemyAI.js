import { sfx } from './audio.js';

// 요괴 행동. 위협적인 공격은 모두 붉은·주황 예고를 0.5초 이상 보여 준다 (e.warn 그림).
// e.ai = { st: 상태, t: 상태가 끝나는 시각, dx, dy: 고정된 방향 }

const WARN = 0xff9a2e;   // 예고 (주황)
const DANGER = 0xff5a3c; // 공격 (붉은)

export function resetAi(e) {
  e.ai.st = 'walk';
  e.ai.t = 0;
  e.ai.dx = 0;
  e.ai.dy = 0;
  e.ai.nextFire = 0;
}

/** 한 걸음 움직이기. s: 초, slow: 속도 배율(빙결) */
export function stepEnemy(sys, e, s, now, slow) {
  const p = sys.scene.player;
  const dx = p.x - e.x;
  const dy = p.y - e.y;
  const d = Math.hypot(dx, dy) || 1;
  const sp = e.speed * slow;
  switch (e.def.behavior) {
    case 'charger': return charger(e, dx, dy, d, sp, s, now);
    case 'ranged': return ranged(sys, e, dx, dy, d, sp, s, now);
    case 'bomber': return bomber(sys, e, dx, dy, d, sp, s, now);
    case 'boss': return undefined; // 보스는 systems/bosses.js
    default: // 쫓아오기
      e.x += (dx / d) * sp * s;
      e.y += (dy / d) * sp * s;
  }
}

/** 돌진귀: 가까우면 멈추고 예고선 → 그 방향으로 빠르게 돌진 → 쉬기 */
function charger(e, dx, dy, d, sp, s, now) {
  const c = e.def;
  const ai = e.ai;
  if (ai.st === 'walk') {
    e.x += (dx / d) * sp * s;
    e.y += (dy / d) * sp * s;
    if (d < c.triggerRange && now >= ai.t) {
      ai.st = 'windup';
      ai.t = now + c.windupMs;
      ai.dx = dx / d; ai.dy = dy / d;
      const len = (c.dashSpeed * c.dashMs) / 1000 + e.radius;
      e.warn.setTexture('warnLine').setOrigin(0, 0.5).setPosition(e.x, e.y)
        .setRotation(Math.atan2(ai.dy, ai.dx)).setScale(len / 100, e.elite ? 1.6 : 1).setTint(WARN).setAlpha(0.3).setVisible(true);
    }
  } else if (ai.st === 'windup') {
    const k = 1 - (ai.t - now) / c.windupMs; // 0 → 1 점점 진하게
    e.warn.setPosition(e.x, e.y).setAlpha(0.3 + 0.6 * k);
    if (now >= ai.t) {
      ai.st = 'dash';
      ai.t = now + c.dashMs;
      e.warn.setTint(DANGER);
    }
  } else if (ai.st === 'dash') {
    e.x += ai.dx * c.dashSpeed * s;
    e.y += ai.dy * c.dashSpeed * s;
    e.warn.setAlpha(Math.max(0, (ai.t - now) / c.dashMs) * 0.6);
    if (now >= ai.t) {
      ai.st = 'walk';
      ai.t = now + c.restMs;
      e.warn.setVisible(false);
    }
  }
}

/** 원귀: 거리 유지, 주기적으로 빛을 모았다가(예고) 탄 발사 */
function ranged(sys, e, dx, dy, d, sp, s, now) {
  const c = e.def;
  const ai = e.ai;
  if (ai.st === 'walk') {
    const dir = d > c.keepRange + 20 ? 1 : d < c.keepRange - 40 ? -0.7 : 0;
    e.x += (dx / d) * sp * dir * s;
    e.y += (dy / d) * sp * dir * s;
    if (!ai.nextFire) ai.nextFire = now + c.fireEveryMs * (0.5 + sys.rng.next() * 0.5);
    if (now >= ai.nextFire && d < c.keepRange + 160) {
      ai.st = 'charge';
      ai.t = now + c.chargeMs;
      e.warn.setTexture('ring').setOrigin(0.5).setRotation(0).setTint(WARN).setAlpha(0.9).setVisible(true);
    }
  } else if (ai.st === 'charge') {
    const k = 1 - (ai.t - now) / c.chargeMs;
    e.warn.setPosition(e.x, e.y).setScale(1.2 - 0.8 * k); // 빛이 모인다
    if (now >= ai.t) {
      sys.scene.enemyBullets.fire(e.x, e.y, dx / d, dy / d, c, e.elite);
      ai.st = 'walk';
      ai.nextFire = now + c.fireEveryMs;
      e.warn.setVisible(false);
    }
  }
}

/** 폭귀: 빠르게 다가와 멈추고, 예고 원이 커진 뒤 폭발 (스스로 사라짐) */
function bomber(sys, e, dx, dy, d, sp, s, now) {
  const c = e.def;
  const ai = e.ai;
  const R = c.blastRadius * (e.elite ? 1.4 : 1);
  if (ai.st === 'walk') {
    e.x += (dx / d) * sp * s;
    e.y += (dy / d) * sp * s;
    if (d < c.triggerRange + e.radius) {
      ai.st = 'fuse';
      ai.t = now + c.fuseMs;
      e.warn.setTexture('ring').setOrigin(0.5).setRotation(0).setTint(WARN).setScale(R / 32).setAlpha(0.25).setVisible(true);
    }
  } else if (ai.st === 'fuse') {
    const k = 1 - (ai.t - now) / c.fuseMs;
    e.warn.setPosition(e.x, e.y).setAlpha(0.25 + 0.6 * k).setTint(k > 0.7 ? DANGER : WARN);
    e.sprite.setScale((e.elite ? 1.5 : 1) * (1 + 0.25 * k));
    if (now >= ai.t) {
      const fx = sys.scene.effects;
      fx.flash('ring', e.x, e.y, { life: 280, scale: (R / 32) * 0.6, scaleTo: R / 32, tint: DANGER, depth: 27 });
      fx.burst(e.x, e.y, DANGER, 10);
      sfx.play('boom');
      const p = sys.scene.player;
      if (Math.hypot(p.x - e.x, p.y - e.y) <= R + p.radius) p.hurt(e.damage, now);
      sys.remove(e); // 자폭은 처치로 세지 않는다 (구슬도 없음)
    }
  }
}
