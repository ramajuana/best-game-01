// ui.js — everything the player reads: the HUD (score, hull hearts, energy
// bar, wave quota, combo meter), the title screen, the between-wave salvage
// shop, and the victory / game-over screens. Buttons are real rectangles
// the mouse can click; every screen also answers the keyboard.

import { W, H, PALETTE, roundRect } from './art.js';
import { FINAL_WAVE } from './world.js';

export const buttons = []; // rebuilt by every draw: {x,y,w,h,id}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = PALETTE.panel;
  roundRect(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function button(ctx, x, y, w, h, label, id, accent) {
  ctx.fillStyle = accent ? 'rgba(255, 179, 107, 0.92)' : 'rgba(38, 48, 74, 0.92)';
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.stroke();
  ctx.fillStyle = accent ? '#22180c' : PALETTE.text;
  ctx.font = '700 19px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, x + w / 2, y + h / 2 + 7);
  buttons.push({ x, y, w, h, id });
}

function hearts(ctx, x, y, hull, maxHull) {
  for (let i = 0; i < maxHull; i++) {
    ctx.fillStyle = i < hull ? PALETTE.heart : 'rgba(255,255,255,0.16)';
    const hx = x + i * 26;
    ctx.beginPath();
    ctx.moveTo(hx, y + 8);
    ctx.bezierCurveTo(hx - 10, y - 2, hx - 6, y - 10, hx, y - 4);
    ctx.bezierCurveTo(hx + 6, y - 10, hx + 10, y - 2, hx, y + 8);
    ctx.fill();
  }
}

export function drawHUD(ctx, player, world) {
  panel(ctx, 16, 14, 330, 86);
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.text;
  ctx.font = '800 27px system-ui, sans-serif';
  ctx.fillText(String(player.score), 32, 50);
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.fillStyle = PALETTE.dim;
  ctx.fillText('SCORE', 32, 70);
  hearts(ctx, 150, 44, player.hull, player.maxHull);
  ctx.fillStyle = PALETTE.dim;
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.fillText('HULL', 146, 70);
  ctx.fillStyle = PALETTE.gold;
  ctx.font = '700 17px system-ui, sans-serif';
  ctx.fillText(`◆ ${player.salvage} salvage`, 238, 50);

  // wave quota, top centre
  panel(ctx, W / 2 - 150, 14, 300, 62);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.text;
  ctx.font = '800 21px system-ui, sans-serif';
  ctx.fillText(`WAVE ${world.wave} / ${FINAL_WAVE}${world.storm ? '  ·  STORM' : ''}`, W / 2, 42);
  ctx.font = '600 14px system-ui, sans-serif';
  ctx.fillStyle = PALETTE.dim;
  ctx.fillText(`catch ${Math.min(world.caughtThisWave, world.toCatch)} of ${world.toCatch} shards`, W / 2, 64);

  // energy + combo, bottom left
  panel(ctx, 16, H - 64, 300, 48);
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.dim;
  ctx.font = '600 12px system-ui, sans-serif';
  ctx.fillText('ENERGY — SPACE fires the pulse blaster', 30, H - 40);
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  roundRect(ctx, 30, H - 34, 200, 10, 5);
  ctx.fill();
  ctx.fillStyle = PALETTE.cell;
  roundRect(ctx, 30, H - 34, 200 * (player.energy / 100), 10, 5);
  ctx.fill();
  if (player.combo >= 2) {
    ctx.fillStyle = PALETTE.gold;
    ctx.font = '800 20px system-ui, sans-serif';
    ctx.fillText(`COMBO ×${Math.min(3, 1 + player.combo * 0.1).toFixed(1)}`, 244, H - 24);
  }
  if (player.shieldReady) {
    ctx.fillStyle = PALETTE.cell;
    ctx.font = '700 14px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('🛡 AEGIS READY', W - 24, H - 26);
  }
}

export function drawTitle(ctx, t) {
  buttons.length = 0;
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.text;
  ctx.font = '900 84px system-ui, sans-serif';
  ctx.shadowColor = 'rgba(127, 231, 255, 0.6)';
  ctx.shadowBlur = 26;
  ctx.fillText('STARFALL', W / 2, 218);
  ctx.fillStyle = PALETTE.accent;
  ctx.fillText('SALVAGE', W / 2, 302);
  ctx.shadowBlur = 0;
  ctx.font = '500 21px system-ui, sans-serif';
  ctx.fillStyle = '#cdd8ea';
  ctx.fillText('Catch the falling star-shards in your tractor net. Dodge the mines — or blast them.', W / 2, 356);
  ctx.fillText('Chain catches to raise your combo, earn salvage, and upgrade the skiff between waves.', W / 2, 386);
  ctx.fillText('Clear wave 10 to win. If your hull hits zero, the sea takes the rest.', W / 2, 416);
  button(ctx, W / 2 - 130, 452, 260, 56, '▶  LAUNCH  (Enter)', 'start', true);
  ctx.font = '600 16px system-ui, sans-serif';
  ctx.fillStyle = '#cdd8ea';
  ctx.fillText('← → or mouse to steer · SPACE to shoot · P pause · M mute', W / 2, 758);
}

export function drawShop(ctx, player, offers) {
  buttons.length = 0;
  ctx.fillStyle = 'rgba(6, 9, 18, 0.55)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.text;
  ctx.font = '800 40px system-ui, sans-serif';
  ctx.fillText('WAVE CLEARED — SALVAGE SHOP', W / 2, 120);
  ctx.font = '600 19px system-ui, sans-serif';
  ctx.fillStyle = PALETTE.gold;
  ctx.fillText(`You hold ◆ ${player.salvage} salvage · hull ${player.hull}/${player.maxHull} · score ${player.score}`, W / 2, 156);
  const cardW = 300;
  const gap = 26;
  const x0 = W / 2 - (cardW * 3 + gap * 2) / 2;
  offers.forEach((def, i) => {
    const x = x0 + i * (cardW + gap);
    const y = 196;
    const cost = player.upgradeCost(def);
    const owned = player.levels[def.id];
    const afford = player.salvage >= cost;
    panel(ctx, x, y, cardW, 268);
    ctx.fillStyle = PALETTE.accent;
    ctx.font = '800 24px system-ui, sans-serif';
    ctx.fillText(def.name, x + cardW / 2, y + 48);
    ctx.fillStyle = PALETTE.dim;
    ctx.font = '600 15px system-ui, sans-serif';
    ctx.fillText(`fitted: ${owned}`, x + cardW / 2, y + 76);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '500 17px system-ui, sans-serif';
    wrapText(ctx, def.desc, x + cardW / 2, y + 116, cardW - 44, 22);
    button(ctx, x + 34, y + 196, cardW - 68, 48, afford ? `BUY  ◆ ${cost}  (${i + 1})` : `◆ ${cost} — not enough`, `buy:${def.id}`, afford);
  });
  button(ctx, W / 2 - 150, 516, 300, 54, 'LAUNCH NEXT WAVE ▸  (Enter)', 'next', true);
}

export function drawEnd(ctx, player, world, victory) {
  buttons.length = 0;
  ctx.fillStyle = 'rgba(6, 9, 18, 0.5)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = victory ? PALETTE.gold : PALETTE.heart;
  ctx.font = '900 62px system-ui, sans-serif';
  ctx.fillText(victory ? 'SECTOR CLEARED!' : 'THE SEA TAKES ITS DUE', W / 2, 218);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '600 22px system-ui, sans-serif';
  ctx.fillText(
    victory ? `You cleared all ${FINAL_WAVE} waves of the starfall.` : `Your skiff broke apart on wave ${world.wave}.`,
    W / 2, 264,
  );
  panel(ctx, W / 2 - 210, 300, 420, 168);
  ctx.font = '600 19px system-ui, sans-serif';
  ctx.fillStyle = PALETTE.dim;
  const rows = [
    ['Final score', String(player.score)],
    ['Shards caught', String(player.caught)],
    ['Mines blasted', String(player.shotDown)],
    ['Best combo', `×${Math.min(3, 1 + player.bestCombo * 0.1).toFixed(1)} (${player.bestCombo} catches)`],
    ['Waves cleared', String(victory ? FINAL_WAVE : world.wave - 1)],
  ];
  rows.forEach(([k, v], i) => {
    ctx.textAlign = 'left';
    ctx.fillText(k, W / 2 - 178, 340 + i * 30);
    ctx.textAlign = 'right';
    ctx.fillStyle = PALETTE.text;
    ctx.fillText(v, W / 2 + 178, 340 + i * 30);
    ctx.fillStyle = PALETTE.dim;
  });
  button(ctx, W / 2 - 140, 508, 280, 56, '↻  FLY AGAIN  (R)', 'restart', true);
}

export function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(6, 9, 18, 0.55)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.text;
  ctx.font = '800 44px system-ui, sans-serif';
  ctx.fillText('PAUSED', W / 2, H / 2);
  ctx.font = '500 18px system-ui, sans-serif';
  ctx.fillStyle = PALETTE.dim;
  ctx.fillText('Press P to resume', W / 2, H / 2 + 36);
}

function wrapText(ctx, text, cx, y, maxW, lineH) {
  const words = text.split(' ');
  let line = '';
  let yy = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, cx, yy);
      line = word;
      yy += lineH;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, cx, yy);
}
