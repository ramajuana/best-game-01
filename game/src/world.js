// world.js — falling things, waves and weather. Shards to catch, mines to
// dodge or shoot, pickups, pulse bolts, particles and splash rings. The
// world is driven by a seeded RNG and a fixed step, so a seed always
// produces the same sky.

import { W, H, SEA_Y, mulberry32, drawShard, drawMine, drawPickup } from './art.js';

export const FINAL_WAVE = 10;

export class World {
  constructor(seed) {
    this.rng = mulberry32(seed);
    this.items = []; // {kind: shard|mine|cell|heart, x,y,vx,vy,size,rot,vr,gold}
    this.bolts = []; // {x, y, vy}
    this.particles = []; // {x,y,vx,vy,life,maxLife,color,size}
    this.floaters = []; // {x,y,life,text,color}
    this.wave = 0;
    this.spawnTimer = 0;
    this.toCatch = 0;
    this.caughtThisWave = 0;
    this.time = 0;
    this.shake = 0;
    this.wind = 0;
  }

  get storm() {
    return this.wave % 3 === 0 && this.wave > 0;
  }

  get waveDone() {
    return this.caughtThisWave >= this.toCatch;
  }

  startWave(wave) {
    this.wave = wave;
    this.caughtThisWave = 0;
    this.toCatch = 12 + wave * 4;
    this.spawnTimer = 0.4;
    this.items.length = 0;
    this.bolts.length = 0;
  }

  spawnInterval() {
    return Math.max(0.34, 0.92 - this.wave * 0.055);
  }

  fallSpeed() {
    return 120 + this.wave * 16;
  }

  mineChance() {
    return Math.min(0.34, 0.10 + this.wave * 0.026);
  }

  spawn(player) {
    const r = this.rng();
    let kind = 'shard';
    if (r < this.mineChance()) kind = 'mine';
    else if (r < this.mineChance() + 0.045) kind = 'cell';
    else if (r < this.mineChance() + 0.055 && player.hull < player.maxHull) kind = 'heart';
    const gold = kind === 'shard' && this.rng() < 0.07;
    const x = 40 + this.rng() * (W - 80);
    this.items.push({
      kind,
      gold,
      x,
      y: -30,
      vx: (this.rng() - 0.5) * 30,
      vy: this.fallSpeed() * (0.85 + this.rng() * 0.4),
      size: kind === 'mine' ? 17 : 13,
      rot: this.rng() * Math.PI,
      vr: (this.rng() - 0.5) * 2.4,
      sway: this.rng() * Math.PI * 2,
    });
  }

  burst(x, y, color, n, speed) {
    for (let i = 0; i < n; i++) {
      const a = this.rng() * Math.PI * 2;
      const v = speed * (0.3 + this.rng() * 0.7);
      this.particles.push({
        x, y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 40,
        life: 0,
        maxLife: 0.45 + this.rng() * 0.4,
        color,
        size: 2 + this.rng() * 3,
      });
    }
  }

  floater(x, y, text, color) {
    this.floaters.push({ x, y, life: 0, text, color });
  }

  // Advances the world one fixed step. `events` collects what happened so
  // main.js can play sounds and update the player: catch, gold, splash,
  // mineHit, mineShot, pickup, boltFired.
  update(dt, player, input, events) {
    this.time += dt;
    this.shake = Math.max(0, this.shake - dt * 26);
    this.wind = this.storm ? Math.sin(this.time * 0.7) * 66 + Math.sin(this.time * 2.3) * 22 : 0;

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && !this.waveDone) {
      this.spawn(player);
      this.spawnTimer = this.spawnInterval() * (0.7 + this.rng() * 0.6);
    }

    if (input.fire && player.tryShoot()) {
      this.bolts.push({ x: player.x, y: SEA_Y - 30, vy: -860 });
      events.push('boltFired');
    }

    // bolts rise and can detonate mines
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      const bolt = this.bolts[i];
      bolt.y += bolt.vy * dt;
      let spent = bolt.y < -20;
      for (let j = this.items.length - 1; j >= 0 && !spent; j--) {
        const it = this.items[j];
        if (it.kind !== 'mine') continue;
        const dx = it.x - bolt.x;
        const dy = it.y - bolt.y;
        if (dx * dx + dy * dy < player.blastRadius * player.blastRadius) {
          this.items.splice(j, 1);
          this.burst(it.x, it.y, '#ffb36b', 16, 260);
          this.floater(it.x, it.y, '+15', '#ffd257');
          player.score += 15;
          player.shotDown += 1;
          events.push('mineShot');
          spent = true;
        }
      }
      if (spent) this.bolts.splice(i, 1);
    }

    const netHalf = player.netHalfWidth;
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.vy += dt * 26; // gentle gravity
      it.x += (it.vx + this.wind * (it.kind === 'mine' ? 0.4 : 1)) * dt;
      it.y += it.vy * dt;
      it.rot += it.vr * dt;
      // magnet coil: shards bend toward the net as they near it
      if (it.kind === 'shard' && player.levels.magnet > 0 && it.y > 380) {
        const dx = player.x - it.x;
        if (Math.abs(dx) < 190) it.x += dx * dt * 2.6;
      }
      it.x = Math.max(16, Math.min(W - 16, it.x));

      const caught = it.y >= player.netY && it.y <= SEA_Y + 6 && Math.abs(it.x - player.x) <= netHalf + it.size * 0.4;
      if (caught) {
        this.items.splice(i, 1);
        if (it.kind === 'shard') {
          const pts = player.addCatch(it.gold);
          this.caughtThisWave += 1;
          this.burst(it.x, it.y, it.gold ? '#ffd257' : '#7fe7ff', it.gold ? 18 : 10, 170);
          this.floater(it.x, it.y - 14, `+${pts}`, it.gold ? '#ffd257' : '#bdefff');
          events.push(it.gold ? 'gold' : 'catch');
        } else if (it.kind === 'mine') {
          this.burst(it.x, it.y, '#ff8a5d', 24, 320);
          this.shake = 14;
          events.push('mineHit');
        } else {
          if (it.kind === 'cell') {
            player.energy = Math.min(100, player.energy + 25);
            this.floater(it.x, it.y - 14, '+25 energy', '#7dff9a');
          } else {
            player.hull = Math.min(player.maxHull, player.hull + 1);
            this.floater(it.x, it.y - 14, '+1 hull', '#ff7d9c');
          }
          this.burst(it.x, it.y, '#baffd0', 10, 150);
          events.push('pickup');
        }
        continue;
      }
      if (it.y > SEA_Y + 26) {
        this.items.splice(i, 1);
        if (it.kind === 'shard') {
          this.burst(it.x, SEA_Y + 10, '#9fd8ef', 7, 90);
          events.push('splash');
        }
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.life += dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += 300 * dt;
      if (pt.life >= pt.maxLife) this.particles.splice(i, 1);
    }
    for (let i = this.floaters.length - 1; i >= 0; i--) {
      const f = this.floaters[i];
      f.life += dt;
      f.y -= 34 * dt;
      if (f.life > 0.9) this.floaters.splice(i, 1);
    }
  }

  draw(ctx, t) {
    for (const bolt of this.bolts) {
      ctx.fillStyle = '#ffe9a8';
      ctx.shadowColor = '#ffd257';
      ctx.shadowBlur = 10;
      ctx.fillRect(bolt.x - 2.5, bolt.y - 14, 5, 20);
      ctx.shadowBlur = 0;
    }
    for (const it of this.items) {
      if (it.kind === 'shard') drawShard(ctx, it.x, it.y, it.size, it.rot, it.gold, t);
      else if (it.kind === 'mine') drawMine(ctx, it.x, it.y, it.size, t);
      else drawPickup(ctx, it.x, it.y, it.kind, t);
    }
    for (const pt of this.particles) {
      ctx.globalAlpha = 1 - pt.life / pt.maxLife;
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
    }
    ctx.globalAlpha = 1;
    ctx.font = '700 17px system-ui, sans-serif';
    ctx.textAlign = 'center';
    for (const f of this.floaters) {
      ctx.globalAlpha = 1 - f.life / 0.9;
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  }
}
