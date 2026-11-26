// 공간 격자: 화면 주변을 칸으로 나눠, 가까운 칸에 있는 것만 검사한다.
// 매 프레임 reset() → insert()로 다시 채운다. 격자 밖(멀리 있는) 요괴는 inGrid=false.

export class SpatialGrid {
  constructor(cell, cols, rows, maxItems) {
    this.cell = cell;
    this.cols = cols;
    this.rows = rows;
    this.maxItems = maxItems;
    this.head = new Int32Array(cols * rows);
    this.next = new Int32Array(maxItems);
    this.items = new Array(maxItems).fill(null);
    this.n = 0;
    this.ox = 0;
    this.oy = 0;
    this.buf = [];
  }

  reset(ox, oy) {
    this.ox = ox;
    this.oy = oy;
    this.head.fill(-1);
    for (let i = 0; i < this.n; i++) this.items[i] = null;
    this.n = 0;
  }

  insert(o) {
    const cx = Math.floor((o.x - this.ox) / this.cell);
    const cy = Math.floor((o.y - this.oy) / this.cell);
    if (cx < 0 || cy < 0 || cx >= this.cols || cy >= this.rows || this.n >= this.maxItems) {
      o.inGrid = false;
      return;
    }
    const c = cy * this.cols + cx;
    const i = this.n++;
    this.items[i] = o;
    this.next[i] = this.head[c];
    this.head[c] = i;
    o.inGrid = true;
  }

  /** (x,y) 둘레 r 안의 칸에 든 것을 out에 담고 개수를 돌려준다 (거리는 부르는 쪽이 다시 잰다) */
  queryInto(x, y, r, out) {
    const cs = this.cell;
    const x0 = Math.max(0, Math.floor((x - r - this.ox) / cs));
    const x1 = Math.min(this.cols - 1, Math.floor((x + r - this.ox) / cs));
    const y0 = Math.max(0, Math.floor((y - r - this.oy) / cs));
    const y1 = Math.min(this.rows - 1, Math.floor((y + r - this.oy) / cs));
    let k = 0;
    for (let cy = y0; cy <= y1; cy++) {
      for (let cx = x0; cx <= x1; cx++) {
        for (let i = this.head[cy * this.cols + cx]; i !== -1; i = this.next[i]) out[k++] = this.items[i];
      }
    }
    return k;
  }

  /** 가장 가까운 살아 있는 것 (maxR 안) */
  nearest(x, y, maxR) {
    const n = this.queryInto(x, y, maxR, this.buf);
    let best = null;
    let bestD = maxR * maxR;
    for (let i = 0; i < n; i++) {
      const o = this.buf[i];
      if (!o.alive) continue;
      const dx = o.x - x;
      const dy = o.y - y;
      const d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; best = o; }
    }
    return best;
  }
}
