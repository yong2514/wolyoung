import { SOUNDS } from '../config/assets.js';
import { settings } from './settings.js';

// 효과음: 파일 없이 Web Audio로 합성한다. 목록은 config/assets.js의 SOUNDS.
// 모바일은 첫 터치 전엔 소리를 못 내므로 unlock()을 터치 때 부른다.

/** 합성 방법: 파형, 시작·끝 높이(Hz), 길이(초), 크기, 잡음 섞기 */
const RECIPES = {
  shoot: { type: 'triangle', f0: 1400, f1: 2200, dur: 0.06, vol: 0.035 },
  hit: { type: 'square', f0: 320, f1: 140, dur: 0.045, vol: 0.025, noise: 0.4 },
  kill: { type: 'triangle', f0: 600, f1: 1200, dur: 0.1, vol: 0.06 },
  hurt: { type: 'sawtooth', f0: 200, f1: 70, dur: 0.22, vol: 0.1, noise: 0.5 },
  gameover: { type: 'sine', f0: 440, f1: 110, dur: 0.9, vol: 0.14 },
};

const LIMIT = { perSound: 4, total: 14, minGap: 0.035 }; // 같은 소리 동시 4개, 전체 14개, 같은 소리 간격 35ms

class Sfx {
  constructor() {
    this.ctx = null;
    this.active = {};
    this.total = 0;
    this.last = {};
  }

  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(this.ctx.destination);
      const len = Math.floor(this.ctx.sampleRate * 0.5);
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      let s = 12345; // 잡음도 고정된 수열로 만든다
      for (let i = 0; i < len; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; d[i] = s / 0x3fffffff - 1; }
    }
    this.resume();
  }

  /** 다른 앱에서 돌아왔을 때 다시 켠다 */
  resume() {
    if (this.ctx && this.ctx.state !== 'running' && !document.hidden) this.ctx.resume().catch(() => {});
  }

  play(name) {
    const ctx = this.ctx;
    if (!settings.sound || !ctx || ctx.state !== 'running') return;
    if (SOUNDS[name]) return; // 파일로 바꾼 소리는 9단계에서 재생 연결
    const r = RECIPES[name];
    if (!r) return;
    const t = ctx.currentTime;
    if ((this.active[name] || 0) >= LIMIT.perSound || this.total >= LIMIT.total) return;
    if (this.last[name] && t - this.last[name] < LIMIT.minGap) return;
    this.last[name] = t;

    const g = ctx.createGain();
    g.gain.setValueAtTime(r.vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + r.dur);
    g.connect(this.master);

    const o = ctx.createOscillator();
    o.type = r.type;
    o.frequency.setValueAtTime(r.f0, t);
    o.frequency.exponentialRampToValueAtTime(r.f1, t + r.dur);
    o.connect(g);
    o.start(t);
    o.stop(t + r.dur + 0.02);

    if (r.noise) {
      const n = ctx.createBufferSource();
      n.buffer = this.noise;
      const ng = ctx.createGain();
      ng.gain.value = r.noise;
      n.connect(ng);
      ng.connect(g);
      n.start(t, 0, r.dur);
    }

    this.active[name] = (this.active[name] || 0) + 1;
    this.total++;
    o.onended = () => { this.active[name]--; this.total--; g.disconnect(); };
  }
}

export const sfx = new Sfx();
