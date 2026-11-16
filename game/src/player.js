// player.js — the salvage skiff: movement, the tractor net, the pulse
// blaster, and the upgrade state bought in the between-wave shop.

import { W, SEA_Y } from './art.js';

export const UPGRADES = [
  { id: 'net', name: 'Wider Net', desc: 'Tractor net +22 px each side', base: 120 },
  { id: 'magnet', name: 'Magnet Coil', desc: 'Shards drift toward your net', base: 150 },
  { id: 'shield', name: 'Aegis Shield', desc: 'Blocks one mine every wave', base: 200 },
  { id: 'blaster', name: 'Blaster Mk II', desc: 'Shots cost 1 energy, wider blast', base: 180 },
  { id: 'hull', name: 'Reinforced Hull', desc: '+1 max hull and repair 1', base: 160 },
  { id: 'thrusters', name: 'Ion Thrusters', desc: 'Skiff moves 25% faster', base: 130 },
];

export class Player {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = W / 2;
    this.vx = 0;
    this.hull = 3;
    this.maxHull = 3;
    this.energy = 60;
    this.score = 0;
    this.salvage = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.caught = 0;
    this.shotDown = 0;
    this.levels = { net: 0, magnet: 0, shield: 0, blaster: 0, hull: 0, thrusters: 0 };
    this.shieldReady = false;
    this.fireCooldown = 0;
    this.hurtFlash = 0;
  }

  get netHalfWidth() {
    return 58 + this.levels.net * 22;
  }

  get speed() {
    return 560 * (1 + this.levels.thrusters * 0.25);
  }

  get shotCost() {
    return this.levels.blaster > 0 ? 1 : 2;
  }

  get blastRadius() {
    return this.levels.blaster > 0 ? 46 : 30;
  }

  upgradeCost(def) {
    return Math.round(def.base * (1 + this.levels[def.id] * 0.7));
  }

  buy(def) {
    const cost = this.upgradeCost(def);
    if (this.salvage < cost) return false;
    this.salvage -= cost;
    this.levels[def.id] += 1;
    if (def.id === 'hull') {
      this.maxHull += 1;
      this.hull = Math.min(this.maxHull, this.hull + 1);
    }
    if (def.id === 'shield') this.shieldReady = true;
    return true;
  }

  startWave() {
    if (this.levels.shield > 0) this.shieldReady = true;
    this.fireCooldown = 0;
  }

  update(dt, input) {
    const accel = 3400;
    if (input.left) this.vx -= accel * dt;
    if (input.right) this.vx += accel * dt;
    if (input.mouseX !== null && input.mouseX !== undefined) {
      const dx = input.mouseX - this.x;
      this.vx += Math.max(-accel, Math.min(accel, dx * 14)) * dt;
    }
    if (!input.left && !input.right && (input.mouseX === null || input.mouseX === undefined)) {
      this.vx *= Math.pow(0.0001, dt); // strong glide damping
    }
    this.vx = Math.max(-this.speed, Math.min(this.speed, this.vx));
    this.x += this.vx * dt;
    this.x = Math.max(50, Math.min(W - 50, this.x));
    this.energy = Math.min(100, this.energy + dt * 2.2);
    this.fireCooldown = Math.max(0, this.fireCooldown - dt);
    this.hurtFlash = Math.max(0, this.hurtFlash - dt);
  }

  // The net catches at the waterline: returns the y of the net's catch line.
  get netY() {
    return SEA_Y - 42;
  }

  tryShoot() {
    if (this.fireCooldown > 0 || this.energy < this.shotCost) return false;
    this.energy -= this.shotCost;
    this.fireCooldown = 0.22;
    return true;
  }

  addCatch(gold) {
    this.combo += 1;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    this.caught += 1;
    const mult = Math.min(3, 1 + this.combo * 0.1);
    const points = Math.round((gold ? 150 : 10) * mult);
    this.score += points;
    this.salvage += gold ? 6 : 2;
    this.energy = Math.min(100, this.energy + (gold ? 10 : 2));
    return points;
  }

  breakCombo() {
    this.combo = 0;
  }

  // Returns 'shield', 'hurt' or 'dead'.
  hitMine() {
    this.breakCombo();
    if (this.shieldReady) {
      this.shieldReady = false;
      return 'shield';
    }
    this.hull -= 1;
    this.hurtFlash = 0.5;
    return this.hull <= 0 ? 'dead' : 'hurt';
  }
}
