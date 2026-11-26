import { BALANCE } from '../config/balance.js';
import { sfx } from './audio.js';
import { WALK_FRAMES } from '../scenes/playerTexture.js';

const WALK_FRAME_MS = 120; // 걷기 그림 한 장을 보여 주는 시간 (게임 시간)

// 플레이어 "월영": 이동, 체력, 맞기, 맞은 뒤 무적
export class Player {
  constructor(scene) {
    const cfg = BALANCE.player;
    this.scene = scene;
    this.x = 0;
    this.y = 0;
    this.dirX = 0; // 마지막으로 움직인 방향 (요괴를 앞쪽에 놓을 때 씀)
    this.dirY = 0;
    this.radius = cfg.radius;
    this.speed = cfg.speed;
    this.maxHp = cfg.maxHp;
    this.hp = cfg.maxHp;
    this.invulnUntil = 0;
    this.aura = scene.add.image(0, 0, 'aura').setDepth(19);
    this.auraScale = 1; // 경지가 오를수록 커짐 (realm.js)
    this.sprite = scene.add.image(0, 0, 'player').setDepth(20).setOrigin(0.5, 0.6); // 기준점 = 몸 가운데
    this.walkT = 0; // 걷는 동안 통통 튀는 시간
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
    // 걷기: 다리 그림 4장을 번갈아 (걸음 간격 WALK_FRAME_MS), 살짝 통통. 멈추면 서 있는 그림
    const frame = this.walkT ? `player_w${Math.floor(this.walkT / WALK_FRAME_MS) % WALK_FRAMES}` : 'player';
    if (this.sprite.texture.key !== frame) this.sprite.setTexture(frame);
    const bob = this.walkT ? -Math.abs(Math.sin((this.walkT / WALK_FRAME_MS) * (Math.PI / 2))) * 2 : 0;
    this.sprite.setPosition(this.x, this.y + bob);
    this.aura.setPosition(this.x, this.y).setScale(this.auraScale * (1 + 0.08 * Math.sin(now / 250)));
    // 맞은 뒤 무적 동안 깜빡임
    this.sprite.setAlpha(now < this.invulnUntil && Math.floor(now / 70) % 2 ? 0.35 : 1);
  }

  heal(amount) {
    if (this.hp <= 0) return;
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  hurt(dmg, now) {
    const sc = this.scene;
    if (sc.god || sc.realm.breaking || now < this.invulnUntil || this.hp <= 0) return; // 돌파 연출 중 무적
    this.hp = Math.max(0, this.hp - dmg);
    this.invulnUntil = now + BALANCE.player.hurtInvulnMs;
    sc.effects.number(this.x, this.y - 26, dmg, '#ff6b4a');
    sc.effects.shake('hurt');
    sc.effects.vibrate(BALANCE.feel.vibrateHurtMs);
    sfx.play('hurt');
  }
}
