import { BALANCE } from '../config/balance.js';
import { sfx } from './audio.js';
import { WALK_FRAMES } from '../scenes/playerTexture.js';

const WALK_FRAME_MS = 120; // 걷기 그림 한 장을 보여 주는 시간 (게임 시간)

// 플레이어 "월영": 이동, 체력, 맞기, 맞은 뒤 무적, 점프(장애물 넘기), 은형(투명)
export class Player {
  constructor(scene) {
    const cfg = BALANCE.player;
    this.scene = scene;
    this.x = 0;
    this.y = 0;
    this.dirX = 0; // 마지막으로 움직인 방향
    this.dirY = 0;
    this.radius = cfg.radius;
    this.speed = cfg.speed;
    this.maxHp = cfg.maxHp;
    this.hp = cfg.maxHp;
    this.bonusHp = 0;      // 장소마다 강해짐 (arena.powerUp)
    this.invulnUntil = 0;
    this.jumpAt = -Infinity;    // 점프 시작 시각
    this.jumpReadyAt = 0;       // 다시 뛸 수 있는 시각
    this.veilUntil = 0;         // 은형부: 이때까지 투명 (부딪쳐도 안 다침)
    this.shadow = scene.add.image(0, 0, 'shadow').setDepth(2).setScale(0.8); // 발밑 그림자
    this.aura = scene.add.image(0, 0, 'aura').setDepth(19);
    this.auraScale = 1; // 경지가 오를수록 커짐 (realm.js)
    this.sprite = scene.add.image(0, 0, 'player').setDepth(20).setOrigin(0.5, 0.6); // 기준점 = 몸 가운데
    this.walkT = 0; // 걷는 동안 통통 튀는 시간
  }

  /** 공중에 있나 (장애물을 넘고, 몸으로 부딪혀도 안 다침) */
  jumping(now) { return now - this.jumpAt < BALANCE.jump.durationMs; }

  veiled(now) { return now < this.veilUntil; }

  /** 점프 (다시 뛰기까지 cooldownMs). 뛰었으면 true */
  jump(now) {
    if (now < this.jumpReadyAt || this.hp <= 0) return false;
    this.jumpAt = now;
    this.jumpReadyAt = now + BALANCE.jump.cooldownMs;
    sfx.play('jump');
    return true;
  }

  update(dt, move, now) {
    const s = dt / 1000;
    if (move.x || move.y) {
      this.x += move.x * this.speed * s;
      this.y += move.y * this.speed * s;
      const m = Math.hypot(move.x, move.y);
      this.dirX = move.x / m;
      this.dirY = move.y / m;
      if (Math.abs(move.x) > 0.05) this.sprite.flipX = move.x < 0; // 가는 쪽을 본다
      this.walkT += dt;
    } else {
      this.walkT = 0;
    }
    // 걷기: 다리 그림 4장을 번갈아, 살짝 통통. 멈추면 서 있는 그림
    const frame = this.walkT ? `player_w${Math.floor(this.walkT / WALK_FRAME_MS) % WALK_FRAMES}` : 'player';
    if (this.sprite.texture.key !== frame) this.sprite.setTexture(frame);
    let lift = this.walkT ? Math.abs(Math.sin((this.walkT / WALK_FRAME_MS) * (Math.PI / 2))) * 2 : 0;
    let shadowK = 1;
    if (this.jumping(now)) { // 점프: 포물선으로 떠오르고 그림자는 작아짐
      const k = Math.sin(((now - this.jumpAt) / BALANCE.jump.durationMs) * Math.PI);
      lift = BALANCE.jump.height * k;
      shadowK = 1 - 0.4 * k;
    }
    this.sprite.setPosition(this.x, this.y - lift);
    this.shadow.setPosition(this.x, this.y + 22).setScale(0.8 * shadowK);
    this.aura.setPosition(this.x, this.y - lift).setScale(this.auraScale * (1 + 0.08 * Math.sin(now / 250)));
    // 은형: 반투명으로 일렁임 · 맞은 뒤 무적: 깜빡임
    if (this.veiled(now)) this.sprite.setAlpha(BALANCE.veil.alpha + 0.12 * Math.sin(now / 90));
    else this.sprite.setAlpha(now < this.invulnUntil && Math.floor(now / 70) % 2 ? 0.35 : 1);
  }

  heal(amount) {
    if (this.hp <= 0) return;
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  /** contact: 요괴 몸에 부딪힘 (점프·은형 중이면 안 다침) */
  hurt(dmg, now, contact = false) {
    const sc = this.scene;
    if (sc.god || sc.realm.breaking || now < this.invulnUntil || this.hp <= 0) return; // 돌파 연출 중 무적
    if (contact && (this.jumping(now) || this.veiled(now))) return;
    if (sc.firstRun.hpFloor() && this.hp - dmg < 1) { // 첫 판: 요황 전에는 1 밑으로 안 내려감
      this.hp = 1;
      sc.firstRun.onHitFloor(now); // 잠깐 흑백 + "버텨라." (말은 8초에 한 번)
      this.invulnUntil = now + BALANCE.player.hurtInvulnMs;
      return;
    }
    this.hp = Math.max(0, this.hp - dmg);
    this.invulnUntil = now + BALANCE.player.hurtInvulnMs;
    sc.effects.number(this.x, this.y - 26, Math.round(dmg), '#ff6b4a');
    sc.effects.shake('hurt');
    sc.effects.vibrate(BALANCE.feel.vibrateHurtMs);
    sfx.play('hurt');
  }
}
