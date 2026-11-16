// main.js — Starfall Salvage: the state machine and the loop.
// States: title -> play -> shop (between waves) -> play ... -> end
// (victory when wave 10 is cleared, game over when the hull is gone).
// The simulation advances in fixed steps from a seeded RNG, and ?shot=
// stages the three scenes the screenshots are taken from.

import { W, H, SEA_Y, drawBackground, drawSkiff } from './art.js';
import { Sound } from './audio.js';
import { Player, UPGRADES } from './player.js';
import { World, FINAL_WAVE } from './world.js';
import { drawHUD, drawTitle, drawShop, drawEnd, drawPaused, buttons } from './ui.js';

const params = new URLSearchParams(location.search);
const SHOT = params.get('shot');
const SEED = Number(params.get('seed') ?? '1') || 1;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const sound = new Sound();
const player = new Player();
const world = new World(SEED * 7919 + 13);

let state = 'title'; // title | play | shop | end
let victory = false;
let paused = false;
let offers = [];
let simTime = 0;

const input = { left: false, right: false, fire: false, mouseX: null };

function pickOffers() {
  const pool = [...UPGRADES];
  offers = [];
  for (let i = 0; i < 3; i++) {
    const idx = Math.floor(world.rng() * pool.length);
    offers.push(pool.splice(idx, 1)[0]);
  }
}

function startRun() {
  player.reset();
  victory = false;
  paused = false;
  world.startWave(1);
  player.startWave();
  state = 'play';
}

function nextWave() {
  world.startWave(world.wave + 1);
  player.startWave();
  state = 'play';
}

function endRun(won) {
  victory = won;
  state = 'end';
  if (won) sound.waveClear();
  else sound.gameOver();
}

function handleEvents(events) {
  for (const ev of events) {
    if (ev === 'catch') sound.catchShard(player.combo);
    else if (ev === 'gold') sound.catchGold();
    else if (ev === 'splash') {
      player.breakCombo();
      sound.splash();
    } else if (ev === 'boltFired') sound.shoot();
    else if (ev === 'mineShot') sound.tone(240, 0.2, 'sawtooth', 0.12, 60);
    else if (ev === 'pickup') sound.tone(740, 0.14, 'sine', 0.12, 990);
    else if (ev === 'mineHit') {
      const result = player.hitMine();
      if (result === 'shield') sound.shieldBlock();
      else sound.explosion();
      if (result === 'dead') {
        endRun(false);
        return;
      }
    }
  }
}

function stepPlay(dt) {
  const events = [];
  player.update(dt, input);
  world.update(dt, player, input, events);
  handleEvents(events);
  if (state === 'play' && world.waveDone) {
    if (world.wave >= FINAL_WAVE) endRun(true);
    else {
      sound.waveClear();
      pickOffers();
      state = 'shop';
    }
  }
}

// A simple autopilot used only by the staged play screenshot: steer for the
// lowest shard, fire at mines overhead. The real game is keyboard/mouse.
function autopilot(dt) {
  let target = null;
  let bestY = -1;
  for (const it of world.items) {
    if (it.kind === 'shard' && it.y > bestY) {
      bestY = it.y;
      target = it;
    }
  }
  input.mouseX = target ? target.x : W / 2;
  input.fire = world.items.some((it) => it.kind === 'mine' && Math.abs(it.x - player.x) < 30 && it.y > 120 && it.y < 420);
}

function stageShot() {
  if (SHOT === 'start') {
    state = 'title';
    // decorative shards drifting over the title
    for (let i = 0; i < 7; i++) {
      world.items.push({
        kind: 'shard', gold: i === 3, x: 120 + i * 160, y: 60 + (i % 3) * 90,
        vx: 0, vy: 26, size: 13, rot: i, vr: 0.6, sway: 0,
      });
    }
  } else if (SHOT === 'play') {
    player.score = 1240;
    player.salvage = 86;
    player.combo = 6;
    player.bestCombo = 9;
    player.caught = 34;
    player.energy = 72;
    player.levels.net = 1;
    player.levels.magnet = 1;
    player.x = 470;
    world.startWave(3);
    world.caughtThisWave = 9;
    player.startWave();
    const preset = [
      ['shard', 380, 130, false], ['shard', 520, 260, false], ['shard', 700, 90, false],
      ['shard', 455, 430, false], ['gold', 610, 350, true], ['mine', 830, 210, false],
      ['mine', 300, 330, false], ['shard', 905, 470, false], ['cell', 190, 180, false],
      ['shard', 1010, 120, false], ['mine', 560, 60, false],
    ];
    for (const [kind, x, y, gold] of preset) {
      world.items.push({
        kind: kind === 'gold' ? 'shard' : kind, gold, x, y,
        vx: 0, vy: 150, size: kind === 'mine' ? 17 : 13, rot: x % 3, vr: 0.8, sway: 0,
      });
    }
    world.bolts.push({ x: 470, y: 300, vy: -860 });
    world.burst(610, 350, '#7fe7ff', 8, 150);
    state = 'play';
  } else if (SHOT === 'end') {
    player.score = 4870;
    player.salvage = 140;
    player.caught = 132;
    player.shotDown = 18;
    player.bestCombo = 14;
    player.hull = 0;
    world.startWave(7);
    endRun(false);
  }
}

function activate(id) {
  sound.ensure();
  if (id === 'start' || id === 'restart') startRun();
  else if (id === 'next') nextWave();
  else if (id && id.startsWith('buy:')) {
    const def = UPGRADES.find((u) => u.id === id.slice(4));
    if (def && player.buy(def)) sound.buy();
    else sound.deny();
  }
}

addEventListener('keydown', (e) => {
  sound.ensure();
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') input.left = true;
  if (e.code === 'ArrowRight' || e.code === 'KeyD') input.right = true;
  if (e.code === 'Space') {
    input.fire = true;
    e.preventDefault();
  }
  if (e.code === 'KeyM') sound.muted = !sound.muted;
  if (e.code === 'KeyP' && state === 'play') paused = !paused;
  if (e.code === 'Enter') {
    if (state === 'title') activate('start');
    else if (state === 'shop') activate('next');
    else if (state === 'end') activate('restart');
  }
  if (e.code === 'KeyR' && state === 'end') activate('restart');
  if (state === 'shop' && ['Digit1', 'Digit2', 'Digit3'].includes(e.code)) {
    const def = offers[Number(e.code.slice(-1)) - 1];
    if (def) activate(`buy:${def.id}`);
  }
});
addEventListener('keyup', (e) => {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') input.left = false;
  if (e.code === 'ArrowRight' || e.code === 'KeyD') input.right = false;
  if (e.code === 'Space') input.fire = false;
});

function canvasPos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * W,
    y: ((e.clientY - rect.top) / rect.height) * H,
  };
}
canvas.addEventListener('mousemove', (e) => {
  input.mouseX = canvasPos(e).x;
});
canvas.addEventListener('mousedown', (e) => {
  sound.ensure();
  const { x, y } = canvasPos(e);
  const hit = buttons.find((b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h);
  if (hit) activate(hit.id);
  else if (state === 'play') input.fire = true;
});
addEventListener('mouseup', () => {
  if (state === 'play') input.fire = false;
});

if (SHOT) stageShot();

let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  let dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  // fixed-step simulation (120 Hz substeps cap the per-frame work)
  while (dt > 0) {
    const step = Math.min(dt, 1 / 120);
    dt -= step;
    simTime += step;
    if (state === 'play' && !paused) {
      if (SHOT === 'play') autopilot(step);
      stepPlay(step);
    } else if (state === 'title') {
      // title sky stays alive: decorative items drift down and wrap
      for (const it of world.items) {
        it.y += it.vy * step;
        it.rot += it.vr * step;
        if (it.y > SEA_Y - 60) it.y = -20;
      }
    }
  }
  sound.updatePad(Math.min(0.1, (now - last) / 1000 + 0.016), state === 'play');

  ctx.save();
  if (world.shake > 0) {
    ctx.translate((Math.random() - 0.5) * world.shake, (Math.random() - 0.5) * world.shake);
  }
  drawBackground(ctx, simTime, world.storm && state !== 'title');
  world.draw(ctx, simTime);
  if (state === 'play' || state === 'shop' || (state === 'end' && victory)) {
    drawSkiff(ctx, player.x, simTime, player.netHalfWidth, player.shieldReady, player.vx / player.speed);
  }
  ctx.restore();
  if (player.hurtFlash > 0) {
    ctx.fillStyle = `rgba(255, 60, 60, ${player.hurtFlash * 0.35})`;
    ctx.fillRect(0, 0, W, H);
  }
  buttons.length = 0;
  if (state === 'title') drawTitle(ctx, simTime);
  else if (state === 'shop') {
    drawHUD(ctx, player, world);
    drawShop(ctx, player, offers);
  } else if (state === 'end') drawEnd(ctx, player, world, victory);
  else {
    drawHUD(ctx, player, world);
    if (paused) drawPaused(ctx);
  }
}
requestAnimationFrame(frame);
