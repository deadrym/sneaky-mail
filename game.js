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
  chihuahua:   { name: 'Chihuahua',              size: 0.60, range: 108, nearRadius: 31, coneDeg: 50, speed: 40, fillRate: 0.80, behavior: 'pace' },
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

/* House siding/roof/door/trim color variants, cycled per house for street variety */
const HOUSE_PALETTES = [
  { siding: '#d8c39a', roof: '#8a4a3a', door: '#5a3a22', trim: '#a9865a', roofStyle: 'gable' },
  { siding: '#c9d6c0', roof: '#465264', door: '#3a2a1a', trim: '#8a9a80', roofStyle: 'flat' },
  { siding: '#e0c9b0', roof: '#b3552e', door: '#2e2a26', trim: '#b09070', roofStyle: 'tile' },
  { siding: '#cfe0d8', roof: '#3a4a3a', door: '#4a2a1a', trim: '#8fae9d', roofStyle: 'aframe' },
  { siding: '#e8dcc0', roof: '#5a4a6a', door: '#3a2a3a', trim: '#c0b090', roofStyle: 'gable' },
];

/* Mailbox sprite styles, cycled per house for street variety */
const MAILBOX_STYLES = Object.keys(ASSET_PATHS.mailboxes);

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

const HOUSE_H = 210;
const HOUSE_GAP = 26;
const HOUSE_W = 150;
const YARD_W = 190;
const STREET_W = 180;      // vertical corridor street width, and horizontal cross-street width
const CORRIDOR_COUNT = 2;  // side-by-side vertical street corridors -- the "columns" of the block grid
const CORRIDOR_GAP = 60;   // back-lot buffer between one corridor's houses and the next corridor's
const CORRIDOR_W = HOUSE_W + YARD_W + STREET_W + YARD_W + HOUSE_W;
const ROW_H = HOUSE_H + HOUSE_GAP;
const ROWS_PER_BLOCK = 2;  // house-rows between horizontal cross streets
const MARGIN_TOP = 140;
const MARGIN_BOTTOM = 160;

// A real block grid: houses alternate between CORRIDOR_COUNT vertical street
// corridors (so the camera has to pan horizontally too), and every
// ROWS_PER_BLOCK rows a horizontal cross street cuts across *all* corridors
// at the same world Y, forming actual 4-way intersections instead of one
// long straight or winding line.
function corridorX0(corridorIndex) {
  return corridorIndex * (CORRIDOR_W + CORRIDOR_GAP);
}
function rowSlotY(rowSlot) {
  const blockIndex = Math.floor(rowSlot / ROWS_PER_BLOCK);
  const rowInBlock = rowSlot % ROWS_PER_BLOCK;
  return MARGIN_TOP + blockIndex * (ROWS_PER_BLOCK * ROW_H + STREET_W) + rowInBlock * ROW_H;
}
function crossStreetBands(rowSlotCount) {
  const blocks = Math.ceil(rowSlotCount / ROWS_PER_BLOCK);
  const bands = [];
  for (let b = 0; b < blocks; b++) {
    const y0 = MARGIN_TOP + b * (ROWS_PER_BLOCK * ROW_H + STREET_W) + ROWS_PER_BLOCK * ROW_H;
    bands.push({ y0, y1: y0 + STREET_W });
  }
  return bands;
}

/* ---------- Utility ---------- */
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }
// Places stones at even spacing along a polyline (a sequence of straight
// legs), used for the maze-like stepping-stone yard paths. `nextDist` is
// the absolute distance-along-the-whole-path where the next stone belongs,
// so spacing carries correctly across the sharp turns between legs.
function stonesAlongPath(points, spacing) {
  const stones = [];
  let nextDist = 0;
  let walked = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1];
    const segLen = dist(a.x, a.y, b.x, b.y);
    while (nextDist <= walked + segLen) {
      const t = segLen > 0 ? (nextDist - walked) / segLen : 0;
      const jx = (Math.random() - 0.5) * 3, jy = (Math.random() - 0.5) * 3;
      stones.push({ x: a.x + (b.x - a.x) * t + jx, y: a.y + (b.y - a.y) * t + jy, r: 8 + Math.random() * 3.5, rot: Math.random() * Math.PI, moss: Math.random() < 0.2 });
      nextDist += spacing;
    }
    walked += segLen;
  }
  return stones;
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
});
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

/* ---------- Game state ---------- */
const state = {
  mode: 'loading', // loading, menu, howto, levelintro, playing, paused, busted, gameover, levelcomplete, win
  level: 0,     // 0-indexed
  lives: 3,
  world: null,
  camX: 0,
  camY: 0,
  lastTime: 0,
  suspicionDisplay: 0,
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
  const rowSlotCount = Math.ceil(cfg.houses / CORRIDOR_COUNT);

  for (let i = 0; i < cfg.houses; i++) {
    const corridor = i % CORRIDOR_COUNT;
    const rowSlot = Math.floor(i / CORRIDOR_COUNT);
    const side = rowSlot % 2 === 0 ? 'left' : 'right';
    const topY = rowSlotY(rowSlot);
    const house = makeHouse(side, topY, cfg, i, corridorX0(corridor));
    houses.push(house);
  }

  const worldW = corridorX0(CORRIDOR_COUNT - 1) + CORRIDOR_W;
  const worldH = rowSlotY(rowSlotCount - 1) + HOUSE_H + MARGIN_BOTTOM;
  const crossStreets = crossStreetBands(rowSlotCount).filter((b) => b.y1 < worldH);
  const totalMail = houses.length;

  // static decorative elements, precomputed once so they don't flicker/jitter each frame
  const roadSpeckles = [];
  for (let c = 0; c < CORRIDOR_COUNT; c++) {
    const cx0 = corridorX0(c) + HOUSE_W + YARD_W;
    const count = Math.round(worldH / 16);
    for (let i = 0; i < count; i++) {
      roadSpeckles.push({
        x: cx0 + 34 + Math.random() * (STREET_W - 68),
        y: Math.random() * worldH,
        r: 1 + Math.random() * 1.8,
        a: 0.05 + Math.random() * 0.08,
      });
    }
  }
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
  for (let i = 0; i < Math.max(3, Math.round(worldW / 400)); i++) {
    clouds.push({ x: 80 + Math.random() * (worldW - 160), y: 20 + Math.random() * 90, s: 0.7 + Math.random() * 0.6 });
  }

  // a loose treeline down each back-lot gap between corridors, so that
  // empty buffer strip doesn't read as a dead void
  const gapTrees = [];
  for (let c = 0; c < CORRIDOR_COUNT - 1; c++) {
    const gx = corridorX0(c) + CORRIDOR_W + CORRIDOR_GAP / 2;
    for (let y = 80; y < worldH - 40; y += 90 + Math.random() * 60) {
      gapTrees.push({ x: gx + (Math.random() - 0.5) * 20, y, r: 14 + Math.random() * 8, kind: Math.random() < 0.5 ? 'pine' : 'round' });
    }
  }

  const startX = corridorX0(0) + CORRIDOR_W / 2;
  return {
    cfg,
    houses,
    worldW,
    worldH,
    crossStreets,
    totalMail,
    delivered: 0,
    decor: { roadSpeckles, clouds, gapTrees },
    player: {
      x: startX,
      y: 60,
      r: 11,
      speed: 130,
      sneakSpeed: 78,
      facing: Math.PI / 2,
      facingLeft: false,
      sneaking: false,
      moving: false,
      animFrame: 0,
      animTimer: 0,
    },
    startPlayer: { x: startX, y: 60 },
  };
}

const YARD_THEMES = ['garden', 'wooded', 'ornamental', 'minimal'];

function makeHouse(side, topY, cfg, index, corridorBaseX) {
  const houseW = HOUSE_W;
  const yardW = YARD_W;
  const streetX0 = corridorBaseX + houseW + yardW;
  let houseX, yardX;
  if (side === 'left') {
    yardX = streetX0 - yardW;
    houseX = yardX - houseW;
  } else {
    yardX = streetX0 + STREET_W;
    houseX = yardX + yardW;
  }

  const wallRect = { x: houseX, y: topY, w: houseW, h: HOUSE_H };
  const yardRect = { x: yardX, y: topY, w: yardW, h: HOUSE_H };

  const palette = HOUSE_PALETTES[index % HOUSE_PALETTES.length];
  const hasChimney = index % 2 === 0;
  const flowerWindow = Math.random() < 0.5 ? 0 : 1;
  const doorX = side === 'left' ? houseX + houseW - 26 : houseX + 6;
  const doorCenterY = topY + HOUSE_H / 2;

  // mailbox sits right beside the front door (not at the curb), so reaching
  // it means crossing the whole yard past the dog's territory
  const mailbox = {
    x: side === 'left' ? houseX + houseW + 16 : houseX - 16,
    y: doorCenterY + 24,
    delivered: false, r: 16,
    style: MAILBOX_STYLES[index % MAILBOX_STYLES.length],
  };

  // porch center = where sentry/pace dogs anchor, with a buffer from the
  // door/mailbox so the dog isn't standing directly on top of them
  const porchX = side === 'left' ? yardX + 58 : yardX + yardW - 58;
  const facingAngle = side === 'left' ? 0 : Math.PI;

  // maze-like stepping-stone path from the street edge to the door/mailbox:
  // a zigzag of straight legs with sharp right-angle-ish turns rather than
  // a smooth curve, so the route reads as something to actually navigate
  const pathEntry = { x: side === 'left' ? yardX + yardW - 10 : yardX + 10, y: topY + HOUSE_H * (0.2 + Math.random() * 0.6) };
  const pathEnd = { x: mailbox.x + (side === 'left' ? -10 : 10), y: mailbox.y };
  const turnX = pathEntry.x + (pathEnd.x - pathEntry.x) * (0.3 + Math.random() * 0.2);
  const turnY = pathEntry.y + (pathEnd.y - pathEntry.y) * (0.55 + Math.random() * 0.25);
  const pathWaypoints = [
    pathEntry,
    { x: turnX, y: pathEntry.y },
    { x: turnX, y: turnY },
    { x: pathEnd.x, y: turnY },
    pathEnd,
  ];
  const pathStones = stonesAlongPath(pathWaypoints, 15);

  const theme = YARD_THEMES[index % YARD_THEMES.length];

  // bushes: small obstacles that also block dog line-of-sight
  const bushes = [];
  const bushCount = Math.random() < cfg.bushChance ? (Math.random() < 0.4 ? 2 : 1) : 0;
  for (let b = 0; b < bushCount; b++) {
    const bw = 34, bh = 28;
    const bx = clamp(yardX + 20 + Math.random() * (yardW - 40 - bw), yardX, yardX + yardW - bw);
    const by = topY + 30 + Math.random() * (HOUSE_H - 60 - bh);
    bushes.push({ x: bx, y: by, w: bw, h: bh });
  }

  // decorative dressing (purely visual, no collision): trees, flower beds,
  // rocks, and a street lamp near the curb -- density/mix varies by theme
  // so each yard reads as its own distinct little setup
  const trees = [], flowerBeds = [], rocks = [];
  const treeCount = theme === 'wooded' ? 2 + Math.floor(Math.random() * 2) : theme === 'garden' ? 1 : theme === 'minimal' ? 0 : 1;
  const flowerCount = theme === 'garden' ? 3 + Math.floor(Math.random() * 2) : theme === 'ornamental' ? 2 : theme === 'wooded' ? 1 : 0;
  const rockCount = theme === 'wooded' ? 2 + Math.floor(Math.random() * 2) : theme === 'ornamental' ? 2 : 1;

  const placeInYard = (marginX, marginY) => ({
    x: clamp(yardX + marginX + Math.random() * (yardW - marginX * 2), yardX + 4, yardX + yardW - 4),
    y: clamp(topY + marginY + Math.random() * (HOUSE_H - marginY * 2), topY + 4, topY + HOUSE_H - 4),
  });
  for (let t = 0; t < treeCount; t++) {
    const p = placeInYard(24, 28);
    const kind = theme === 'ornamental' && Math.random() < 0.4 ? 'blossom' : (Math.random() < 0.5 ? 'pine' : 'round');
    trees.push({ x: p.x, y: p.y, r: 16 + Math.random() * 8, kind });
  }
  for (let f = 0; f < flowerCount; f++) {
    const p = placeInYard(16, 16);
    flowerBeds.push({ x: p.x, y: p.y, w: 20 + Math.random() * 14, h: 14 + Math.random() * 8, dense: theme === 'garden' });
  }
  for (let r = 0; r < rockCount; r++) {
    const p = placeInYard(12, 12);
    rocks.push({ x: p.x, y: p.y, r: 4 + Math.random() * 4 });
  }
  // lamp post stands on the sidewalk (the street's outer margin), not in the yard
  const lamp = { x: side === 'left' ? streetX0 + 12 : streetX0 + STREET_W - 12, y: topY + HOUSE_H - 20 };

  // curated yard props (bench / fountain / gnome) -- a light sprinkle tied
  // to the theme, not a prop on every lawn
  const props = [];
  if (theme === 'garden') {
    const p1 = placeInYard(20, 20);
    props.push({ kind: 'fountain', x: p1.x, y: p1.y });
    if (Math.random() < 0.6) {
      const p2 = placeInYard(20, 20);
      props.push({ kind: 'bench', x: p2.x, y: p2.y, rot: Math.random() < 0.5 ? 0 : Math.PI / 2 });
    }
  } else if (theme === 'ornamental') {
    const p1 = placeInYard(16, 16);
    props.push({ kind: 'gnome', x: p1.x, y: p1.y });
    if (Math.random() < 0.5) {
      const p2 = placeInYard(20, 20);
      props.push({ kind: 'bench', x: p2.x, y: p2.y, rot: Math.random() < 0.5 ? 0 : Math.PI / 2 });
    }
  } else if (theme === 'wooded' && Math.random() < 0.5) {
    const p1 = placeInYard(20, 20);
    props.push({ kind: 'bench', x: p1.x, y: p1.y, rot: Math.random() < 0.5 ? 0 : Math.PI / 2 });
  }

  // grass tufts: small static texture marks scattered in the yard
  const grassTufts = [];
  const tuftCount = 26;
  for (let g = 0; g < tuftCount; g++) {
    grassTufts.push({
      x: yardX + 6 + Math.random() * (yardW - 12),
      y: topY + 6 + Math.random() * (HOUSE_H - 12),
      rot: Math.random() * Math.PI,
      shade: Math.random() < 0.5 ? 'light' : 'dark',
    });
  }

  // dogs
  const breedKeys = cfg.breeds;
  const dogCount = index < cfg.doubleDogHouses ? 2 : 1;
  const dogs = [];
  for (let d = 0; d < dogCount; d++) {
    const breedKey = breedKeys[Math.floor(Math.random() * breedKeys.length)];
    const breed = BREEDS[breedKey];
    const anchorY = topY + HOUSE_H * (dogCount === 1 ? 0.5 : (d === 0 ? 0.32 : 0.72));
    const dog = {
      breedKey, breed,
      x: porchX,
      y: anchorY,
      angle: facingAngle,
      baseAngle: facingAngle,
      side,
      suspicion: 0,
      state: 'awake',
      sleepTimer: breed.behavior === 'sleepy' ? 2 + Math.random() * 2 : 0,
      sweepT: Math.random() * Math.PI * 2,
      seen: false,
      animTimer: Math.random() * 0.18,
      animFrame: Math.random() < 0.5 ? 0 : 1,
    };
    dogs.push(dog);
  }

  return {
    side, topY, wallRect, yardRect, mailbox, bushes, dogs, index,
    palette, hasChimney, flowerWindow, doorX, grassTufts,
    theme, trees, flowerBeds, rocks, lamp, pathStones, props,
  };
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
function updatePlayer(dt) {
  const w = state.world;
  const p = w.player;
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
      if (circleRectOverlap(nx, p.y, p.r, h.wallRect)) blockedX = true;
      if (circleRectOverlap(p.x, ny, p.r, h.wallRect)) blockedY = true;
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
    if (!h.mailbox.delivered && dist(p.x, p.y, h.mailbox.x, h.mailbox.y) < h.mailbox.r + p.r) {
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
      dog.wanderX = yr.x + margin + Math.random() * (yr.w - margin * 2);
      dog.wanderY = yr.y + margin + Math.random() * (yr.h - margin * 2);
      dog.wanderPhase = 'moving';
      dog.wanderTimer = 5 + Math.random() * 3; // failsafe: give up and re-pause if travel takes too long
    }
  } else {
    const dx = dog.wanderX - dog.x, dy = dog.wanderY - dog.y;
    const d = Math.hypot(dx, dy);
    dog.wanderTimer -= dt;
    if (d > 4 && dog.wanderTimer > 0) {
      const speedMul = breed.behavior === 'sentry' ? 0.55 : breed.behavior === 'erratic' ? 1.0 : 0.75;
      dog.x += (dx / d) * breed.speed * speedMul * dt;
      dog.y += (dy / d) * breed.speed * speedMul * dt;
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
    loseLife(`A ${caughtBy.breed.name} spotted you and started barking!`);
  }
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

  ctx.save();
  ctx.translate(-state.camX, -state.camY);

  drawBackground(w);
  for (const t of w.decor.gapTrees) drawTree(t);
  for (const h of w.houses) drawYard(h);
  drawRoad(w);
  for (const h of w.houses) drawLamp(h.lamp);
  for (const h of w.houses) drawHouse(h);
  for (const h of w.houses) for (const b of h.bushes) drawBush(b);
  for (const h of w.houses) drawMailbox(h.mailbox, h.side);

  // vision cones on top of scenery, under the characters
  for (const h of w.houses) for (const dog of h.dogs) drawVisionCone(dog);

  drawPlayer(w.player);
  for (const h of w.houses) for (const dog of h.dogs) drawDog(dog);

  ctx.restore();
}

function drawBackground(w) {
  ctx.fillStyle = '#4f8a4b';
  ctx.fillRect(0, 0, w.worldW, w.worldH);
  // sky strip above the first row, with a soft gradient and drifting clouds
  const skyH = 130;
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
}

// Rounded, slightly overlapping cobbles with a soft shadow/highlight and a
// faint moss fleck -- reads as a proper stepping-stone path, not UI chips.
function drawPathStones(stones) {
  for (const s of stones) {
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    ctx.beginPath(); ctx.ellipse(s.x + 1.5, s.y + 2.5, s.r, s.r * 0.66, s.rot, 0, Math.PI * 2); ctx.fill();
    const grad = ctx.createRadialGradient(s.x - s.r * 0.3, s.y - s.r * 0.3, 1, s.x, s.y, s.r * 1.2);
    grad.addColorStop(0, '#ddd5c1');
    grad.addColorStop(0.6, '#c7bfa9');
    grad.addColorStop(1, '#a49a83');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.ellipse(s.x, s.y, s.r, s.r * 0.74, s.rot, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(120,110,90,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(s.x, s.y, s.r, s.r * 0.74, s.rot, 0, Math.PI * 2); ctx.stroke();
    if (s.moss) {
      ctx.fillStyle = 'rgba(90,140,70,0.35)';
      ctx.beginPath(); ctx.ellipse(s.x - s.r * 0.3, s.y + s.r * 0.15, s.r * 0.35, s.r * 0.2, s.rot, 0, Math.PI * 2); ctx.fill();
    }
  }
}

// A loose scattered cluster of small blooms over dark soil, with a few
// leaf sprigs, rather than a tidy ring of dots.
function drawFlowerBed(f) {
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.beginPath(); ctx.ellipse(f.x + 1, f.y + 2, f.w / 2, f.h / 2, 0, 0, Math.PI * 2); ctx.fill();
  const soil = ctx.createRadialGradient(f.x, f.y, 1, f.x, f.y, Math.max(f.w, f.h) / 2);
  soil.addColorStop(0, '#4a3626');
  soil.addColorStop(1, '#2e2015');
  ctx.fillStyle = soil;
  ctx.beginPath(); ctx.ellipse(f.x, f.y, f.w / 2, f.h / 2, 0, 0, Math.PI * 2); ctx.fill();
  const colors = ['#e0556a', '#f0c93a', '#e88ac9', '#f4f4f4', '#8a6ad1', '#f0925a'];
  const n = f.dense ? 10 : 7;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (i % 2) * 0.35;
    const rad = 0.2 + (i % 3) * 0.28;
    const fx = f.x + Math.cos(a) * f.w * rad, fy = f.y + Math.sin(a) * f.h * rad;
    if (i % 3 === 0) {
      ctx.strokeStyle = '#3f7a3d';
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(fx, fy + 3); ctx.lineTo(fx, fy - 1); ctx.stroke();
    }
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath(); ctx.arc(fx, fy, 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath(); ctx.arc(fx - 0.7, fy - 0.7, 0.9, 0, Math.PI * 2); ctx.fill();
  }
}

function drawRock(r) {
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  ctx.beginPath(); ctx.ellipse(r.x + 1.5, r.y + 2, r.r, r.r * 0.6, 0, 0, Math.PI * 2); ctx.fill();
  const grad = ctx.createRadialGradient(r.x - r.r * 0.35, r.y - r.r * 0.4, 1, r.x, r.y, r.r * 1.1);
  grad.addColorStop(0, '#a9aeb3');
  grad.addColorStop(0.55, '#8a8f94');
  grad.addColorStop(1, '#5f6469');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.ellipse(r.x, r.y, r.r, r.r * 0.78, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(r.x - r.r * 0.4, r.y + r.r * 0.1); ctx.lineTo(r.x + r.r * 0.3, r.y - r.r * 0.15); ctx.stroke();
}

function drawTree(t) {
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath(); ctx.ellipse(t.x + 2, t.y + t.r * 0.55, t.r * 0.9, t.r * 0.4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#6b4a2e';
  ctx.fillRect(t.x - 3, t.y - 4, 6, t.r * 0.5);
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(t.x - 3, t.y - 4, 2, t.r * 0.5);
  if (t.kind === 'pine') {
    for (let i = 0; i < 3; i++) {
      const tw = t.r * (1 - i * 0.22);
      const ty = t.y - i * t.r * 0.5;
      const grad = ctx.createLinearGradient(t.x - tw, ty, t.x + tw, ty);
      grad.addColorStop(0, '#254f2c');
      grad.addColorStop(0.5, '#3d8144');
      grad.addColorStop(1, '#2a5c30');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(t.x, ty - t.r * 0.7);
      ctx.lineTo(t.x - tw, ty + t.r * 0.15);
      ctx.lineTo(t.x + tw, ty + t.r * 0.15);
      ctx.closePath();
      ctx.fill();
    }
  } else if (t.kind === 'blossom') {
    const grad = ctx.createRadialGradient(t.x - t.r * 0.3, t.y - t.r * 0.6, 2, t.x, t.y - t.r * 0.3, t.r * 1.1);
    grad.addColorStop(0, '#ffd4e8');
    grad.addColorStop(0.55, '#f2a3c8');
    grad.addColorStop(1, '#c76fa0');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(t.x, t.y - t.r * 0.3, t.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    for (let i = 0; i < 5; i++) {
      const a = Math.random() * Math.PI * 2, rr = Math.random() * t.r * 0.75;
      ctx.beginPath(); ctx.arc(t.x + Math.cos(a) * rr, t.y - t.r * 0.3 + Math.sin(a) * rr, 1.3, 0, Math.PI * 2); ctx.fill();
    }
  } else {
    const grad = ctx.createRadialGradient(t.x - t.r * 0.3, t.y - t.r * 0.6, 2, t.x, t.y - t.r * 0.3, t.r * 1.1);
    grad.addColorStop(0, '#6fbf5f');
    grad.addColorStop(1, '#3a7a3a');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(t.x, t.y - t.r * 0.3, t.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath(); ctx.arc(t.x + t.r * 0.35, t.y - t.r * 0.15, t.r * 0.55, 0, Math.PI * 2); ctx.fill();
  }
}

function drawLamp(l) {
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath(); ctx.ellipse(l.x, l.y + 14, 6, 2.4, 0, 0, Math.PI * 2); ctx.fill();
  const postGrad = ctx.createLinearGradient(l.x - 2, 0, l.x + 2, 0);
  postGrad.addColorStop(0, '#54545a');
  postGrad.addColorStop(1, '#26262a');
  ctx.fillStyle = postGrad;
  ctx.fillRect(l.x - 2, l.y - 24, 4, 38);
  ctx.fillStyle = '#2a2a2e';
  ctx.beginPath(); ctx.arc(l.x, l.y + 14, 4, 0, Math.PI * 2); ctx.fill();
  const glow = ctx.createRadialGradient(l.x, l.y - 28, 0, l.x, l.y - 28, 15);
  glow.addColorStop(0, 'rgba(255,230,150,0.55)');
  glow.addColorStop(1, 'rgba(255,230,150,0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(l.x, l.y - 28, 15, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2a2a2e';
  ctx.fillRect(l.x - 7, l.y - 34, 14, 3);
  const lampGrad = ctx.createLinearGradient(l.x - 5, 0, l.x + 5, 0);
  lampGrad.addColorStop(0, '#fff2c0');
  lampGrad.addColorStop(1, '#f0d060');
  ctx.fillStyle = lampGrad;
  ctx.beginPath(); ctx.ellipse(l.x, l.y - 28, 5, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2a2a2e';
  ctx.beginPath();
  ctx.moveTo(l.x - 6, l.y - 34); ctx.lineTo(l.x + 6, l.y - 34); ctx.lineTo(l.x, l.y - 40);
  ctx.closePath(); ctx.fill();
}

// Curated yard props (bench / fountain / gnome), sprinkled per yard theme.
function drawProp(p) {
  if (p.kind === 'bench') {
    ctx.save();
    ctx.translate(p.x, p.y);
    if (p.rot) ctx.rotate(p.rot);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath(); ctx.ellipse(1, 9, 16, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3a2a1c';
    ctx.fillRect(-14, -2, 4, 10); ctx.fillRect(10, -2, 4, 10);
    const seatGrad = ctx.createLinearGradient(0, -6, 0, 2);
    seatGrad.addColorStop(0, '#9c7248'); seatGrad.addColorStop(1, '#7a5836');
    ctx.fillStyle = seatGrad;
    ctx.fillRect(-16, -6, 32, 6);
    ctx.fillStyle = '#8a6640';
    ctx.fillRect(-16, -16, 32, 5);
    for (let i = -14; i < 16; i += 6) { ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(i, -6, 1.4, 6); }
    ctx.restore();
  } else if (p.kind === 'fountain') {
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath(); ctx.ellipse(p.x + 1, p.y + 13, 17, 6, 0, 0, Math.PI * 2); ctx.fill();
    const rim = ctx.createRadialGradient(p.x, p.y, 4, p.x, p.y, 18);
    rim.addColorStop(0, '#cfc9ba'); rim.addColorStop(1, '#a39c8a');
    ctx.fillStyle = rim;
    ctx.beginPath(); ctx.ellipse(p.x, p.y, 18, 12, 0, 0, Math.PI * 2); ctx.fill();
    const water = ctx.createRadialGradient(p.x, p.y - 1, 1, p.x, p.y, 13);
    water.addColorStop(0, '#bfe8f2'); water.addColorStop(1, '#5fa8c2');
    ctx.fillStyle = water;
    ctx.beginPath(); ctx.ellipse(p.x, p.y, 13, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#cfc9ba';
    ctx.beginPath(); ctx.ellipse(p.x, p.y - 6, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - 6);
      ctx.lineTo(p.x + (i - 1) * 4, p.y - 1);
      ctx.stroke();
    }
  } else if (p.kind === 'gnome') {
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath(); ctx.ellipse(p.x, p.y + 9, 6, 2.4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2f5ea8';
    ctx.fillRect(p.x - 4, p.y - 4, 8, 10);
    ctx.fillStyle = '#e8c9a0';
    ctx.beginPath(); ctx.arc(p.x, p.y - 7, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f4f4f4';
    ctx.beginPath(); ctx.ellipse(p.x, p.y - 4, 3.4, 2.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c94040';
    ctx.beginPath();
    ctx.moveTo(p.x - 5, p.y - 9); ctx.lineTo(p.x + 5, p.y - 9); ctx.lineTo(p.x, p.y - 18);
    ctx.closePath(); ctx.fill();
  }
}

function drawYard(h) {
  const yr = h.yardRect;
  // mowed-stripe texture
  ctx.fillStyle = '#5fa85a';
  ctx.fillRect(yr.x, yr.y, yr.w, yr.h);
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  const stripeW = 22;
  for (let sx = yr.x - (yr.x % stripeW); sx < yr.x + yr.w; sx += stripeW * 2) {
    ctx.fillRect(Math.max(sx, yr.x), yr.y, Math.min(stripeW, yr.x + yr.w - sx), yr.h);
  }
  // grass tufts
  for (const t of h.grassTufts) {
    ctx.strokeStyle = t.shade === 'light' ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(t.x, t.y);
    ctx.lineTo(t.x + Math.cos(t.rot) * 5, t.y + Math.sin(t.rot) * 5 - 3);
    ctx.stroke();
  }
  // maze-like stepping-stone path from the street to the door/mailbox, then
  // yard dressing -- the mix varies per house's theme for a distinct look
  drawPathStones(h.pathStones);
  for (const r of h.rocks) drawRock(r);
  for (const f of h.flowerBeds) drawFlowerBed(f);
  for (const t of h.trees) drawTree(t);
  for (const p of h.props) drawProp(p);
}

// Sidewalk paver texture: a grid of joint lines rather than sparse ticks,
// so the concrete reads as individual slabs like the reference neighborhood.
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

function drawVerticalStreet(streetX0, worldH) {
  const x0 = streetX0, x1 = streetX0 + STREET_W;
  ctx.fillStyle = '#bdb6a2';
  ctx.fillRect(x0, 0, STREET_W, worldH);
  drawSidewalkPavers(x0, 0, 30, worldH, true);
  drawSidewalkPavers(x1 - 30, 0, 30, worldH, true);
  const asphalt = ctx.createLinearGradient(x0 + 30, 0, x1 - 30, 0);
  asphalt.addColorStop(0, '#494c4f');
  asphalt.addColorStop(0.5, '#5a5e62');
  asphalt.addColorStop(1, '#494c4f');
  ctx.fillStyle = asphalt;
  ctx.fillRect(x0 + 30, 0, STREET_W - 60, worldH);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x0 + 30, 0); ctx.lineTo(x0 + 30, worldH); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x1 - 30, 0); ctx.lineTo(x1 - 30, worldH); ctx.stroke();
  ctx.strokeStyle = '#ecc94a';
  ctx.lineWidth = 3;
  ctx.setLineDash([16, 12]);
  ctx.beginPath(); ctx.moveTo(x0 + STREET_W / 2, 0); ctx.lineTo(x0 + STREET_W / 2, worldH); ctx.stroke();
  ctx.setLineDash([]);
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
  for (let c = 0; c < CORRIDOR_COUNT; c++) {
    drawVerticalStreet(corridorX0(c) + HOUSE_W + YARD_W, w.worldH);
  }
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

  // a drain cover marks each real 4-way intersection
  for (let c = 0; c < CORRIDOR_COUNT; c++) {
    const cx = corridorX0(c) + HOUSE_W + YARD_W + STREET_W / 2;
    for (const band of w.crossStreets) {
      const cy = band.y0 + STREET_W / 2;
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

// Lightens (positive amt) or darkens (negative amt) a "#rrggbb" color.
function shadeColor(hex, amt) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amt));
  const b = Math.max(0, Math.min(255, (num & 0xff) + amt));
  return `rgb(${r},${g},${b})`;
}

function drawRoofGable(roofX0, roofX1, r, flip, pal) {
  const ridgeX = (roofX0 + roofX1) / 2;
  // two-tone slopes, each with its own subtle gradient (light-from-the-left)
  // so the pitch reads clearly while still feeling painted, not flat-filled
  const leftGrad = ctx.createLinearGradient(roofX0, 0, ridgeX, 0);
  leftGrad.addColorStop(0, shadeColor(pal.roof, 40));
  leftGrad.addColorStop(1, shadeColor(pal.roof, 14));
  ctx.fillStyle = leftGrad;
  ctx.fillRect(roofX0, r.y, ridgeX - roofX0, r.h);
  const rightGrad = ctx.createLinearGradient(ridgeX, 0, roofX1, 0);
  rightGrad.addColorStop(0, shadeColor(pal.roof, -14));
  rightGrad.addColorStop(1, shadeColor(pal.roof, -34));
  ctx.fillStyle = rightGrad;
  ctx.fillRect(ridgeX, r.y, roofX1 - ridgeX, r.h);
  // individual shingle course lines, offset row to row like real courses
  ctx.strokeStyle = 'rgba(0,0,0,0.22)';
  ctx.lineWidth = 1;
  let rowFlip = false;
  for (let ly = r.y + 6; ly < r.y + r.h - 3; ly += 6) {
    ctx.beginPath();
    ctx.moveTo(roofX0 + 2, ly); ctx.lineTo(roofX1 - 2, ly);
    ctx.stroke();
    for (let lx = roofX0 + (rowFlip ? 6 : 3); lx < roofX1 - 3; lx += 7) {
      if (Math.abs(lx - ridgeX) < 2) continue;
      ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx, ly + 6); ctx.stroke();
    }
    rowFlip = !rowFlip;
  }
  // ridge cap + gutter line along the eaves
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(ridgeX, r.y + 2); ctx.lineTo(ridgeX, r.y + r.h - 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.28)';
  ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(roofX0 + 1, r.y + 1); ctx.lineTo(roofX0 + 1, r.y + r.h - 1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(roofX1 - 1, r.y + 1); ctx.lineTo(roofX1 - 1, r.y + r.h - 1); ctx.stroke();
}

function drawRoofFlat(roofX0, roofX1, r, pal) {
  const grad = ctx.createLinearGradient(roofX0, r.y, roofX1, r.y);
  grad.addColorStop(0, shadeColor(pal.roof, 12));
  grad.addColorStop(1, shadeColor(pal.roof, -10));
  ctx.fillStyle = grad;
  ctx.fillRect(roofX0, r.y, roofX1 - roofX0, r.h);
  // gravel/tar texture speckle
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  for (let ly = r.y + 5; ly < r.y + r.h; ly += 7) {
    for (let lx = roofX0 + 3; lx < roofX1 - 2; lx += 6) {
      if ((lx + ly) % 3 === 0) ctx.fillRect(lx, ly, 2, 2);
    }
  }
  // parapet edge with an inner shadow lip
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 2;
  ctx.strokeRect(roofX0 + 1, r.y + 1, roofX1 - roofX0 - 2, r.h - 2);
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 1;
  ctx.strokeRect(roofX0 + 4, r.y + 4, roofX1 - roofX0 - 8, r.h - 8);
}

function drawRoofTile(roofX0, roofX1, r, flip, pal) {
  const ridgeX = (roofX0 + roofX1) / 2;
  const leftGrad = ctx.createLinearGradient(roofX0, 0, ridgeX, 0);
  leftGrad.addColorStop(0, shadeColor(pal.roof, 34));
  leftGrad.addColorStop(1, shadeColor(pal.roof, 10));
  ctx.fillStyle = leftGrad;
  ctx.fillRect(roofX0, r.y, ridgeX - roofX0, r.h);
  const rightGrad = ctx.createLinearGradient(ridgeX, 0, roofX1, 0);
  rightGrad.addColorStop(0, shadeColor(pal.roof, -12));
  rightGrad.addColorStop(1, shadeColor(pal.roof, -30));
  ctx.fillStyle = rightGrad;
  ctx.fillRect(ridgeX, r.y, roofX1 - ridgeX, r.h);
  // terracotta scalloped tile rows -- individual barrel-tile bumps
  for (let ly = r.y + 5; ly < r.y + r.h - 4; ly += 7) {
    for (let lx = roofX0 + 3; lx < roofX1 - 3; lx += 6.5) {
      const shadow = lx < ridgeX ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.14)';
      ctx.fillStyle = shadow;
      ctx.beginPath();
      ctx.arc(lx, ly, 2.4, 0, Math.PI, true);
      ctx.fill();
    }
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(ridgeX, r.y + 2); ctx.lineTo(ridgeX, r.y + r.h - 2);
  ctx.stroke();
}

function drawRoofAframe(roofX0, roofX1, r, flip, pal) {
  const apexX = flip ? roofX1 - 4 : roofX0 + 4;
  const baseX = flip ? roofX0 : roofX1;
  // shade from the tucked-in apex (dark) out to the exposed base (light)
  // so the single slope still reads as sloped, not flat
  const slopeGrad = ctx.createLinearGradient(apexX, r.y + r.h / 2, baseX, r.y + r.h / 2);
  slopeGrad.addColorStop(0, shadeColor(pal.roof, -32));
  slopeGrad.addColorStop(1, shadeColor(pal.roof, 26));
  ctx.fillStyle = slopeGrad;
  ctx.beginPath();
  ctx.moveTo(apexX, r.y + r.h / 2);
  ctx.lineTo(baseX, r.y);
  ctx.lineTo(baseX, r.y + r.h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.24)';
  ctx.lineWidth = 1;
  for (let t = 0.1; t < 1; t += 0.09) {
    ctx.beginPath();
    ctx.moveTo(apexX, r.y + r.h / 2);
    ctx.lineTo(baseX, r.y + r.h * t);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(apexX, r.y + r.h / 2); ctx.lineTo(baseX, r.y);
  ctx.moveTo(apexX, r.y + r.h / 2); ctx.lineTo(baseX, r.y + r.h);
  ctx.stroke();
  // small peak window with mullion
  const wx = apexX + (flip ? -10 : 10), wy = r.y + r.h / 2;
  ctx.fillStyle = 'rgba(200,225,235,0.85)';
  ctx.beginPath();
  ctx.arc(wx, wy, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(wx - 3, wy); ctx.lineTo(wx + 3, wy); ctx.moveTo(wx, wy - 3); ctx.lineTo(wx, wy + 3); ctx.stroke();
}

// Houses are drawn in a 3/4 top-down style (a la classic Zelda/Stardew towns):
// the roof recedes toward the back of the lot (away from the street) while a
// tall front facade -- with door, windows, and its own drop-shadow -- faces
// the street, so the building reads as a volume instead of a flat roof-plan.
function drawHouse(h) {
  const r = h.wallRect;
  const pal = h.palette;
  const flip = h.side === 'right'; // true: house is right of the street, facade faces left (-x)

  const roofDepth = r.w * 0.56;
  // facade zone = near the yard/street edge; roof zone = near the back edge
  const facadeX0 = flip ? r.x : r.x + roofDepth;
  const facadeX1 = flip ? r.x + r.w - roofDepth : r.x + r.w;
  const roofX0 = flip ? facadeX1 : r.x;
  const roofX1 = flip ? r.x + r.w : facadeX0;
  const facadeW = facadeX1 - facadeX0;

  // ground shadow cast by the whole building onto the yard -- deliberately
  // heavier than a flat-plan sprite would need, to sell the roof's height
  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.fillRect(r.x, r.y + r.h - 2, r.w, 12);
  ctx.fillRect(flip ? r.x + r.w : r.x - 8, r.y + 3, 8, r.h - 3);

  // --- roof zone (receding, away from the street) ---
  const roofStyle = pal.roofStyle || 'gable';
  if (roofStyle === 'flat') drawRoofFlat(roofX0, roofX1, r, pal);
  else if (roofStyle === 'tile') drawRoofTile(roofX0, roofX1, r, flip, pal);
  else if (roofStyle === 'aframe') drawRoofAframe(roofX0, roofX1, r, flip, pal);
  else drawRoofGable(roofX0, roofX1, r, flip, pal);

  // --- facade zone (tall front wall facing the street) ---
  ctx.fillStyle = pal.siding;
  ctx.fillRect(facadeX0, r.y, facadeW, r.h);
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 1;
  for (let ly = r.y + 8; ly < r.y + r.h - 6; ly += 8) {
    ctx.beginPath();
    ctx.moveTo(facadeX0 + 2, ly);
    ctx.lineTo(facadeX1 - 2, ly);
    ctx.stroke();
  }
  // foundation strip along the bottom for grounding
  const foundGrad = ctx.createLinearGradient(0, r.y + r.h - 8, 0, r.y + r.h);
  foundGrad.addColorStop(0, 'rgba(0,0,0,0)');
  foundGrad.addColorStop(1, 'rgba(0,0,0,0.22)');
  ctx.fillStyle = foundGrad;
  ctx.fillRect(facadeX0, r.y + r.h - 8, facadeW, 8);
  // eave overhang shadow where the roof meets the facade
  const eaveX = flip ? facadeX1 : facadeX0;
  const shadowGrad = ctx.createLinearGradient(
    flip ? eaveX : eaveX, 0, flip ? eaveX - 10 : eaveX + 10, 0
  );
  shadowGrad.addColorStop(0, 'rgba(0,0,0,0.32)');
  shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = shadowGrad;
  ctx.fillRect(flip ? eaveX - 10 : eaveX, r.y, 10, r.h);
  ctx.strokeStyle = pal.trim;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(eaveX, r.y); ctx.lineTo(eaveX, r.y + r.h);
  ctx.stroke();
  // gable-end trim strip along the top edge of the facade (hints a side wall)
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fillRect(facadeX0, r.y, facadeW, 5);

  // chimney, mounted on the roof zone
  if (h.hasChimney) {
    const chX = flip ? roofX1 - 20 : roofX0 + 8;
    const chGrad = ctx.createLinearGradient(chX, 0, chX + 14, 0);
    chGrad.addColorStop(0, shadeColor('#8a5a4a', 14));
    chGrad.addColorStop(1, shadeColor('#8a5a4a', -14));
    ctx.fillStyle = chGrad;
    ctx.fillRect(chX, r.y + 6, 14, 18);
    ctx.fillStyle = '#6b4238';
    ctx.fillRect(chX - 2, r.y + 4, 18, 5);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.ellipse(chX + 6, r.y - 4, 4, 3.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.beginPath();
    ctx.ellipse(chX + 10, r.y - 11, 5.5, 4.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.ellipse(chX + 15, r.y - 19, 7, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // windows, within the facade zone
  const winX = flip ? facadeX0 + 8 : facadeX1 - 30;
  const winYs = [r.y + 24, r.y + r.h - 46];
  winYs.forEach((wy, i) => {
    drawWindow(winX, wy, 22, 22, pal.trim, h.flowerWindow === i);
  });

  // door with frame, panels, awning, knob
  const doorW = 20, doorH = 42;
  const dx = h.doorX, dy = r.y + r.h / 2 - doorH / 2;
  ctx.fillStyle = pal.trim;
  ctx.fillRect(dx - 3, dy - 3, doorW + 6, doorH + 3);
  const doorGrad = ctx.createLinearGradient(dx, 0, dx + doorW, 0);
  doorGrad.addColorStop(0, shadeColor(pal.door, 10));
  doorGrad.addColorStop(1, shadeColor(pal.door, -10));
  ctx.fillStyle = doorGrad;
  ctx.fillRect(dx, dy, doorW, doorH);
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(dx + 3, dy + 4, doorW - 6, doorH * 0.42);
  ctx.strokeRect(dx + 3, dy + doorH * 0.52, doorW - 6, doorH * 0.42);
  ctx.fillStyle = '#e8c95a';
  ctx.beginPath();
  ctx.arc(flip ? dx + 4 : dx + doorW - 4, dy + doorH / 2, 1.6, 0, Math.PI * 2);
  ctx.fill();
  // awning with a soft underside shadow
  ctx.fillStyle = pal.roof;
  ctx.beginPath();
  ctx.ellipse(dx + doorW / 2, dy - 3, doorW / 2 + 5, 6, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(dx + doorW / 2, dy - 1, doorW / 2 + 4, 3, 0, 0, Math.PI);
  ctx.fill();
  // porch step
  const stepGrad = ctx.createLinearGradient(0, dy + doorH, 0, dy + doorH + 6);
  stepGrad.addColorStop(0, '#cfcabd');
  stepGrad.addColorStop(1, '#a29c8c');
  ctx.fillStyle = stepGrad;
  ctx.fillRect(dx - 4, dy + doorH, doorW + 8, 6);
}

function drawWindow(wx, wy, ww, wh, trim, hasFlowerBox) {
  ctx.fillStyle = trim;
  ctx.fillRect(wx - 3, wy - 3, ww + 6, wh + 6);
  const glass = ctx.createLinearGradient(wx, wy, wx, wy + wh);
  glass.addColorStop(0, '#e3f4fb');
  glass.addColorStop(1, '#9cc9dc');
  ctx.fillStyle = glass;
  ctx.fillRect(wx, wy, ww, wh);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.moveTo(wx + 2, wy + 2); ctx.lineTo(wx + ww * 0.4, wy + 2); ctx.lineTo(wx + 2, wy + wh * 0.5);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh);
  ctx.moveTo(wx, wy + wh / 2); ctx.lineTo(wx + ww, wy + wh / 2);
  ctx.stroke();
  if (hasFlowerBox) {
    ctx.fillStyle = '#7a5233';
    ctx.fillRect(wx - 2, wy + wh + 2, ww + 4, 5);
    const dots = ['#e05a5a', '#f0c93a', '#e05a5a'];
    dots.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(wx + 4 + i * (ww - 8) / 2, wy + wh + 1, 2.4, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}

function drawBush(b) {
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.ellipse(cx + 2, cy + b.h / 2 - 2, b.w / 2, b.h / 4, 0, 0, Math.PI * 2);
  ctx.fill();
  const puffs = [
    { dx: 0, dy: 0, r: b.w / 2.1, c: '#2f6b34' },
    { dx: -b.w / 3, dy: b.h / 5, r: b.w / 2.8, c: '#356f38' },
    { dx: b.w / 3, dy: b.h / 6, r: b.w / 3, c: '#2a5f2f' },
    { dx: -b.w / 8, dy: -b.h / 5, r: b.w / 3.2, c: '#4a8a4a' },
  ];
  for (const p of puffs) {
    const grad = ctx.createRadialGradient(cx + p.dx - p.r * 0.3, cy + p.dy - p.r * 0.3, 1, cx + p.dx, cy + p.dy, p.r * 1.1);
    grad.addColorStop(0, shadeColor(p.c, 28));
    grad.addColorStop(1, p.c);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(cx + p.dx, cy + p.dy, p.r, p.r * 0.82, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Mailbox art is a real sprite (one of 12 styles, cycled per house). A small
// procedural flag + checkmark badge is layered on top so "flag up = done"
// reads the same regardless of which mailbox sprite is in use.
// The mailbox art is drawn at a slight angle with its opening/flag on the
// right side of the image, so it only reads as "facing the street" for
// left-side houses (street to the right) by default -- right-side houses
// (street to the left) need the whole thing mirrored so it opens the
// other way instead of facing back into the house.
function drawMailbox(mb, side) {
  const img = IMAGES[`mailboxes.${mb.style}`];
  const groundY = mb.y + 16;
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.ellipse(mb.x, groundY, 10, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  const dispH = 40;
  ctx.save();
  ctx.translate(mb.x, groundY);
  if (side === 'right') ctx.scale(-1, 1);
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
  const alerted = dog.suspicion > 0.5;
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
function drawPlayer(p) {
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 16, 11, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();

  const frameSet = p.sneaking ? ['mailman.sneak0', 'mailman.sneak1'] : ['mailman.walk0', 'mailman.walk1'];
  const img = IMAGES[frameSet[p.animFrame]];

  ctx.save();
  ctx.translate(p.x, p.y);
  if (p.facingLeft) ctx.scale(-1, 1);
  drawSprite(img, 0, 14, 44, 'bottom');
  ctx.restore();
}

/* ---------- Main loop ---------- */
function loop(t) {
  requestAnimationFrame(loop);
  if (state.mode !== 'playing') return;
  let dt = (t - state.lastTime) / 1000;
  state.lastTime = t;
  dt = Math.min(dt, 0.05);

  updatePlayer(dt);
  if (state.mode === 'playing') updateDogsAndDetection(dt);
  if (state.mode === 'playing') updateCamera();
  draw();
}
requestAnimationFrame(loop);

/* also draw while paused/menu so the last frame doesn't look frozen oddly */
setInterval(() => { if (state.mode !== 'playing') draw(); }, 500);

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

preloadImages(() => { state.mode = 'menu'; showOnly('menu'); });
