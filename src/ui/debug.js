import { SPELLS, FUSIONS } from '../data/spells.js';
import { BALANCE } from '../config/balance.js';
import { writeSave } from '../systems/save.js';

// 디버그 패널 (?debug=1). 화면 위 HTML 버튼. 글자는 textContent로만 넣는다.
// 웨이브 건너뛰기·즉시 레벨업·선옥·인연·첫 판 다시 보기는 해당 단계에서 붙인다.
export class DebugPanel {
  constructor(scene) {
    this.scene = scene;
    const root = document.createElement('div');
    root.style.cssText = 'position:fixed;left:calc(env(safe-area-inset-left) + 4px);top:calc(env(safe-area-inset-top) + 240px);'
      + 'z-index:10;font:12px system-ui,sans-serif;color:#dfe4f2;background:rgba(11,15,38,.7);'
      + 'padding:4px;border-radius:6px;max-width:220px;user-select:none;';
    this.info = document.createElement('div');
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;margin-top:4px;';
    root.append(this.info, row);

    const btn = (text, fn) => {
      const b = document.createElement('button');
      b.textContent = text;
      b.style.cssText = 'font:12px system-ui,sans-serif;padding:6px 8px;min-height:32px;border-radius:5px;'
        + 'border:1px solid #b9a6e8;background:#2a3370;color:#dfe4f2;';
      b.addEventListener('click', (e) => { e.stopPropagation(); fn(b); });
      row.append(b);
      return b;
    };
    const godLabel = () => (scene.god ? '무적: 켜짐' : '무적: 꺼짐');
    btn(godLabel(), (b) => { scene.god = !scene.god; b.textContent = godLabel(); });
    btn('잡귀 150', () => scene.enemies.fill(150 - scene.enemies.count, scene.clock.now));
    // 대형 요괴로 건너뛰기: 대형 요괴가 없으면 이 장소의 1분을 끝내고, 있으면 쓰러뜨린다 (→ 다음 장소)
    btn('대형 요괴로', () => {
      const b = scene.bosses.current;
      if (b?.alive) scene.enemies.hit(b, b.hp + 1, scene.clock.now);
      else scene.arena.placeStart = scene.clock.now - BALANCE.arena.placeSec * 1000;
    });
    btn('레벨업', () => { scene.leveling.pending++; });
    // 합일 준비: 누를 때마다 다음 합일의 재료 두 법술을 최대로 올리고 레벨업 → 합일 카드가 나온다 (칸 제한 무시)
    let fi = 0;
    const fusionLabel = () => `합일 준비: ${SPELLS[FUSIONS[fi % FUSIONS.length]].name}`;
    btn(fusionLabel(), (b) => {
      const key = FUSIONS[fi % FUSIONS.length];
      for (const part of SPELLS[key].fusion) {
        scene.book.fusedParts.delete(part);
        scene.book.learn(part, scene.book.maxLevel(part));
      }
      scene.leveling.pending++;
      fi++;
      b.textContent = fusionLabel();
    });
    btn('체력 회복', () => { scene.player.hp = scene.player.maxHp; });
    btn('새 판', () => scene.scene.restart());
    // 첫 판 다시 보기: 이 기기의 '첫 판을 했다' 기록을 지우고 디버그 없이 다시 연다 → 첫 판 각본
    btn('첫 판 다시 보기', () => {
      scene.save.firstRunDone = false;
      scene.save.runs = 0;
      writeSave(scene.save);
      location.href = location.pathname;
    });
    const fold = btn('접기', () => {
      const hide = row.dataset.folded !== '1';
      row.dataset.folded = hide ? '1' : '0';
      [...row.children].forEach((c) => { if (c !== fold) c.style.display = hide ? 'none' : ''; });
      fold.textContent = hide ? '펴기' : '접기';
    });

    document.body.append(root);
    this.root = root;
    this.frames = 0;
  }

  update() {
    if (++this.frames % 15) return;
    const sc = this.scene;
    const fps = Math.round(sc.perf.fps);
    this.info.textContent = `프레임 ${fps} · 요괴 ${sc.enemies.count}/${sc.enemies.cap}`
      + ` · 조각 x${sc.effects.particleScale} · 시드 ${sc.seed}`;
  }

  destroy() { this.root.remove(); }
}
