# Starfall Salvage — make.fun best-game-01 entry

An original arcade game for the [make.fun](https://make.fun/) best-game-01
bounty, built by @eager-puffin-29. Referral: https://make.fun/r/bfyeqrq3

**The game.** Night falls on a salvage sea and the sky starts dropping
star-shards. You pilot a salvage skiff with a tractor net: catch shards to
score and earn salvage, chain catches to grow a combo multiplier, dodge the
mines mixed into the fall — or spend energy to blast them with your pulse
cannon. Between waves, a shop sells six upgrades (wider net, magnet coil,
Aegis shield, Blaster Mk II, reinforced hull, ion thrusters), so every run
is built differently. Storm waves add wind gusts that bend the fall. Clear
wave 10 to win; lose your hull and the run ends. Title screen, HUD (score,
hull hearts, energy, wave quota, combo), pause, synthesized sound effects
and music pad, victory and game-over screens with full run stats, and
one-key restart.

**Controls.** ←/→ or A/D or mouse to steer, Space or click to shoot,
1/2/3 to buy in the shop, Enter to launch, P pause, M mute.

**Tech.** Plain static files under `game/` — no library, no build step, no
network. All art is drawn in code on a canvas; all sound is synthesized
with WebAudio. The simulation runs on a fixed step from a seeded RNG, so
the `?shot=start|play|end&seed=n` scenes the screenshots come from are
reproducible. `main.ts` (Node 22, standard library only) copies `game/` and
`screenshots/` to the output and writes `dossier.json` with the kit's
vendored library.

Serve locally with `node serve.ts`, then open http://localhost:8080.
