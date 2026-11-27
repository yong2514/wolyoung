import { BALANCE } from '../config/balance.js';
import { sfx } from './audio.js';

// 활동 공간 (사용자 요청): 결계 벽으로 둘러싼 장소 하나. 가운데가 (0,0).
//  · 주인공·요괴·카드는 벽 안에만 있고, 카메라도 벽에서 멈춘다.
//  · 장식은 장애물: 주인공·요괴가 지나갈 수 없다 (주인공은 점프로 넘는다).
//  · 장소마다 placeSec(1분) 동안 싸우고 → 그 장소의 대형 요괴(bosses.js) → 쓰러뜨리면 다음 장소로(travel).
//    옮길 때 주인공·요괴 모두 강해진다(power). 남은 요괴는 사라지고 구슬은 영기로, 카드·보물상자는 새 장소 안으로.
export class Arena {
  constructor(scene) {
    this.scene = scene;
    this.cfg = BALANCE.arena;
    const { width, height } = this.cfg;
    this.x0 = -width / 2; this.x1 = width / 2;
    this.y0 = -height / 2; this.y1 = height / 2;
    this.index = -1;
    this.placeStart = 0;   // 이 장소에서 싸우기 시작한 게임 시간
    this.rng = scene.rng.fork('arena'); // 장애물 자리 (같은 시드 = 같은 자리)
    scene.cameras.main.setBounds(this.x0, this.y0, width, height);
    this.wall = scene.add.graphics().setDepth(3);
    this.obstacles = []; // { img, x, y, r }
    for (let i = 0; i < this.cfg.decor; i++) this.obstacles.push({ img: scene.add.image(0, 0, 'decorRock').setDepth(4), x: 0, y: 0, r: 0 });
    this.setPlace(0);
  }

  get place() { return this.cfg.places[this.index]; }

  get isLast() { return this.index >= this.cfg.places.length - 1; }

  /** 이 장소에서 지난 시간 (ms) */
  placeTime(now) { return now - this.placeStart; }

  /** 장소 모습 바꾸기: 바닥 색, 벽, 장애물 */
  setPlace(i) {
    const sc = this.scene;
    this.index = i;
    const pl = this.place;
    sc.bg.setTint(pl.bg); // 밝은 바닥 무늬에 장소 색을 입힌다
    const g = this.wall;
    g.clear();
    const w = this.x1 - this.x0;
    const h = this.y1 - this.y0;
    g.lineStyle(18, pl.wall, 0.12); g.strokeRect(this.x0, this.y0, w, h); // 바깥 빛
    g.lineStyle(5, pl.wall, 0.85); g.strokeRect(this.x0 + 3, this.y0 + 3, w - 6, h - 6); // 결계 벽
    g.fillStyle(pl.wall, 1);
    for (const [x, y] of [[this.x0, this.y0], [this.x1, this.y0], [this.x0, this.y1], [this.x1, this.y1]]) g.fillCircle(x, y, 14);
    // 장애물: 시작 자리 둘레는 비우고, 서로 겹치지 않게
    const rng = this.rng;
    const placed = [];
    for (const o of this.obstacles) {
      const kind = pl.decor[Math.floor(rng.next() * pl.decor.length)];
      const scale = rng.range(0.9, 1.4);
      o.r = this.cfg.obstacleRadius[kind] * scale;
      for (let t = 0; t < 12; t++) {
        o.x = rng.range(this.x0 + 60, this.x1 - 60);
        o.y = rng.range(this.y0 + 60, this.y1 - 60);
        const clear = Math.hypot(o.x, o.y) > this.cfg.startClear
          && placed.every((q) => Math.hypot(q.x - o.x, q.y - o.y) > q.r + o.r + 40);
        if (clear) break;
      }
      placed.push(o);
      o.img.setTexture(kind).setPosition(o.x, o.y).setTint(pl.light).setScale(scale).setFlipX(rng.next() < 0.5);
    }
  }

  /** 벽 안으로 (r = 몸 크기) */
  clamp(o, r = 0) {
    if (o.x < this.x0 + r) o.x = this.x0 + r; else if (o.x > this.x1 - r) o.x = this.x1 - r;
    if (o.y < this.y0 + r) o.y = this.y0 + r; else if (o.y > this.y1 - r) o.y = this.y1 - r;
    return o;
  }

  /** 장애물 밖으로 밀어내기 (벽처럼 미끄러지듯). 부딪혔으면 true */
  block(o, r) {
    let hit = false;
    for (let i = 0; i < this.obstacles.length; i++) {
      const b = this.obstacles[i];
      const dx = o.x - b.x;
      const dy = o.y - b.y;
      const min = r + b.r;
      const d2 = dx * dx + dy * dy;
      if (d2 >= min * min) continue;
      const d = Math.sqrt(d2) || 0.01;
      o.x = b.x + (dx / d) * min;
      o.y = b.y + (dy / d) * min;
      hit = true;
    }
    return hit;
  }

  /** (x,y)에서 dist 안에 장애물이 있나 (점프 버튼 반짝임) */
  obstacleNear(x, y, dist) {
    return this.obstacles.some((b) => Math.hypot(b.x - x, b.y - y) < b.r + dist);
  }

  /** 벽 안 + 장애물 밖 자리 (카드·보물상자 놓을 때) */
  freePoint(pt, margin = 40) {
    this.clamp(pt, margin);
    this.block(pt, 16);
    return this.clamp(pt, margin);
  }

  /**
   * 지금 화면에 보이는 범위. 카메라가 실제 그린 값(worldView)은 그리는 속도에 따라 달라지므로
   * 주인공 위치로 계산한다 (카메라는 주인공을 따라가고 벽에서 멈춘다) → 같은 시드 = 같은 판
   */
  viewRect() {
    const { width: VW, height: VH } = this.scene.scale.gameSize;
    const p = this.scene.player;
    const x = Math.min(this.x1 - VW, Math.max(this.x0, p.x - VW / 2));
    const y = Math.min(this.y1 - VH, Math.max(this.y0, p.y - VH / 2));
    return { x, y, right: x + VW, bottom: y + VH };
  }

  /** 요괴가 나올 자리: 화면 바로 바깥 둘레(벽 안), 장애물 밖. 벽 때문에 화면 안이 되면 다른 방향으로 다시 */
  spawnPoint(rng) {
    const ins = this.cfg.spawnInset;
    const v = this.viewRect();
    const p = this.scene.player;
    const { width: VW, height: VH } = this.scene.scale.gameSize;
    const ring = Math.hypot(VW / 2, VH / 2) + 60;
    let pt = null;
    for (let i = 0; i < 8; i++) {
      const a = rng.next() * Math.PI * 2;
      pt = this.clamp({ x: p.x + Math.cos(a) * ring, y: p.y + Math.sin(a) * ring }, ins);
      const out = pt.x < v.x - 30 || pt.x > v.right + 30 || pt.y < v.y - 30 || pt.y > v.bottom + 30;
      if (out) break;
    }
    this.block(pt, 18);
    return pt;
  }

  /** 다음 장소로 옮기기 (그동안 게임 시계는 멈춤) */
  travel() {
    const sc = this.scene;
    const cam = sc.cameras.main;
    const i = this.index + 1;
    sc.state = 'travel';
    sc.joystick.reset();
    sfx.play('travel');
    cam.fadeOut(this.cfg.fadeMs, 12, 16, 40);
    cam.once('camerafadeoutcomplete', () => {
      this.moveEverything(i);
      this.powerUp(i);
      cam.fadeIn(this.cfg.fadeMs, 12, 16, 40);
      sc.hud.banner(this.place.name, `${i + 1}번째 장소 · 주인공도 요괴도 강해졌다`);
      sc.time.delayedCall(this.cfg.fadeMs, () => { if (sc.state === 'travel') sc.state = 'play'; });
    });
  }

  /** 장소마다 강해짐: 주인공 공격력·최대 체력, 요괴 체력·공격력 */
  powerUp(i) {
    const sc = this.scene;
    const P = this.cfg.power;
    sc.book.damageMult *= (1 + P.playerDamage * i) / (1 + P.playerDamage * (i - 1));
    sc.player.bonusHp = P.playerHp * i;
    sc.book.applySupports();
    sc.player.heal(P.playerHp);
    sc.enemies.hpMult = sc.difficulty * (1 + P.enemyHp * i);
    sc.enemies.dmgMult = 1 + P.enemyDamage * i;
  }

  moveEverything(i) {
    const sc = this.scene;
    const rng = sc.rng;
    this.setPlace(i);
    this.placeStart = sc.clock.now;
    // 남은 요괴·탄은 사라짐
    const list = sc.enemies.pool.active;
    for (let k = list.length - 1; k >= 0; k--) sc.enemies.remove(list[k]);
    sc.enemyBullets.pool.active.slice().forEach((b) => sc.enemyBullets.free(b));
    sc.bosses.clearZones();
    // 바닥 구슬은 모두 영기로
    let xp = 0;
    for (const o of sc.orbs.pool.active.slice()) { xp += o.value; sc.orbs.free(o); }
    if (xp) sc.leveling.add(xp);
    // 주인공은 가운데로, 카드·보물상자는 새 장소 안 다른 자리로
    const p = sc.player;
    p.x = 0; p.y = 0;
    p.update(0, { x: 0, y: 0 }, sc.clock.now);
    for (const c of sc.fieldCards.list) if (c.card) sc.fieldCards.place(c, this.freePoint(this.randomPoint(rng, 200, 450)));
    for (const c of sc.chests.pool.active) { Object.assign(c, this.freePoint(this.randomPoint(rng, 120, 400))); c.sprite.setPosition(c.x, c.y); }
    sc.cameras.main.centerOn(0, 0);
  }

  /** 가운데에서 minD~maxD 떨어진 벽 안 한 점 */
  randomPoint(rng, minD, maxD) {
    const a = rng.next() * Math.PI * 2;
    const d = rng.range(minD, maxD);
    return this.clamp({ x: Math.cos(a) * d, y: Math.sin(a) * d }, 40);
  }
}
