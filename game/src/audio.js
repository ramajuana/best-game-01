// audio.js — all sound is synthesized with WebAudio: catch chimes that climb
// with the combo, mine explosions, blaster pulses, shop chimes and a slow
// ambient pad. No audio files, nothing loads over the network.

export class Sound {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.padTimer = 0;
  }

  ensure() {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch {
        this.ctx = null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  tone(freq, dur, type, vol, slideTo) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  noise(dur, vol, low) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = low;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(filter).connect(gain).connect(this.ctx.destination);
    src.start(t0);
  }

  catchShard(combo) {
    const base = 520 * Math.pow(1.059, Math.min(combo, 16));
    this.tone(base, 0.12, 'sine', 0.16);
    this.tone(base * 1.5, 0.16, 'sine', 0.1);
  }

  catchGold() {
    this.tone(880, 0.12, 'triangle', 0.16);
    setTimeout(() => this.tone(1174, 0.14, 'triangle', 0.16), 60);
    setTimeout(() => this.tone(1568, 0.2, 'triangle', 0.14), 120);
  }

  splash() {
    this.noise(0.18, 0.1, 900);
  }

  shoot() {
    this.tone(720, 0.14, 'square', 0.07, 160);
  }

  explosion() {
    this.noise(0.5, 0.32, 500);
    this.tone(90, 0.4, 'sine', 0.25, 40);
  }

  shieldBlock() {
    this.tone(300, 0.2, 'triangle', 0.18, 520);
  }

  buy() {
    this.tone(660, 0.1, 'triangle', 0.15);
    setTimeout(() => this.tone(990, 0.16, 'triangle', 0.15), 70);
  }

  deny() {
    this.tone(180, 0.16, 'square', 0.1);
  }

  waveClear() {
    for (let i = 0; i < 4; i++) {
      setTimeout(() => this.tone(523 * Math.pow(1.26, i), 0.16, 'triangle', 0.13), i * 80);
    }
  }

  gameOver() {
    for (let i = 0; i < 4; i++) {
      setTimeout(() => this.tone(392 * Math.pow(0.84, i), 0.24, 'triangle', 0.14), i * 130);
    }
  }

  // A slow two-note pad that drifts under the play, called every frame.
  updatePad(dt, active) {
    if (!this.ctx || this.muted || !active) return;
    this.padTimer -= dt;
    if (this.padTimer <= 0) {
      this.padTimer = 3.6;
      const root = [196, 220, 174, 196][Math.floor(Math.random() * 4)];
      this.tone(root, 3.4, 'sine', 0.035);
      this.tone(root * 1.5, 3.4, 'sine', 0.022);
    }
  }
}
