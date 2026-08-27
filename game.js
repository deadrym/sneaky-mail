/* ===================== Sneaky Mail ===================== */
'use strict';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false; // keep sprite scaling crisp/nearest-neighbor, matching the pixel-art source art
const VIEW_W = canvas.width;
const VIEW_H = canvas.height;

/* ---------- Sprite assets ---------- */
const ASSET_PATHS = {
  dogs: {
    chihuahua: 'assets/dogs/chihuahua.png',
    dachshund: 'assets/dogs/dachshund.png',
    shihtzu: 'assets/dogs/shihtzu.png',
    frenchbulldog: 'assets/dogs/frenchbulldog.png',
    yorkie: 'assets/dogs/yorkie.png',
    labrador: 'assets/dogs/labrador.png',
    goldendoodle: 'assets/dogs/goldendoodle.png',
    goldenretriever: 'assets/dogs/goldenretriever.png',
    shepherd: 'assets/dogs/shepherd.png',
    pitbull: 'assets/dogs/pitbull.png',
  },
  mailman: {
    portrait: 'assets/mailman/portrait.png',
    walk0: 'assets/mailman/walk_0.png',
    walk1: 'assets/mailman/walk_1.png',
    sneak0: 'assets/mailman/sneak_0.png',
    sneak1: 'assets/mailman/sneak_1.png',
    hurt: 'assets/mailman/hurt.png',
    victory: 'assets/mailman/victory.png',
  },
  // Ground tiles, repeated to fill the space around the lots. Every one is
  // optional: the preloader tolerates a missing file and each draw falls
  // back to the flat colour it replaces, so the game still renders if a
  // tile hasn't been added yet.
  tiles: {
    grass: 'assets/tiles/grass.png',
    sidewalk: 'assets/tiles/sidewalk.png',
    sidewalkCorner: 'assets/tiles/sidewalk%20corner.png',
    roadH: 'assets/tiles/horizontal%20street.png',
    roadV: 'assets/tiles/vertical%20street.png',
  },
  // Individual scene sprites, pre-trimmed to their opaque bounds so a
  // placement is just a bottom-centre point with no padding to correct for.
  vehicle: {
    vanLeft: 'assets/vehicle/van_left.png',
    vanRight: 'assets/vehicle/van_right.png',
    vanFront: 'assets/vehicle/van_front.png',
    vanRear: 'assets/vehicle/van_rear.png',
  },
  props: {
    house1: 'assets/props/house1.png',
    house2: 'assets/props/house2.png',
    house3: 'assets/props/house3.png',
    bush: 'assets/props/bush.png',
    rock: 'assets/props/rock.png',
    birdbath: 'assets/props/birdbath.png',
    lamppost: 'assets/props/lamppost.png',
    mailmanStand: 'assets/props/mailman_stand.png',
    mailmanWalk: 'assets/props/mailman_walk.png',
  },
  mailboxes: {
    arch_red: 'assets/mailboxes/arch_red.png',
    community_green: 'assets/mailboxes/community_green.png',
    pillar_green: 'assets/mailboxes/pillar_green.png',
    pillar_navy: 'assets/mailboxes/pillar_navy.png',
    wall_cream: 'assets/mailboxes/wall_cream.png',
    rural_red: 'assets/mailboxes/rural_red.png',
    postexpress_teal: 'assets/mailboxes/postexpress_teal.png',
    collection_red: 'assets/mailboxes/collection_red.png',
    numbered_teal: 'assets/mailboxes/numbered_teal.png',
    house_snow: 'assets/mailboxes/house_snow.png',
    post_darkred: 'assets/mailboxes/post_darkred.png',
    pillar_cream: 'assets/mailboxes/pillar_cream.png',
  },
};

// Per-breed animation frame sets (move/sleep/bark), cut from the same sheet
// as the static dogs.* sprites. Coverage varies by breed -- some source rows
// had touching/overlapping frames that couldn't be cleanly separated -- so
// dogAnimFrames() below falls back gracefully when a category is missing.
const DOG_ANIM = {
  chihuahua: { move: ['assets/dogs/anim/chihuahua_move_0.png', 'assets/dogs/anim/chihuahua_move_1.png'], sleep: ['assets/dogs/anim/chihuahua_sleep_0.png', 'assets/dogs/anim/chihuahua_sleep_1.png'], bark: ['assets/dogs/anim/chihuahua_bark_0.png'] },
  frenchbulldog: { move: ['assets/dogs/anim/frenchbulldog_move_0.png', 'assets/dogs/anim/frenchbulldog_move_1.png'], sleep: ['assets/dogs/anim/frenchbulldog_sleep_0.png', 'assets/dogs/anim/frenchbulldog_sleep_1.png'], bark: ['assets/dogs/anim/frenchbulldog_bark_0.png'] },
  labrador: { move: ['assets/dogs/anim/labrador_move_0.png'], sleep: ['assets/dogs/anim/labrador_sleep_0.png'], bark: [] },
  yorkie: { move: ['assets/dogs/anim/yorkie_move_0.png', 'assets/dogs/anim/yorkie_move_1.png'], sleep: ['assets/dogs/anim/yorkie_sleep_0.png'], bark: ['assets/dogs/anim/yorkie_bark_0.png'] },
  shihtzu: { move: ['assets/dogs/anim/shihtzu_move_0.png', 'assets/dogs/anim/shihtzu_move_1.png'], sleep: ['assets/dogs/anim/shihtzu_sleep_0.png'], bark: ['assets/dogs/anim/shihtzu_bark_0.png'] },
  goldenretriever: { move: ['assets/dogs/anim/goldenretriever_move_0.png'], sleep: ['assets/dogs/anim/goldenretriever_sleep_0.png'], bark: [] },
  shepherd: { move: ['assets/dogs/anim/shepherd_move_0.png', 'assets/dogs/anim/shepherd_move_1.png'], sleep: ['assets/dogs/anim/shepherd_sleep_0.png'], bark: [] },
  pitbull: { move: ['assets/dogs/anim/pitbull_move_0.png', 'assets/dogs/anim/pitbull_move_1.png'], sleep: ['assets/dogs/anim/pitbull_sleep_0.png'], bark: [] },
  goldendoodle: { move: ['assets/dogs/anim/goldendoodle_move_0.png', 'assets/dogs/anim/goldendoodle_move_1.png'], sleep: ['assets/dogs/anim/goldendoodle_sleep_0.png'], bark: [] },
  dachshund: { move: ['assets/dogs/anim/dachshund_move_0.png', 'assets/dogs/anim/dachshund_move_1.png'], sleep: ['assets/dogs/anim/dachshund_sleep_0.png', 'assets/dogs/anim/dachshund_sleep_1.png'], bark: [] },
};

const IMAGES = {};
const DOG_ANIM_IMAGES = {};
function preloadImages(onDone) {
  const entries = [];
  for (const group in ASSET_PATHS) {
    for (const key in ASSET_PATHS[group]) {
      const fullKey = `${group}.${key}`;
      entries.push({ src: ASSET_PATHS[group][key], set: (img) => { IMAGES[fullKey] = img; } });
    }
  }
  for (const breed in DOG_ANIM) {
    DOG_ANIM_IMAGES[breed] = {};
    for (const cat in DOG_ANIM[breed]) {
      const arr = DOG_ANIM_IMAGES[breed][cat] = [];
      DOG_ANIM[breed][cat].forEach((src, i) => {
        entries.push({ src, set: (img) => { arr[i] = img; } });
      });
    }
  }
  let remaining = entries.length;
  const settle = () => { remaining--; if (remaining <= 0) onDone(); };
  entries.forEach(({ src, set }) => {
    const img = new Image();
    img.onload = () => { set(img); settle(); };
    img.onerror = settle;
    img.src = src;
  });
}
// Frames for a breed/category, falling back to 'move' then the single
// static dogs.* sprite when that category wasn't cleanly extractable.
function dogAnimFrames(breedKey, cat) {
  const forCat = DOG_ANIM_IMAGES[breedKey] && DOG_ANIM_IMAGES[breedKey][cat];
  if (forCat && forCat.length) return forCat;
  const move = DOG_ANIM_IMAGES[breedKey] && DOG_ANIM_IMAGES[breedKey].move;
  if (move && move.length) return move;
  const staticImg = IMAGES[`dogs.${breedKey}`];
  return staticImg ? [staticImg] : [];
}
/* ---------- Ground tiling ----------
   Repeating tiles fill everything that isn't a lot: the grass around and
   between properties, and the sidewalk framing them. Patterns are built
   once and cached, and they inherit the camera transform, so the ground
   scrolls with the world instead of sliding under it. */
const PATTERNS = {};
function tilePattern(key) {
  if (key in PATTERNS) return PATTERNS[key];
  const img = IMAGES[`tiles.${key}`];
  PATTERNS[key] = (img && img.complete && img.naturalWidth)
    ? ctx.createPattern(img, 'repeat')
    : null;
  return PATTERNS[key];
}
// Fills a rect with a tile, or with `fallback` when that tile is missing.
// Pass fallback null to skip drawing entirely rather than paint a flat slab.
function fillTiled(key, x, y, w, h, fallback) {
  if (w <= 0 || h <= 0) return false;
  const pat = tilePattern(key);
  if (pat) {
    ctx.fillStyle = pat;
    ctx.fillRect(x, y, w, h);
    return true;
  }
  if (fallback) {
    ctx.fillStyle = fallback;
    ctx.fillRect(x, y, w, h);
  }
  return false;
}

function drawSprite(img, x, y, dispH, anchor) {
  // anchor: 'center' (default) or 'bottom' (image bottom edge sits at y)
  if (!img || !img.complete || !img.naturalHeight) return;
  const dispW = dispH * (img.naturalWidth / img.naturalHeight);
  const dy = anchor === 'bottom' ? y - dispH : y - dispH / 2;
  ctx.drawImage(img, x - dispW / 2, dy, dispW, dispH);
  return dispW;
}

/* ---------- Dog breed catalog ---------- */
/* range: forward vision-cone distance (px), lengthened so front-facing
   detection reaches well beyond the old range. coneDeg: vision cone width
   (degrees). nearRadius: 360-degree close-range awareness (px) -- inside
   this radius the dog notices the player from any angle (hearing/smell),
   not just within the cone. speed: patrol/turn speed. fillRate: suspicion
   gained per second while seen. behavior: 'pace' (walks a patrol line),
   'sentry' (stands still, sweeps gaze), 'sleepy' (naps on a timer, blind
   while asleep), 'erratic' (random direction changes) */
const BREEDS = {
  chihuahua:   { name: 'Chihuahua',              size: 0.60, range: 108, nearRadius: 31, coneDeg: 50, speed: 40, fillRate: 0.80, behavior: 'sleepy' },
  dachshund:   { name: 'Dachshund',              size: 0.80, range: 127, nearRadius: 36, coneDeg: 50, speed: 24, fillRate: 0.88, behavior: 'pace' },
  shihtzu:     { name: 'Shih Tzu',               size: 0.75, range: 117, nearRadius: 34, coneDeg: 50, speed: 18, fillRate: 0.72, behavior: 'sleepy' },
  frenchbulldog:{ name: 'French Bulldog',        size: 0.90, range: 147, nearRadius: 42, coneDeg: 60, speed: 20, fillRate: 0.96, behavior: 'sentry' },
  yorkie:      { name: 'Yorkshire Terrier',      size: 0.65, range: 166, nearRadius: 48, coneDeg: 60, speed: 34, fillRate: 1.12, behavior: 'erratic' },
  labrador:    { name: 'Labrador Retriever',     size: 1.05, range: 186, nearRadius: 53, coneDeg: 60, speed: 34, fillRate: 1.04, behavior: 'pace' },
  goldendoodle:{ name: 'Goldendoodle',           size: 1.00, range: 176, nearRadius: 50, coneDeg: 65, speed: 32, fillRate: 1.12, behavior: 'erratic' },
  goldenretriever:{ name: 'Golden Retriever',    size: 1.05, range: 205, nearRadius: 59, coneDeg: 65, speed: 34, fillRate: 1.20, behavior: 'sentry' },
  shepherd:    { name: 'German Shepherd',        size: 1.10, range: 238, nearRadius: 69, coneDeg: 70, speed: 48, fillRate: 1.36, behavior: 'pace' },
  pitbull:     { name: 'American Pit Bull Terrier', size: 1.15, range: 264, nearRadius: 76, coneDeg: 70, speed: 46, fillRate: 1.44, behavior: 'sentry' },
};

/* Mailbox sprite styles, cycled per house for street variety */
const MAILBOX_STYLES = Object.keys(ASSET_PATHS.mailboxes);

const STREET_W = 170;      // horizontal street band width
const PLAYER_R = 11;       // player collision radius, also sizes mailbox approach clearance
const VAN_H = 58;          // rendered van height; length follows the sprite's aspect
const VAN_SPEED = 260;     // noticeably quicker than the 130 the carrier walks
const VAN_ENTER_R = 62;    // how close you must be to climb in
const WORLD_W = 880;       // fits the widest lot plus verge, and stays under
                           // the 900px canvas so the camera never pans sideways
const MARGIN_TOP = 150;    // grass verge above the first lot, where the player starts
const MARGIN_BOTTOM = 150;
const SKY_H = 96;          // decorative horizon strip, kept clear of the first lot

/* ---------- Scene props + composed lots ----------
   A lot is no longer one baked image. It's a list of sprite placements over
   tiled ground, so the layout is data you can edit rather than pixels.

   Each prop declares the height it renders at in world pixels, plus the
   share of that sprite which is actually standing on the ground -- a
   face-on house should only block movement at its base, not across its
   roof, and a lamppost only at its post. Collision and sight-blocking are
   derived from that footprint, so obstacles can never drift out of step
   with the art the way hand-authored rectangles did.
     h      : rendered height in world px (sprites are pre-trimmed)
     footH  : footprint height, as a share of h, measured up from the base
     footW  : footprint width, as a share of the sprite's rendered width
     sight  : also blocks a dog's line of sight (cover you can hide behind) */
const PROPS = {
  house1:   { h: 210, footH: 0.30, footW: 0.94, solid: true, sight: true },
  house2:   { h: 190, footH: 0.32, footW: 0.94, solid: true, sight: true },
  house3:   { h: 205, footH: 0.30, footW: 0.94, solid: true, sight: true },
  bush:     { h: 46,  footH: 0.62, footW: 0.86, solid: true, sight: true },
  rock:     { h: 34,  footH: 0.70, footW: 0.88, solid: true },
  birdbath: { h: 52,  footH: 0.34, footW: 0.60, solid: true },
  lamppost: { h: 92,  footH: 0.10, footW: 0.30, solid: true },
};

const LOT_W = WORLD_W;     // scenes span the full width, so there are no
                           // ragged grass flanks left over beside a lot
const LOT_H = 430;
const SIDEWALK_H = 36;     // the walk along the front of every property

// Footprint rectangle for one placement, in lot-image space. `x`,`y` is the
// sprite's bottom-centre -- the point where it meets the ground.
function propFootprint(item) {
  const p = PROPS[item.prop];
  const img = IMAGES[`props.${item.prop}`];
  const aspect = (img && img.naturalHeight) ? img.naturalWidth / img.naturalHeight : 1;
  const scale = item.scale || 1;
  const h = p.h * scale;
  const w = h * aspect;
  return {
    x: item.x - (w * p.footW) / 2,
    y: item.y - h * p.footH,
    w: w * p.footW,
    h: h * p.footH,
    sight: !!p.sight,
  };
}

// Deterministic per-lot RNG, so a given lot always composes the same way
// and the layouts stay stable to hand-edit.
function lotRandom(seed) {
  let s = seed * 9301 + 49297;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

// Auto-seeded layout: a house set back from the street, decor spread across
// the yard, and a lamppost at the kerb. Starting point for hand-editing.
function seedLotScene(index) {
  const rnd = lotRandom(index + 1);
  const houseKey = ['house1', 'house2', 'house3'][index % 3];
  const groundY = LOT_H - SIDEWALK_H;      // where the yard meets the walk
  const items = [];

  const houseX = LOT_W * (0.34 + rnd() * 0.32);
  const houseBase = groundY - 132 - rnd() * 26;
  items.push({ prop: houseKey, x: Math.round(houseX), y: Math.round(houseBase) });

  // the walk from the street to the door stays clear; decor fills around it
  const pathX = houseX;
  const spots = [];
  const tries = 40;
  for (let i = 0; i < tries && spots.length < 12; i++) {
    const x = 46 + rnd() * (LOT_W - 92);
    const y = houseBase + 16 + rnd() * (groundY - houseBase - 26);
    if (Math.abs(x - pathX) < 62) continue;                  // keep the walk open
    if (spots.some((s) => Math.hypot(s.x - x, s.y - y) < 58)) continue;
    spots.push({ x, y });
  }
  const kinds = ['bush', 'rock', 'bush', 'birdbath', 'bush', 'rock', 'bush', 'rock', 'bush', 'birdbath', 'rock', 'bush'];
  spots.forEach((s, i) => items.push({ prop: kinds[i % kinds.length], x: Math.round(s.x), y: Math.round(s.y) }));
  items.push({ prop: 'lamppost', x: Math.round(index % 2 ? 74 : LOT_W - 74), y: groundY + 24 });

  return {
    key: 'lot' + (index + 1),
    w: LOT_W, h: LOT_H, sidewalkY: groundY,
    items,
    mailbox: { x: Math.round(pathX + 54), y: groundY - 16 },
    dogSpawn: { x: Math.round(LOT_W / 2), y: Math.round((houseBase + groundY) / 2) },
  };
}

// Hand-arranged layouts from the scene editor. A lot listed here overrides
// its auto-seeded version; anything not listed still gets seeded, so lots
// can be hand-finished one at a time.
const AUTHORED_SCENES = {
  0: {
    key: 'lot1', w: LOT_W, h: LOT_H, sidewalkY: 394,
    items: [
      { prop: 'house1', x: 453, y: 253 },
      { prop: 'bush', x: 698, y: 267 },
      { prop: 'rock', x: 197, y: 392 },
      { prop: 'bush', x: 416, y: 394 },
      { prop: 'birdbath', x: 198, y: 164 },
      { prop: 'bush', x: 306, y: 298 },
      { prop: 'rock', x: 239, y: 72 },
      { prop: 'bush', x: 677, y: 145 },
      { prop: 'rock', x: 676, y: 384 },
      { prop: 'bush', x: 291, y: 207 },
      { prop: 'birdbath', x: 572, y: 333, scale: 1.09 },
      { prop: 'rock', x: 613, y: 240 },
      { prop: 'bush', x: 285, y: 329 },
      { prop: 'lamppost', x: 130, y: 419 },
      { prop: 'lamppost', x: 833, y: 423 },
    ],
    mailbox: { x: 466, y: 265 }, dogSpawn: { x: 440, y: 324 },
  },
};

const LOT_TYPES = [0, 1, 2, 3, 4].map((i) => AUTHORED_SCENES[i] || seedLotScene(i));

// Collision is derived from the placements once the sprites have loaded,
// since a footprint needs the sprite's aspect ratio to size correctly.
function resolveLotCollision() {
  for (const lot of LOT_TYPES) {
    const houseItem = lot.items.find((it) => it.prop.startsWith('house'));
    lot.house = houseItem ? propFootprint(houseItem) : { x: 0, y: 0, w: 0, h: 0 };
    lot.solids = lot.items
      .filter((it) => it !== houseItem && PROPS[it.prop].solid)
      .map(propFootprint);
  }
}


/* ---------- Level configs ---------- */
const LEVELS = [
  { houses: 3, breeds: ['chihuahua', 'dachshund'],                              doubleDogHouses: 0, bushChance: 0.85, desc: 'A quiet street. Easy does it.' },
  { houses: 4, breeds: ['dachshund', 'chihuahua', 'shihtzu'],                   doubleDogHouses: 0, bushChance: 0.75, desc: 'A few more houses to cover.' },
  { houses: 4, breeds: ['shihtzu', 'frenchbulldog', 'dachshund'],              doubleDogHouses: 1, bushChance: 0.65, desc: 'One house has backup.' },
  { houses: 5, breeds: ['frenchbulldog', 'yorkie', 'shihtzu'],                 doubleDogHouses: 1, bushChance: 0.55, desc: 'Yorkies move unpredictably. Watch closely.' },
  { houses: 5, breeds: ['yorkie', 'labrador', 'frenchbulldog'],               doubleDogHouses: 2, bushChance: 0.45, desc: 'French Bulldogs stand and stare a long way off.' },
  { houses: 6, breeds: ['labrador', 'goldendoodle', 'yorkie'],                doubleDogHouses: 2, bushChance: 0.35, desc: 'Goldendoodles are quick and unpredictable. Stay sharp.' },
  { houses: 6, breeds: ['goldendoodle', 'goldenretriever', 'labrador'],       doubleDogHouses: 3, bushChance: 0.25, desc: 'Heavy coverage on this block.' },
  { houses: 7, breeds: ['goldenretriever', 'shepherd', 'goldendoodle'],       doubleDogHouses: 3, bushChance: 0.20, desc: 'German Shepherds see for miles. Few bushes left.' },
  { houses: 8, breeds: ['shepherd', 'pitbull', 'goldenretriever'],            doubleDogHouses: 4, bushChance: 0.10, desc: 'Nearly no cover. Nerves of steel required.' },
  { houses: 9, breeds: ['pitbull', 'shepherd', 'goldenretriever', 'labrador'], doubleDogHouses: 5, bushChance: 0.05, desc: 'The final gauntlet. Every elite breed on the route.' },
];


// The route is one column of full-width lots stacked downward, each with a
// horizontal street running along its front edge. Every lot is a single
// hand-drawn scene (house + yard + decor), so a "row" is a whole property
// rather than a thin house strip -- the yard is the play space, and its
// baked-in decor is what the collision rectangles in LOT_TYPES make solid.

/* ---------- Utility ---------- */
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }
// Rotates `from` toward `to` by at most `maxStep`, the short way round.
function turnToward(from, to, maxStep) {
  const diff = normAngle(to - from);
  if (Math.abs(diff) <= maxStep) return to;
  return from + Math.sign(diff) * maxStep;
}
function normAngle(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}
function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function circleRectOverlap(cx, cy, cr, r) {
  const nx = clamp(cx, r.x, r.x + r.w);
  const ny = clamp(cy, r.y, r.y + r.h);
  return dist(cx, cy, nx, ny) < cr;
}
// Segment vs rect intersection (for line-of-sight blocking by bushes)
function segIntersectsRect(x1, y1, x2, y2, r) {
  // check if either endpoint inside, or segment crosses any of the 4 edges
  if (x1 >= r.x && x1 <= r.x + r.w && y1 >= r.y && y1 <= r.y + r.h) return true;
  if (x2 >= r.x && x2 <= r.x + r.w && y2 >= r.y && y2 <= r.y + r.h) return true;
  const edges = [
    [r.x, r.y, r.x + r.w, r.y],
    [r.x + r.w, r.y, r.x + r.w, r.y + r.h],
    [r.x + r.w, r.y + r.h, r.x, r.y + r.h],
    [r.x, r.y + r.h, r.x, r.y],
  ];
  for (const [ex1, ey1, ex2, ey2] of edges) {
    if (segSegIntersect(x1, y1, x2, y2, ex1, ey1, ex2, ey2)) return true;
  }
  return false;
}
function segSegIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
  const d = (x2 - x1) * (y4 - y3) - (y2 - y1) * (x4 - x3);
  if (d === 0) return false;
  const t = ((x3 - x1) * (y4 - y3) - (y3 - y1) * (x4 - x3)) / d;
  const u = ((x3 - x1) * (y2 - y1) - (y3 - y1) * (x2 - x1)) / d;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

/* ---------- Input ---------- */
const keys = {};
window.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) e.preventDefault();
  if (e.key.toLowerCase() === 'p') togglePause();
  if (e.key.toLowerCase() === 'r' && state.mode === 'playing') restartLevel();
  if (e.key.toLowerCase() === 'c') state.showCollision = !state.showCollision;
  if (e.key === ' ' && !e.repeat && state.mode === 'playing') toggleVan();
});
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

/* ---------- Game state ---------- */
const state = {
  mode: 'loading', // loading, menu, howto, levelintro, playing, caught, paused, busted, gameover, levelcomplete, win
  level: 0,     // 0-indexed
  lives: 3,
  world: null,
  camX: 0,
  camY: 0,
  lastTime: 0,
  suspicionDisplay: 0,
  // brief "caught" cutscene: the offending dog lunges at the player and
  // bites before the busted overlay pops up, instead of an instant cut
  caughtDog: null,
  caughtTimer: 0,
  caughtDuration: 0.9,
  caughtMsg: '',
  caughtStartX: 0,
  caughtStartY: 0,
  shakeMag: 0,
  showCollision: false, // C toggles the obstacle-rectangle overlay
};

function screens() {
  return {
    loading: document.getElementById('screen-loading'),
    menu: document.getElementById('screen-menu'),
    howto: document.getElementById('screen-howto'),
    levelintro: document.getElementById('screen-levelintro'),
    busted: document.getElementById('screen-busted'),
    gameover: document.getElementById('screen-gameover'),
    levelcomplete: document.getElementById('screen-levelcomplete'),
    win: document.getElementById('screen-win'),
    pause: document.getElementById('screen-pause'),
  };
}
function showOnly(name) {
  const s = screens();
  for (const k in s) s[k].classList.add('hidden');
  if (name && s[name]) s[name].classList.remove('hidden');
}

/* ---------- Level / world generation ---------- */
function buildWorld(levelIndex) {
  const cfg = LEVELS[levelIndex];
  const houses = [];
  const crossStreets = [];
  const vans = [];
  const worldW = WORLD_W;

  // stack lots downward: lot, then the street along its front edge, repeat
  let cursorY = MARGIN_TOP;
  for (let i = 0; i < cfg.houses; i++) {
    const lot = LOT_TYPES[i % LOT_TYPES.length];
    houses.push(makeHouse(lot, Math.round((worldW - lot.w) / 2), cursorY, cfg, i));
    const streetY0 = cursorY + lot.h;
    crossStreets.push({ y0: streetY0, y1: streetY0 + STREET_W });
    // A van waits on every street. The streets are separated by the lots
    // with no road joining them, so a single van could only ever serve the
    // two properties either side of its own street.
    vans.push({
      x: Math.round(worldW * (i % 2 ? 0.68 : 0.32)),
      y: streetY0 + STREET_W / 2,
      band: { y0: streetY0, y1: streetY0 + STREET_W },
      facing: i % 2 ? -1 : 1,
      moving: false,
    });
    cursorY = streetY0 + STREET_W;
  }

  const worldH = cursorY + MARGIN_BOTTOM;
  const totalMail = houses.length;

  // static decorative elements, precomputed once so they don't flicker/jitter each frame
  const roadSpeckles = [];
  for (const band of crossStreets) {
    const count = Math.round(worldW / 16);
    for (let i = 0; i < count; i++) {
      roadSpeckles.push({
        x: Math.random() * worldW,
        y: band.y0 + 34 + Math.random() * (STREET_W - 68),
        r: 1 + Math.random() * 1.8,
        a: 0.05 + Math.random() * 0.08,
      });
    }
  }
  const clouds = [];
  for (let i = 0; i < 4; i++) {
    clouds.push({ x: 80 + Math.random() * (worldW - 160), y: 10 + Math.random() * 60, s: 0.7 + Math.random() * 0.6 });
  }

  // A dense hedgerow hugging both edges of every lot, so the leftover verge
  // beside a narrow lot reads as the neighbours' hedges rather than a void.
  const verge = [], tufts = [];
  const shades = [['#5aa353', '#2f6b34'], ['#68b25f', '#356f38'], ['#4f9a4a', '#2a5f2f']];
  for (const h of houses) {
    const lotL = h.rect.x, lotR = h.rect.x + h.rect.w;
    for (const [edgeX, dir] of [[lotL, -1], [lotR, 1]]) {
      const gap = dir < 0 ? lotL : worldW - lotR;
      if (gap < 26) continue;
      const hedgeX = edgeX + dir * Math.min(22, gap * 0.4);
      for (let y = h.rect.y - 6; y < h.rect.y + h.rect.h + 6; y += 15) {
        const [light, dark] = shades[Math.floor(Math.random() * shades.length)];
        verge.push({ x: hedgeX + (Math.random() - 0.5) * 10, y, r: 17 + Math.random() * 7, light, dark });
      }
      const gapX0 = dir < 0 ? 0 : lotR;
      for (let i = 0; i < Math.round(gap / 3); i++) {
        tufts.push({ x: gapX0 + Math.random() * gap, y: h.rect.y + Math.random() * h.rect.h, rot: Math.random() * Math.PI });
      }
    }
  }

  const startX = worldW / 2;
  return {
    cfg,
    houses,
    worldW,
    worldH,
    crossStreets,
    vans,
    totalMail,
    delivered: 0,
    decor: { roadSpeckles, clouds, verge, tufts },
    player: {
      x: startX,
      y: MARGIN_TOP - 32,
      r: PLAYER_R,
      speed: 130,
      sneakSpeed: 78,
      facing: Math.PI / 2,
      facingLeft: false,
      sneaking: false,
      moving: false,
      animFrame: 0,
      animTimer: 0,
    },
    startPlayer: { x: startX, y: MARGIN_TOP - 32 },
  };
}

// Places one lot at (lotX, topY): the scene image is drawn as-is, and its
// authored obstacle rectangles are translated into world space so the decor
// baked into the art actually blocks movement. The yard -- everything on the
// lot below the building -- is the play space the dog patrols.
function makeHouse(lot, lotX, topY, cfg, index) {
  const rect = { x: lotX, y: topY, w: lot.w, h: lot.h };
  const toWorld = (r) => ({ x: lotX + r.x, y: topY + r.y, w: r.w, h: r.h });

  const wallRect = toWorld(lot.house);
  const solids = [{ ...wallRect, sight: true }, ...lot.solids.map((s) => ({ ...toWorld(s), sight: !!s.sight }))];
  // sight blockers double as the "hide behind this" cover the dogs can't see through
  const bushes = solids.filter((s) => s.sight);

  const mailbox = {
    x: lotX + lot.mailbox.x,
    y: topY + lot.mailbox.y,
    delivered: false, r: 18,
    style: MAILBOX_STYLES[index % MAILBOX_STYLES.length],
  };
  // In most of the lot art the mailbox stands right against the porch, so
  // its authored point falls inside the house's own collision rect -- the
  // player can never physically get within delivery range of it. Keep the
  // sprite where it was drawn, but deliver against a separate trigger point
  // nudged out to the nearest walkable edge, so walking up to the porch
  // counts. Repeated because the pushed-out point can land in another solid.
  mailbox.tx = mailbox.x;
  mailbox.ty = mailbox.y;
  for (let pass = 0; pass < 4; pass++) {
    const blocker = solids.find((s) => circleRectOverlap(mailbox.tx, mailbox.ty, PLAYER_R + 2, s));
    if (!blocker) break;
    const out = PLAYER_R + 6;
    const cand = [
      { x: blocker.x - out, y: mailbox.ty },
      { x: blocker.x + blocker.w + out, y: mailbox.ty },
      { x: mailbox.tx, y: blocker.y - out },
      { x: mailbox.tx, y: blocker.y + blocker.h + out },
    ];
    // prefer the shortest shove, so the trigger stays beside the drawn sprite
    cand.sort((a, b) => dist(a.x, a.y, mailbox.x, mailbox.y) - dist(b.x, b.y, mailbox.x, mailbox.y));
    const clear = cand.find((c) => !solids.some((s) => circleRectOverlap(c.x, c.y, PLAYER_R + 2, s)));
    const pick = clear || cand[0];
    mailbox.tx = pick.x;
    mailbox.ty = pick.y;
  }

  // the open ground in front of the house, where the dog roams and the
  // player has to pick a route through the decor
  const yardRect = {
    x: lotX + 8,
    y: wallRect.y + wallRect.h - topY > 0 ? wallRect.y + wallRect.h : topY,
    w: lot.w - 16,
    h: 0,
  };
  yardRect.h = (topY + lot.sidewalkY) - yardRect.y - 6;

  const dogs = [];
  const dogCount = index < cfg.doubleDogHouses ? 2 : 1;
  for (let d = 0; d < dogCount; d++) {
    const breedKey = cfg.breeds[Math.floor(Math.random() * cfg.breeds.length)];
    const breed = BREEDS[breedKey];
    // start clear of the decor, or the dog would begin its patrol wedged
    // inside a solid it can never step out of
    const dogR = 12 * breed.size;
    let sx = clamp(lotX + lot.dogSpawn.x + (d === 0 ? 0 : 70), yardRect.x + 20, yardRect.x + yardRect.w - 20);
    let sy = clamp(topY + lot.dogSpawn.y, yardRect.y + 20, yardRect.y + yardRect.h - 20);
    for (let attempt = 0; attempt < 24 && solids.some((s) => circleRectOverlap(sx, sy, dogR, s)); attempt++) {
      sx = yardRect.x + 20 + Math.random() * (yardRect.w - 40);
      sy = yardRect.y + 20 + Math.random() * (yardRect.h - 40);
    }
    dogs.push({
      breedKey, breed,
      x: sx,
      y: sy,
      angle: Math.PI / 2,
      baseAngle: Math.PI / 2,
      suspicion: 0,
      state: 'awake',
      sleepTimer: breed.behavior === 'sleepy' ? 2 + Math.random() * 2 : 0,
      sweepT: Math.random() * Math.PI * 2,
      seen: false,
      animTimer: Math.random() * 0.18,
      animFrame: Math.random() < 0.5 ? 0 : 1,
    });
  }

  return { index, lot, rect, wallRect, yardRect, solids, bushes, mailbox, dogs };
}

/* ---------- Level flow ---------- */
function startGame() {
  state.level = 0;
  state.lives = 3;
  goToLevelIntro();
}

function goToLevelIntro() {
  state.world = buildWorld(state.level);
  const cfg = LEVELS[state.level];
  document.getElementById('li-title').textContent = `Street ${state.level + 1} of ${LEVELS.length}`;
  document.getElementById('li-desc').textContent = cfg.desc;
  const chipWrap = document.getElementById('li-breeds');
  chipWrap.innerHTML = '';
  cfg.breeds.forEach((k) => {
    const chip = document.createElement('span');
    chip.className = 'breed-chip';
    chip.textContent = BREEDS[k].name;
    chipWrap.appendChild(chip);
  });
  document.getElementById('li-tutorial').style.display = state.level === 0 ? 'block' : 'none';
  state.mode = 'levelintro';
  showOnly('levelintro');
  updateHud();
}

function beginPlaying() {
  state.mode = 'playing';
  showOnly(null);
  state.lastTime = performance.now();
}

function restartLevel() {
  state.world = buildWorld(state.level);
  beginPlaying();
}

function loseLife(msg) {
  state.lives--;
  updateHud();
  if (state.lives <= 0) {
    state.mode = 'gameover';
    showOnly('gameover');
  } else {
    document.getElementById('busted-msg').textContent = msg;
    state.mode = 'busted';
    showOnly('busted');
  }
}

function levelComplete() {
  state.mode = 'levelcomplete';
  document.getElementById('lc-msg').textContent =
    `Every mailbox on Street ${state.level + 1} served without a single bark.`;
  showOnly('levelcomplete');
}

function nextLevel() {
  state.level++;
  if (state.level >= LEVELS.length) {
    state.mode = 'win';
    showOnly('win');
  } else {
    goToLevelIntro();
  }
}

function updateHud() {
  document.getElementById('hud-level').textContent = `Level ${state.level + 1}/${LEVELS.length}`;
  const w = state.world;
  document.getElementById('hud-mail').textContent = w ? `Mail ${w.delivered}/${w.totalMail}` : 'Mail 0/0';
  document.getElementById('hud-lives').textContent = '❤'.repeat(Math.max(0, state.lives));
}

function togglePause() {
  if (state.mode === 'playing') {
    state.mode = 'paused';
    showOnly('pause');
  } else if (state.mode === 'paused') {
    state.mode = 'playing';
    showOnly(null);
    state.lastTime = performance.now();
  }
}

/* ---------- Update ---------- */
// Climbing in and out of the mail van. The carrier is invisible to the dogs
// while inside it, but can't deliver from the driver's seat either -- the
// mailboxes are all up at the houses, so the van only ever gets you to the
// kerb faster.
function toggleVan() {
  const w = state.world;
  if (!w) return;
  const p = w.player;
  if (p.van) {
    // step out onto the kerb side, or the other side if that's blocked
    const van = p.van;
    const spots = [
      { x: van.x, y: van.band.y1 + 16 },
      { x: van.x, y: van.band.y0 - 16 },
      { x: van.x - 46, y: van.y },
      { x: van.x + 46, y: van.y },
    ];
    const clear = spots.find((sp) => !w.houses.some((h) => h.solids.some((sd) => circleRectOverlap(sp.x, sp.y, p.r, sd))));
    const out = clear || spots[0];
    p.x = clamp(out.x, p.r, w.worldW - p.r);
    p.y = clamp(out.y, p.r, w.worldH - p.r);
    p.van = null;
    return;
  }
  const near = w.vans.find((v) => dist(p.x, p.y, v.x, v.y) < VAN_ENTER_R);
  if (near) { p.van = near; p.x = near.x; p.y = near.y; }
}

// True while the carrier is close enough to climb into a van on foot.
function vanInReach(w) {
  const p = w.player;
  if (p.van) return null;
  return w.vans.find((v) => dist(p.x, p.y, v.x, v.y) < VAN_ENTER_R) || null;
}

function updateVan(dt) {
  const w = state.world;
  const p = w.player;
  const van = p.van;
  let dx = 0, dy = 0;
  if (keys['arrowup'] || keys['w']) dy -= 1;
  if (keys['arrowdown'] || keys['s']) dy += 1;
  if (keys['arrowleft'] || keys['a']) dx -= 1;
  if (keys['arrowright'] || keys['d']) dx += 1;
  van.moving = dx !== 0 || dy !== 0;
  if (van.moving) {
    const len = Math.hypot(dx, dy);
    van.x = clamp(van.x + (dx / len) * VAN_SPEED * dt, 60, w.worldW - 60);
    // the van stays on the tarmac -- it can drive the length of its street
    // but never up onto a lawn
    van.y = clamp(van.y + (dy / len) * VAN_SPEED * dt, van.band.y0 + 34, van.band.y1 - 24);
    if (dx !== 0) van.facing = dx < 0 ? -1 : 1;
  }
  p.x = van.x; p.y = van.y;
}

function updatePlayer(dt) {
  const w = state.world;
  const p = w.player;
  if (p.van) { updateVan(dt); return; }   // no walking, and no delivering, from the driver's seat
  let dx = 0, dy = 0;
  if (keys['arrowup'] || keys['w']) dy -= 1;
  if (keys['arrowdown'] || keys['s']) dy += 1;
  if (keys['arrowleft'] || keys['a']) dx -= 1;
  if (keys['arrowright'] || keys['d']) dx += 1;

  p.sneaking = !!keys['shift'];
  p.moving = dx !== 0 || dy !== 0;

  if (p.moving) {
    const len = Math.hypot(dx, dy);
    dx /= len; dy /= len;
    p.facing = Math.atan2(dy, dx);
    if (dx !== 0) p.facingLeft = dx < 0;
    const spd = p.sneaking ? p.sneakSpeed : p.speed;
    const nx = p.x + dx * spd * dt;
    const ny = p.y + dy * spd * dt;

    // collide vs house walls only (yards, street, sidewalks are all walkable)
    let blockedX = false, blockedY = false;
    for (const h of w.houses) {
      for (const s of h.solids) {
        if (circleRectOverlap(nx, p.y, p.r, s)) blockedX = true;
        if (circleRectOverlap(p.x, ny, p.r, s)) blockedY = true;
      }
    }
    p.x = blockedX ? p.x : clamp(nx, p.r, w.worldW - p.r);
    p.y = blockedY ? p.y : clamp(ny, p.r, w.worldH - p.r);
  }

  if (p.moving) {
    p.animTimer += dt;
    const frameDur = p.sneaking ? 0.22 : 0.14;
    if (p.animTimer > frameDur) { p.animTimer = 0; p.animFrame = 1 - p.animFrame; }
  } else {
    p.animFrame = 0;
    p.animTimer = 0;
  }

  // mailbox delivery
  for (const h of w.houses) {
    if (!h.mailbox.delivered && dist(p.x, p.y, h.mailbox.tx, h.mailbox.ty) < h.mailbox.r + p.r) {
      h.mailbox.delivered = true;
      w.delivered++;
      updateHud();
    }
  }
  if (w.delivered >= w.totalMail) {
    levelComplete();
  }
}

function updateDog(dog, house, dt, w) {
  const breed = dog.breed;

  dog.animTimer += dt;
  const animDur = dog.state === 'asleep' ? 0.55 : 0.18;
  if (dog.animTimer > animDur) { dog.animTimer = 0; dog.animFrame = 1 - dog.animFrame; }

  if (breed.behavior === 'sleepy') {
    if (dog.state === 'asleep') {
      dog.sleepTimer -= dt;
      if (dog.sleepTimer <= 0) { dog.state = 'awake'; dog.sleepTimer = 3 + Math.random() * 3; }
      return; // blind while asleep
    } else {
      dog.sleepTimer -= dt;
      if (dog.sleepTimer <= 0) { dog.state = 'asleep'; dog.sleepTimer = 1.5 + Math.random() * 1.5; }
    }
  }

  // Alert lock-on. While the dog can actually see the player it drops its
  // patrol, turns to track them and closes a little distance -- it never
  // leaves the yard it guards. After the player breaks line of sight it
  // keeps staring at where they were for a moment before resuming its
  // roam, so slipping behind cover doesn't instantly reset it.
  const target = w.player;
  if (dog.seen) {
    dog.alertX = target.x;
    dog.alertY = target.y;
    dog.lostTimer = 1.4;
  }
  if (dog.lostTimer > 0) {
    dog.lostTimer -= dt;
    const want = Math.atan2(dog.alertY - dog.y, dog.alertX - dog.x);
    dog.angle = turnToward(dog.angle, want, 7 * dt);
    dog.wanderPhase = 'paused';        // drop the patrol; re-picked on resume
    dog.wanderTimer = 0.25;
    if (dog.seen) {
      const dogR = 12 * breed.size;
      const dx = target.x - dog.x, dy = target.y - dog.y;
      const d = Math.hypot(dx, dy);
      if (d > 26) {                    // stalk closer, but don't sit on top of them
        const step = breed.speed * 0.5 * dt;
        const nx = dog.x + (dx / d) * step;
        const ny = dog.y + (dy / d) * step;
        const yr0 = house.yardRect;
        if (!house.solids.some((s) => circleRectOverlap(nx, dog.y, dogR, s))
            && nx > yr0.x + 8 && nx < yr0.x + yr0.w - 8) dog.x = nx;
        if (!house.solids.some((s) => circleRectOverlap(dog.x, ny, dogR, s))
            && ny > yr0.y + 8 && ny < yr0.y + yr0.h - 8) dog.y = ny;
      }
    }
    return;
  }

  // Dogs roam freely around the whole yard: walk to a random point inside
  // it, pause there for a bit (swaying/sweeping their gaze), then pick a
  // new point. Behavior still gives each breed a distinct feel: 'sentry'
  // lingers longest and moves slowest, 'erratic' barely pauses and moves
  // fastest, 'pace' sits in between.
  const yr = house.yardRect;
  const margin = 20;
  if (dog.wanderPhase === undefined) { dog.wanderPhase = 'paused'; dog.wanderTimer = 0; }

  if (dog.wanderPhase === 'paused') {
    dog.sweepT += dt * (breed.speed / 40);
    dog.angle = dog.baseAngle + Math.sin(dog.sweepT) * 0.6;
    dog.wanderTimer -= dt;
    if (dog.wanderTimer <= 0) {
      // aim for a spot that isn't inside a tree/bench/fountain, so the dog
      // doesn't spend its patrol shoving against a solid it can't enter
      const dogR = 12 * breed.size;
      let tx = 0, ty = 0;
      for (let attempt = 0; attempt < 8; attempt++) {
        tx = yr.x + margin + Math.random() * (yr.w - margin * 2);
        ty = yr.y + margin + Math.random() * (yr.h - margin * 2);
        if (!house.solids.some((s) => circleRectOverlap(tx, ty, dogR, s))) break;
      }
      dog.wanderX = tx;
      dog.wanderY = ty;
      dog.wanderPhase = 'moving';
      dog.wanderTimer = 5 + Math.random() * 3; // failsafe: give up and re-pause if travel takes too long
    }
  } else {
    const dx = dog.wanderX - dog.x, dy = dog.wanderY - dog.y;
    const d = Math.hypot(dx, dy);
    dog.wanderTimer -= dt;
    if (d > 4 && dog.wanderTimer > 0) {
      const speedMul = breed.behavior === 'sentry' ? 0.55 : breed.behavior === 'erratic' ? 1.0 : 0.75;
      const dogR = 12 * breed.size;
      const step = breed.speed * speedMul * dt;
      const nx = dog.x + (dx / d) * step;
      const ny = dog.y + (dy / d) * step;
      // slide along obstacles per-axis rather than walking through them
      const blockedX = house.solids.some((s) => circleRectOverlap(nx, dog.y, dogR, s));
      const blockedY = house.solids.some((s) => circleRectOverlap(dog.x, ny, dogR, s));
      if (!blockedX) dog.x = nx;
      if (!blockedY) dog.y = ny;
      if (blockedX && blockedY) dog.wanderTimer = 0; // fully stuck: pick a new target
      dog.angle = Math.atan2(dy, dx);
    } else {
      dog.wanderPhase = 'paused';
      const pauseRange = breed.behavior === 'sentry' ? [1.8, 3.5] : breed.behavior === 'erratic' ? [0.25, 0.8] : [0.6, 1.8];
      dog.wanderTimer = pauseRange[0] + Math.random() * (pauseRange[1] - pauseRange[0]);
    }
  }

  // clamp dog inside yard (defensive, in case a wander target lands outside due to a tiny yard)
  dog.x = clamp(dog.x, yr.x + 8, yr.x + yr.w - 8);
  dog.y = clamp(dog.y, yr.y + 8, yr.y + yr.h - 8);
}

function canSeePlayer(dog, house, p) {
  if (dog.state === 'asleep') return false;
  if (p.van) return false;               // shut inside the van, out of sight
  const breed = dog.breed;
  const d = dist(dog.x, dog.y, p.x, p.y);

  let nearRadius = breed.nearRadius;
  if (p.sneaking) nearRadius *= 0.7;
  let range = breed.range;
  if (p.sneaking) range *= 0.7;
  if (d > range) return false;

  // Inside the near-field radius the dog notices the player in any
  // direction (hearing/smell close up); beyond it, only within the
  // forward vision cone.
  if (d > nearRadius) {
    const angToPlayer = Math.atan2(p.y - dog.y, p.x - dog.x);
    const diff = Math.abs(normAngle(angToPlayer - dog.angle));
    let halfCone = (breed.coneDeg * Math.PI / 180) / 2;
    if (p.sneaking) halfCone *= 0.85;
    if (diff > halfCone) return false;
  }

  // line of sight blocked by bushes?
  for (const b of house.bushes) {
    if (segIntersectsRect(dog.x, dog.y, p.x, p.y, b)) return false;
  }
  return true;
}

function updateDogsAndDetection(dt) {
  const w = state.world;
  const p = w.player;
  let maxSuspicion = 0;
  let caughtBy = null;

  for (const h of w.houses) {
    for (const dog of h.dogs) {
      updateDog(dog, h, dt, w);
      const seen = canSeePlayer(dog, h, p);
      dog.seen = seen;
      if (seen) {
        const rate = breedFillRate(dog.breed, p.sneaking);
        dog.suspicion = clamp(dog.suspicion + rate * dt, 0, 1);
      } else {
        dog.suspicion = clamp(dog.suspicion - 0.55 * dt, 0, 1);
      }
      if (dog.suspicion > maxSuspicion) maxSuspicion = dog.suspicion;
      if (dog.suspicion >= 1) caughtBy = dog;
    }
  }

  state.suspicionDisplay = maxSuspicion;
  document.getElementById('suspicion-bar').style.width = `${Math.round(maxSuspicion * 100)}%`;

  if (caughtBy) {
    triggerCaught(caughtBy);
  }
}

// The moment a dog's suspicion maxes out, it lunges at the player and bites
// -- a brief cutscene (dog rushes in, screen flash + shake) instead of an
// instant cut to the busted overlay.
function triggerCaught(dog) {
  state.mode = 'caught';
  state.caughtDog = dog;
  state.caughtTimer = 0;
  state.caughtStartX = dog.x;
  state.caughtStartY = dog.y;
  state.caughtMsg = `A ${dog.breed.name} caught you and took a bite!`;
  state.shakeMag = 0;
}

function updateCaughtAnim(dt) {
  const dog = state.caughtDog;
  if (!dog) return; // already resolved this cutscene (e.g. loop fired once more before the mode switch took effect)
  const p = state.world.player;
  state.caughtTimer += dt;
  const t = clamp(state.caughtTimer / state.caughtDuration, 0, 1);

  // lunge: the dog rushes from where it was to the player over the first
  // ~45% of the cutscene, easing out so the "bite" lands with a snap
  const lungeT = clamp(t / 0.45, 0, 1);
  const ease = 1 - Math.pow(1 - lungeT, 3);
  dog.x = state.caughtStartX + (p.x - state.caughtStartX) * ease;
  dog.y = state.caughtStartY + (p.y - state.caughtStartY) * ease;
  dog.angle = Math.atan2(p.y - dog.y, p.x - dog.x);
  dog.suspicion = 1;

  state.shakeMag = (t >= 0.45 && t < 0.75) ? 7 * (1 - (t - 0.45) / 0.3) : 0;

  if (state.caughtTimer >= state.caughtDuration) {
    const msg = state.caughtMsg;
    state.caughtDog = null;
    state.shakeMag = 0;
    loseLife(msg);
  }
}

// Screen-space flash + a "bite" burst over the player at the moment of
// impact, drawn after the world is restored so it isn't affected by camera
// shake/pan.
function drawCaughtOverlay() {
  const t = clamp(state.caughtTimer / state.caughtDuration, 0, 1);
  if (t < 0.4 || t > 0.68) return;
  const bite = clamp((t - 0.4) / 0.1, 0, 1); // 0->1 over the impact window, then holds
  const fade = t > 0.55 ? 1 - (t - 0.55) / 0.13 : 1;

  ctx.fillStyle = `rgba(200,20,20,${0.4 * bite * fade})`;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  const p = state.world.player;
  const sx = p.x - state.camX, sy = p.y - state.camY;
  ctx.save();
  ctx.globalAlpha = bite * fade;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(sx + Math.cos(a) * 10, sy + Math.sin(a) * 10);
    ctx.lineTo(sx + Math.cos(a) * 22, sy + Math.sin(a) * 22);
    ctx.stroke();
  }
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 3;
  ctx.strokeText('CHOMP!', sx, sy - 30);
  ctx.fillText('CHOMP!', sx, sy - 30);
  ctx.restore();
}
function breedFillRate(breed, sneaking) {
  return sneaking ? breed.fillRate * 0.5 : breed.fillRate;
}

/* ---------- Camera ---------- */
function updateCamera() {
  const w = state.world;
  const p = w.player;
  const targetX = clamp(p.x - VIEW_W / 2, 0, Math.max(0, w.worldW - VIEW_W));
  const targetY = clamp(p.y - VIEW_H / 2, 0, Math.max(0, w.worldH - VIEW_H));
  state.camX += (targetX - state.camX) * 0.15;
  state.camY += (targetY - state.camY) * 0.15;
}

/* ---------- Rendering ---------- */
function draw() {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  if (!state.world) return;
  const w = state.world;

  // a brief camera shake sells the impact when a dog bites the player
  const shakeX = state.shakeMag ? (Math.random() - 0.5) * state.shakeMag : 0;
  const shakeY = state.shakeMag ? (Math.random() - 0.5) * state.shakeMag : 0;

  ctx.save();
  ctx.translate(-state.camX + shakeX, -state.camY + shakeY);

  drawBackground(w);
  drawRoad(w);
  for (const h of w.houses) drawLotGround(h);
  for (const h of w.houses) drawMailbox(h.mailbox);

  // vision cones on top of scenery, under the characters
  for (const h of w.houses) for (const dog of h.dogs) drawVisionCone(dog);

  // Props and characters share one depth-sorted pass, keyed on where each
  // one meets the ground, so the player walks behind a house or bush that
  // stands below them and in front of anything above.
  const layer = [];
  for (const h of w.houses) {
    for (const item of h.lot.items) {
      layer.push({ y: h.rect.y + item.y, draw: () => drawProp(item, h.rect.x, h.rect.y) });
    }
    for (const dog of h.dogs) layer.push({ y: dog.y, draw: () => drawDog(dog) });
  }
  for (const van of w.vans) layer.push({ y: van.y + VAN_H / 2, draw: () => drawVan(van) });
  // the carrier is inside the van, so the van sprite stands in for them
  if (!w.player.van) layer.push({ y: w.player.y, draw: () => drawPlayer(w.player) });
  layer.sort((a, b) => a.y - b.y);
  for (const it of layer) it.draw();

  if (state.showCollision) drawCollisionDebug(w);

  ctx.restore();

  const reach = vanInReach(w);
  if (reach) {
    const sx = reach.x - state.camX, sy = reach.y - state.camY - VAN_H / 2 - 14;
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    const label = 'SPACE to drive';
    const tw = ctx.measureText(label).width;
    ctx.fillStyle = 'rgba(12,16,14,0.82)';
    ctx.fillRect(sx - tw / 2 - 9, sy - 15, tw + 18, 21);
    ctx.fillStyle = '#e8b04b';
    ctx.fillText(label, sx, sy);
  } else if (w.player.van) {
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    const label = 'SPACE to hop out';
    const tw = ctx.measureText(label).width;
    const sx = w.player.x - state.camX, sy = w.player.y - state.camY - VAN_H / 2 - 14;
    ctx.fillStyle = 'rgba(12,16,14,0.82)';
    ctx.fillRect(sx - tw / 2 - 9, sy - 15, tw + 18, 21);
    ctx.fillStyle = '#e8b04b';
    ctx.fillText(label, sx, sy);
  }

  if (state.mode === 'caught') drawCaughtOverlay();
}

function drawBackground(w) {
  // tiled turf across the whole world; flat green if the tile is missing
  fillTiled('grass', 0, 0, w.worldW, w.worldH, '#4f8a4b');
  // sky strip above the first row, with a soft gradient and drifting clouds
  const skyH = SKY_H;
  const sky = ctx.createLinearGradient(0, 0, 0, skyH);
  sky.addColorStop(0, '#8fd0e8');
  sky.addColorStop(1, '#4f8a4b');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w.worldW, skyH);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (const c of w.decor.clouds) {
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, 26 * c.s, 12 * c.s, 0, 0, Math.PI * 2);
    ctx.ellipse(c.x + 20 * c.s, c.y + 4 * c.s, 18 * c.s, 10 * c.s, 0, 0, Math.PI * 2);
    ctx.ellipse(c.x - 18 * c.s, c.y + 5 * c.s, 16 * c.s, 9 * c.s, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Lots vary in width, so the grass verge beside a narrow one would read as
  // a dead void. A hedgerow down both outer edges plus scattered tufts frames
  // the route and makes that margin look like the neighbours' back hedges.
  for (const v of w.decor.verge) {
    const grad = ctx.createRadialGradient(v.x - v.r * 0.3, v.y - v.r * 0.3, 1, v.x, v.y, v.r * 1.1);
    grad.addColorStop(0, v.light);
    grad.addColorStop(1, v.dark);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(v.x, v.y, v.r, v.r * 0.82, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = 1.3;
  for (const t of w.decor.tufts) {
    ctx.beginPath();
    ctx.moveTo(t.x, t.y);
    ctx.lineTo(t.x + Math.cos(t.rot) * 5, t.y + Math.sin(t.rot) * 5 - 3);
    ctx.stroke();
  }
}

// One lot = one hand-drawn scene image. Everything in it (house, trees,
// benches, fountain, its own stone path and sidewalk) is baked into the art;
// the matching collision rectangles live in LOT_TYPES.
// The ground of a lot: turf, with the sidewalk running along its frontage.
// Props are not drawn here -- they go through the depth-sorted pass so the
// player can walk behind them.
function drawLotGround(h) {
  const r = h.rect;
  fillTiled('grass', r.x, r.y, r.w, r.h, '#5fa85a');
  const walkY = r.y + h.lot.sidewalkY;
  if (!drawStripX('sidewalk', r.x, walkY, r.w, SIDEWALK_H)) {
    ctx.fillStyle = '#b8b09a';
    ctx.fillRect(r.x, walkY, r.w, SIDEWALK_H);
  }
}

// Repeats a strip tile horizontally across `w`, scaled to `h` tall, clipped
// so a partial tile at the end doesn't spill past the run.
function drawStripX(key, x, y, w, h) {
  const img = IMAGES[`tiles.${key}`];
  if (!img || !img.complete || !img.naturalHeight) return false;
  const tw = Math.max(1, Math.round(img.naturalWidth * (h / img.naturalHeight)));
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  for (let dx = 0; dx < w; dx += tw) ctx.drawImage(img, x + dx, y, tw, h);
  ctx.restore();
  return true;
}

// One prop placement, drawn bottom-centre at its ground point.
function drawProp(item, ox, oy) {
  const img = IMAGES[`props.${item.prop}`];
  if (!img || !img.complete || !img.naturalHeight) return;
  const dispH = PROPS[item.prop].h * (item.scale || 1);
  const dispW = dispH * (img.naturalWidth / img.naturalHeight);
  ctx.drawImage(img, ox + item.x - dispW / 2, oy + item.y - dispH, dispW, dispH);
}

// Toggled with the C key -- overlays the authored obstacle rectangles so
// mismatches between the art and its collision can be spotted directly.
function drawCollisionDebug(w) {
  for (const h of w.houses) {
    for (const s of h.solids) {
      ctx.fillStyle = s.sight ? 'rgba(0,255,0,0.25)' : 'rgba(0,120,255,0.25)';
      ctx.fillRect(s.x, s.y, s.w, s.h);
      ctx.strokeStyle = s.sight ? '#0f0' : '#08f';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(s.x, s.y, s.w, s.h);
    }
    const y = h.yardRect;
    ctx.strokeStyle = '#ff0';
    ctx.lineWidth = 2;
    ctx.strokeRect(y.x, y.y, y.w, y.h);
  }
}

function drawSidewalkPavers(x0, y0, w, h, vertical) {
  ctx.strokeStyle = 'rgba(120,112,96,0.4)';
  ctx.lineWidth = 1;
  const step = 26;
  if (vertical) {
    for (let y = y0 - (y0 % step); y < y0 + h; y += step) {
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + w, y); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(x0 + w / 2, y0); ctx.lineTo(x0 + w / 2, y0 + h); ctx.stroke();
  } else {
    for (let x = x0 - (x0 % step); x < x0 + w; x += step) {
      ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y0 + h); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(x0, y0 + h / 2); ctx.lineTo(x0 + w, y0 + h / 2); ctx.stroke();
  }
}

function drawHorizontalStreet(streetY0, worldW) {
  const y0 = streetY0, y1 = streetY0 + STREET_W;
  ctx.fillStyle = '#bdb6a2';
  ctx.fillRect(0, y0, worldW, STREET_W);
  drawSidewalkPavers(0, y0, worldW, 30, false);
  drawSidewalkPavers(0, y1 - 30, worldW, 30, false);
  const asphalt = ctx.createLinearGradient(0, y0 + 30, 0, y1 - 30);
  asphalt.addColorStop(0, '#494c4f');
  asphalt.addColorStop(0.5, '#5a5e62');
  asphalt.addColorStop(1, '#494c4f');
  ctx.fillStyle = asphalt;
  ctx.fillRect(0, y0 + 30, worldW, STREET_W - 60);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, y0 + 30); ctx.lineTo(worldW, y0 + 30); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, y1 - 30); ctx.lineTo(worldW, y1 - 30); ctx.stroke();
  ctx.strokeStyle = '#ecc94a';
  ctx.lineWidth = 3;
  ctx.setLineDash([16, 12]);
  ctx.beginPath(); ctx.moveTo(0, y0 + STREET_W / 2); ctx.lineTo(worldW, y0 + STREET_W / 2); ctx.stroke();
  ctx.setLineDash([]);
}

function drawRoad(w) {
  for (const band of w.crossStreets) {
    drawHorizontalStreet(band.y0, w.worldW);
  }

  // asphalt speckle texture
  for (const sp of w.decor.roadSpeckles) {
    ctx.fillStyle = `rgba(255,255,255,${sp.a})`;
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // a drain cover sits at each end of every street
  for (const band of w.crossStreets) {
    const cy = band.y0 + STREET_W / 2;
    for (const cx of [70, w.worldW - 70]) {
      const grad = ctx.createRadialGradient(cx - 3, cy - 3, 1, cx, cy, 11);
      grad.addColorStop(0, '#7c7870');
      grad.addColorStop(1, '#3a3834');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(cx, cy, 11, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 1;
      for (let a = 0; a < Math.PI; a += Math.PI / 4) {
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * 8, cy + Math.sin(a) * 8);
        ctx.lineTo(cx - Math.cos(a) * 8, cy - Math.sin(a) * 8);
        ctx.stroke();
      }
    }
  }
}

// Mailbox art is a real sprite (one of 12 styles, cycled per house). A small
// procedural flag + checkmark badge is layered on top so "flag up = done"
// reads the same regardless of which mailbox sprite is in use. Every lot
// now faces the street below it, so the sprite's default orientation
// (opening toward the viewer) already reads correctly -- no mirroring.
function drawMailbox(mb) {
  const img = IMAGES[`mailboxes.${mb.style}`];
  const groundY = mb.y + 16;
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.ellipse(mb.x, groundY, 10, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  const dispH = 40;
  ctx.save();
  ctx.translate(mb.x, groundY);
  const dispW = drawSprite(img, 0, 0, dispH, 'bottom') || dispH * 0.7;

  const flagX = dispW * 0.32;
  const topY = -dispH + 4;
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(flagX, topY + 12);
  ctx.lineTo(flagX, topY + (mb.delivered ? 0 : 12));
  ctx.stroke();
  if (mb.delivered) {
    ctx.fillStyle = '#d94141';
    ctx.beginPath();
    ctx.moveTo(flagX, topY);
    ctx.lineTo(flagX + 7, topY + 3);
    ctx.lineTo(flagX, topY + 6);
    ctx.fill();
    ctx.fillStyle = '#3bb54a';
    ctx.beginPath();
    ctx.arc(0, -dispH - 6, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✓', 0, -dispH - 3);
  }
  ctx.restore();
}

// Orients a side-view sprite (drawn facing +x) toward `angle` without ever
// flipping it upside-down: rotating 180° for a leftward angle would mirror
// both axes, so a leftward angle instead mirrors horizontally (scale -1,1)
// and rotates by the much smaller (PI - angle) to reach the same facing.
function rotateFacing(angle) {
  if (Math.cos(angle) < 0) {
    ctx.scale(-1, 1);
    ctx.rotate(Math.PI - angle);
  } else {
    ctx.rotate(angle);
  }
}

function drawVisionCone(dog) {
  const breed = dog.breed;
  const half = (breed.coneDeg * Math.PI / 180) / 2;
  const range = breed.range;
  const grad = ctx.createRadialGradient(dog.x, dog.y, 0, dog.x, dog.y, range);
  const alertness = dog.suspicion;
  const baseColor = dog.state === 'asleep' ? '150,150,150' : (alertness > 0.05 ? '255,80,60' : '255,224,102');
  grad.addColorStop(0, `rgba(${baseColor},${dog.state === 'asleep' ? 0.05 : 0.28})`);
  grad.addColorStop(1, `rgba(${baseColor},0)`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(dog.x, dog.y);
  ctx.arc(dog.x, dog.y, range, dog.angle - half, dog.angle + half);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = `rgba(${baseColor},0.35)`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(dog.x, dog.y);
  ctx.lineTo(dog.x + Math.cos(dog.angle - half) * range, dog.y + Math.sin(dog.angle - half) * range);
  ctx.moveTo(dog.x, dog.y);
  ctx.lineTo(dog.x + Math.cos(dog.angle + half) * range, dog.y + Math.sin(dog.angle + half) * range);
  ctx.stroke();

  // near-field awareness ring: the dog notices the player from any angle
  // this close, regardless of where its cone is pointing
  if (dog.state !== 'asleep') {
    ctx.strokeStyle = `rgba(${baseColor},0.5)`;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.arc(dog.x, dog.y, breed.nearRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawDog(dog) {
  const breed = dog.breed;
  const s = breed.size;
  const dispH = 40 * s;
  const alerted = dog.seen || dog.suspicion > 0.3;
  const cat = dog.state === 'asleep' ? 'sleep' : (alerted ? 'bark' : 'move');
  const frames = dogAnimFrames(dog.breedKey, cat);
  const img = frames.length ? frames[dog.animFrame % frames.length] : IMAGES[`dogs.${dog.breedKey}`];

  // ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(dog.x, dog.y + 8 * s, 15 * s, 5 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  if (dog.state === 'asleep') {
    ctx.save();
    ctx.translate(dog.x, dog.y);
    ctx.globalAlpha = 0.92;
    drawSprite(img, 0, 4, dispH * 0.85, 'center');
    ctx.globalAlpha = 1;
    ctx.restore();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('z z z', dog.x - 8, dog.y - dispH / 2 - 4);
    return;
  }

  ctx.save();
  ctx.translate(dog.x, dog.y);
  rotateFacing(dog.angle);
  drawSprite(img, 0, 0, dispH, 'center');
  ctx.restore();

  // suspicion indicator (screen-aligned, not rotated with the dog)
  if (dog.suspicion > 0.02) {
    ctx.fillStyle = dog.suspicion >= 0.99 ? '#ff2222' : '#ffcc33';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(dog.suspicion > 0.6 ? '!' : '?', dog.x, dog.y - dispH / 2 - 6);
  }
}

// The mailman art is a side-view walking human (not a rotatable top-down
// blob like the dogs), so it only ever mirrors left/right to face travel
// direction -- it never rotates to "face" up/down, which would make a
// bipedal sprite flop onto its side. Vertical movement keeps the last
// horizontal facing, matching classic top-down character rendering.
function drawVan(van) {
  const key = van.facing < 0 ? 'vehicle.vanLeft' : 'vehicle.vanRight';
  const img = IMAGES[key];
  if (!img || !img.complete || !img.naturalHeight) return;
  const h = VAN_H, wpx = h * (img.naturalWidth / img.naturalHeight);
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(van.x, van.y + h / 2 - 4, wpx * 0.42, h * 0.13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.drawImage(img, van.x - wpx / 2, van.y - h / 2, wpx, h);
}

function drawPlayer(p) {
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 16, 11, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // The new front-facing sprites match the composed scenes: a standing pose
  // when still, the walking pose while moving. Sneaking keeps the older
  // crouched frames, which have no front-facing equivalent yet.
  let img;
  if (p.sneaking) {
    img = IMAGES[['mailman.sneak0', 'mailman.sneak1'][p.animFrame]];
  } else if (p.moving) {
    img = IMAGES['props.mailmanWalk'] || IMAGES[['mailman.walk0', 'mailman.walk1'][p.animFrame]];
  } else {
    img = IMAGES['props.mailmanStand'] || IMAGES['mailman.walk0'];
  }

  ctx.save();
  ctx.translate(p.x, p.y);
  if (p.facingLeft) ctx.scale(-1, 1);
  drawSprite(img, 0, 14, 44, 'bottom');
  ctx.restore();
}

/* ---------- Main loop ---------- */
function loop(t) {
  requestAnimationFrame(loop);
  let dt = (t - state.lastTime) / 1000;
  state.lastTime = t;
  dt = Math.min(dt, 0.05);

  if (state.mode === 'playing') {
    updatePlayer(dt);
    updateDogsAndDetection(dt);
    updateCamera();
    draw();
  } else if (state.mode === 'caught') {
    updateCaughtAnim(dt);
    draw();
  }
}
requestAnimationFrame(loop);

/* also draw while paused/menu/busted/etc so the last frame doesn't look frozen oddly */
setInterval(() => { if (state.mode !== 'playing' && state.mode !== 'caught') draw(); }, 500);

/* ---------- Button wiring ---------- */
document.getElementById('btn-start').onclick = () => startGame();
document.getElementById('btn-howto').onclick = () => { state.mode = 'howto'; showOnly('howto'); };
document.getElementById('btn-howto-back').onclick = () => { state.mode = 'menu'; showOnly('menu'); };
document.getElementById('btn-li-go').onclick = () => beginPlaying();
document.getElementById('btn-busted-retry').onclick = () => restartLevel();
document.getElementById('btn-gameover-restart').onclick = () => startGame();
document.getElementById('btn-lc-next').onclick = () => nextLevel();
document.getElementById('btn-win-restart').onclick = () => startGame();
document.getElementById('btn-resume').onclick = () => togglePause();
document.getElementById('btn-pause-restart').onclick = () => { restartLevel(); };
document.getElementById('btn-pause-menu').onclick = () => { state.mode = 'menu'; showOnly('menu'); };

preloadImages(() => { resolveLotCollision(); state.mode = 'menu'; showOnly('menu'); });
