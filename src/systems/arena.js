import { BALANCE } from '../config/balance.js';
import { sfx } from './audio.js';

// 활동 공간 (사용자 요청): 결계 벽으로 둘러싼 장소 하나. 가운데가 (0,0).
// 주인공·요괴·카드는 벽 안에만 있고, 카메라도 벽에서 멈춘다.
// 시간이 지나면(places[].atSec) 다음 장소로 옮겨 간다: 화면이 어두워졌다 밝아지고, 남은 요괴는 사라지고,
// 바닥 구슬은 영기로 받고, 카드·보물상자·보스는 새 장소 안으로 옮겨진다.
export class Arena {
  constructor(scene) {
    this.scene = scene;
    this.cfg = BALANCE.arena;
    const { width, height } = this.cfg;
    this.x0 = -width / 2; this.x1 = width / 2;
    this.y0 = -height / 2; this.y1 = height / 2;
    this.index = -1;
    scene.cameras.main.setBounds(this.x0, this.y0, width, height);
    this.wall = scene.add.graphics().setDepth(3);
    this.decor = [];
    for (let i = 0; i < this.cfg.decor; i++) this.decor.push(scene.add.image(0, 0, 'decorRock').setDepth(-5));
    this.setPlace(0);
  }

  get place() { return this.cfg.places[this.index]; }

  get next() { return this.cfg.places[this.index + 1]; }

  /** 장소 모습 바꾸기: 바닥 색, 벽, 장식 */
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
    // 장식은 화면 효과 난수로 (게임 흐름에 영향 없음)
    const rng = sc.fxRng;
    const kinds = ['decorRock', 'decorLotus', 'decorGrass'];
    for (const d of this.decor) {
      d.setTexture(kinds[Math.floor(rng.next() * kinds.length)])
        .setPosition(rng.range(this.x0 + 40, this.x1 - 40), rng.range(this.y0 + 40, this.y1 - 40))
        .setTint(pl.decor).setAlpha(0.55).setScale(rng.range(0.8, 1.5)).setFlipX(rng.next() < 0.5);
    }
  }

  /** 벽 안으로 (r = 몸 크기) */
  clamp(o, r = 0) {
    if (o.x < this.x0 + r) o.x = this.x0 + r; else if (o.x > this.x1 - r) o.x = this.x1 - r;
    if (o.y < this.y0 + r) o.y = this.y0 + r; else if (o.y > this.y1 - r) o.y = this.y1 - r;
    return o;
  }

  /** 요괴가 나올 자리: 벽 안쪽 띠 위, 되도록 화면 밖 */
  spawnPoint(rng) {
    const ins = this.cfg.spawnInset;
    const v = this.scene.cameras.main.worldView;
    let pt = null;
    for (let i = 0; i < 6; i++) {
      const side = Math.floor(rng.next() * 4);
      const t = rng.next();
      pt = side === 0 ? { x: this.x0 + ins, y: this.y0 + t * (this.y1 - this.y0) }
        : side === 1 ? { x: this.x1 - ins, y: this.y0 + t * (this.y1 - this.y0) }
          : side === 2 ? { x: this.x0 + t * (this.x1 - this.x0), y: this.y0 + ins }
            : { x: this.x0 + t * (this.x1 - this.x0), y: this.y1 - ins };
      const out = pt.x < v.x - 40 || pt.x > v.right + 40 || pt.y < v.y - 40 || pt.y > v.bottom + 40;
      if (out) return pt;
    }
    return pt;
  }

  /** 매 걸음: 다음 장소로 갈 때가 됐으면 true (옮기기 시작) */
  update(now) {
    const n = this.next;
    if (!n || now < n.atSec * 1000) return false;
    this.travel(this.index + 1);
    return true;
  }

  /** 다음 장소로 옮기기 (그동안 게임 시계는 멈춤) */
  travel(i) {
    const sc = this.scene;
    const cam = sc.cameras.main;
    sc.state = 'travel';
    sc.joystick.reset();
    sfx.play('travel');
    cam.fadeOut(this.cfg.fadeMs, 12, 16, 40);
    cam.once('camerafadeoutcomplete', () => {
      this.moveEverything(i);
      cam.fadeIn(this.cfg.fadeMs, 12, 16, 40);
      // 장소 이름 + 이때 시작하는 웨이브 (웨이브 알림은 이 알림에 합친다: waves.startWave)
      const wi = Math.floor(this.place.atSec / BALANCE.waves.waveSec);
      const w = BALANCE.waves.list[wi];
      sc.hud.banner(this.place.name, `${i + 1}번째 장소${w ? ` · 웨이브 ${wi + 1} ${w.label}` : ''}`);
      sc.time.delayedCall(this.cfg.fadeMs, () => { if (sc.state === 'travel') sc.state = 'play'; });
    });
  }

  moveEverything(i) {
    const sc = this.scene;
    const rng = sc.rng;
    this.setPlace(i);
    // 남은 요괴·탄은 사라짐 (보스는 따라옴)
    const list = sc.enemies.pool.active;
    for (let k = list.length - 1; k >= 0; k--) {
      const e = list[k];
      if (e.def.boss) { Object.assign(e, this.spawnPoint(rng)); e.ai.st = 'chase'; e.warn.setVisible(false); continue; }
      sc.enemies.remove(e);
    }
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
    for (const c of sc.fieldCards.list) if (c.card) sc.fieldCards.place(c, this.randomPoint(rng, 200, 450));
    for (const c of sc.chests.pool.active) { Object.assign(c, this.randomPoint(rng, 120, 400)); c.sprite.setPosition(c.x, c.y); }
    sc.cameras.main.centerOn(0, 0);
  }

  /** 가운데에서 minD~maxD 떨어진 벽 안 한 점 */
  randomPoint(rng, minD, maxD) {
    const a = rng.next() * Math.PI * 2;
    const d = rng.range(minD, maxD);
    return this.clamp({ x: Math.cos(a) * d, y: Math.sin(a) * d }, 40);
  }
}
