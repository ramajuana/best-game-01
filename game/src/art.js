// art.js — palette and canvas drawing helpers for Starfall Salvage.
// Everything is drawn in code: gradient dusk sky, parallax ridge lines, a
// shimmering sea, and the game's shapes (skiff, shards, mines, pickups).

export const W = 1280;
export const H = 800;
export const SEA_Y = 692; // the waterline the skiff rides

export const PALETTE = {
  skyTop: '#1b2340',
  skyMid: '#3a2f5a',
  skyLow: '#8a4a6b',
  sun: '#ffb36b',
  seaTop: '#274b63',
  seaDeep: '#12283d',
  shard: '#7fe7ff',
  shardCore: '#e8fbff',
  gold: '#ffd257',
  mine: '#2c2f3a',
  mineSpike: '#565d75',
  mineLight: '#ff5d5d',
  cell: '#7dff9a',
  heart: '#ff7d9c',
  hull: '#e8ecf4',
  accent: '#ffb36b',
  panel: 'rgba(10, 14, 26, 0.78)',
  panelEdge: 'rgba(255, 255, 255, 0.22)',
  text: '#f2f5fa',
  dim: '#9aa7bd',
};

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function drawBackground(ctx, t, storm) {
  const sky = ctx.createLinearGradient(0, 0, 0, SEA_Y);
  sky.addColorStop(0, storm ? '#141a30' : PALETTE.skyTop);
  sky.addColorStop(0.55, storm ? '#2c2748' : PALETTE.skyMid);
  sky.addColorStop(1, storm ? '#6e3f5c' : PALETTE.skyLow);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, SEA_Y);
  // the low sun and its glow
  const sunX = W * 0.78;
  const sunY = SEA_Y - 150;
  const glow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 260);
  glow.addColorStop(0, 'rgba(255, 179, 107, 0.55)');
  glow.addColorStop(1, 'rgba(255, 179, 107, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(sunX - 280, sunY - 280, 560, 560);
  ctx.fillStyle = PALETTE.sun;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 44, 0, Math.PI * 2);
  ctx.fill();
  // two parallax ridge lines (distant salvage islands)
  ridge(ctx, t * 4, SEA_Y - 118, 26, '#241f3d');
  ridge(ctx, t * 9, SEA_Y - 62, 18, '#2e2a4d');
  // sea
  const sea = ctx.createLinearGradient(0, SEA_Y, 0, H);
  sea.addColorStop(0, PALETTE.seaTop);
  sea.addColorStop(1, PALETTE.seaDeep);
  ctx.fillStyle = sea;
  ctx.fillRect(0, SEA_Y, W, H - SEA_Y);
  // sun glitter path on the water
  ctx.fillStyle = 'rgba(255, 179, 107, 0.20)';
  for (let i = 0; i < 9; i++) {
    const y = SEA_Y + 8 + i * 11;
    const wob = Math.sin(t * 1.7 + i * 1.9) * 14;
    const wdt = 130 - i * 11 + Math.sin(t * 2.3 + i) * 16;
    ctx.fillRect(sunX - wdt / 2 + wob, y, wdt, 3);
  }
  // drifting wave dashes
  ctx.fillStyle = 'rgba(190, 225, 255, 0.16)';
  for (let i = 0; i < 26; i++) {
    const x = ((i * 173 + t * (12 + (i % 5) * 4)) % (W + 60)) - 30;
    const y = SEA_Y + 12 + ((i * 37) % 84);
    ctx.fillRect(x, y, 26, 2);
  }
  if (storm) {
    ctx.strokeStyle = 'rgba(200, 215, 255, 0.28)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < 46; i++) {
      const x = ((i * 211 + t * 620) % (W + 200)) - 100;
      const y = (i * 97 + t * 900) % (SEA_Y + 40);
      ctx.moveTo(x, y);
      ctx.lineTo(x - 9, y + 22);
    }
    ctx.stroke();
  }
}

function ridge(ctx, offset, baseY, amp, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, SEA_Y);
  for (let x = 0; x <= W; x += 32) {
    const y = baseY - Math.abs(Math.sin((x + offset) * 0.011)) * amp - Math.sin((x + offset) * 0.003) * amp * 0.7;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(W, SEA_Y);
  ctx.closePath();
  ctx.fill();
}

export function drawShard(ctx, x, y, size, rot, gold, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  const color = gold ? PALETTE.gold : PALETTE.shard;
  ctx.shadowColor = color;
  ctx.shadowBlur = 16;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(size * 0.62, 0);
  ctx.lineTo(0, size);
  ctx.lineTo(-size * 0.62, 0);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = gold ? '#fff3c4' : PALETTE.shardCore;
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.55);
  ctx.lineTo(size * 0.3, 0);
  ctx.lineTo(0, size * 0.55);
  ctx.lineTo(-size * 0.3, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawMine(ctx, x, y, size, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = PALETTE.mineSpike;
  ctx.lineWidth = 3;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + t * 0.4;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * size * 0.7, Math.sin(a) * size * 0.7);
    ctx.lineTo(Math.cos(a) * size * 1.15, Math.sin(a) * size * 1.15);
    ctx.stroke();
  }
  ctx.fillStyle = PALETTE.mine;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.78, 0, Math.PI * 2);
  ctx.fill();
  const blink = Math.sin(t * 6) > 0 ? PALETTE.mineLight : '#7a2f35';
  ctx.fillStyle = blink;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.24, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawPickup(ctx, x, y, kind, t) {
  ctx.save();
  ctx.translate(x, y + Math.sin(t * 3) * 2);
  if (kind === 'cell') {
    ctx.shadowColor = PALETTE.cell;
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#1d3a28';
    ctx.fillRect(-8, -12, 16, 24);
    ctx.fillStyle = PALETTE.cell;
    ctx.fillRect(-5, -9 + 6, 10, 12);
    ctx.fillRect(-3, -15, 6, 3);
  } else {
    ctx.shadowColor = PALETTE.heart;
    ctx.shadowBlur = 12;
    ctx.fillStyle = PALETTE.heart;
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.bezierCurveTo(-16, -2, -10, -14, 0, -6);
    ctx.bezierCurveTo(10, -14, 16, -2, 0, 10);
    ctx.fill();
  }
  ctx.restore();
}

export function drawSkiff(ctx, x, t, netHalfWidth, shieldUp, thrust) {
  const y = SEA_Y + 16 + Math.sin(t * 2.1) * 2.5;
  // tractor net: a glowing arc fanning up from the skiff
  const grad = ctx.createLinearGradient(x, y - 64, x, y);
  grad.addColorStop(0, 'rgba(127, 231, 255, 0)');
  grad.addColorStop(1, 'rgba(127, 231, 255, 0.30)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(x - netHalfWidth, y - 58);
  ctx.lineTo(x + netHalfWidth, y - 58);
  ctx.lineTo(x + 22, y - 4);
  ctx.lineTo(x - 22, y - 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(160, 240, 255, 0.75)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - netHalfWidth, y - 58);
  ctx.lineTo(x + netHalfWidth, y - 58);
  ctx.stroke();
  // hull
  ctx.fillStyle = '#31405c';
  ctx.beginPath();
  ctx.moveTo(x - 46, y);
  ctx.lineTo(x + 46, y);
  ctx.lineTo(x + 30, y + 16);
  ctx.lineTo(x - 30, y + 16);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.accent;
  ctx.fillRect(x - 46, y - 3, 92, 4);
  // mast + collector dish
  ctx.strokeStyle = PALETTE.hull;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y - 2);
  ctx.lineTo(x, y - 30);
  ctx.stroke();
  ctx.fillStyle = PALETTE.shard;
  ctx.beginPath();
  ctx.arc(x, y - 34, 5 + Math.sin(t * 5) * 1, 0, Math.PI * 2);
  ctx.fill();
  // thruster wake
  ctx.fillStyle = 'rgba(190, 225, 255, 0.5)';
  const wake = 10 + Math.abs(thrust) * 26;
  ctx.fillRect(x - wake / 2 - 20, y + 17, wake, 3);
  ctx.fillRect(x - wake / 2 + 16, y + 17, wake * 0.7, 3);
  if (shieldUp) {
    ctx.strokeStyle = 'rgba(125, 255, 154, 0.65)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y - 12, 62, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
  }
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
