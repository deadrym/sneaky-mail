/* ===================== Sneaky Mail ===================== */
'use strict';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const VIEW_W = canvas.width;
const VIEW_H = canvas.height;

/* ---------- Dog breed catalog ---------- */
/* range: sight distance (px). coneDeg: vision cone width (degrees).
   speed: patrol/turn speed. fillRate: suspicion gained per second while seen.
   behavior: 'pace' (walks a patrol line), 'sentry' (stands still, sweeps gaze),
             'sleepy' (naps on a timer, blind while asleep), 'erratic' (random direction changes) */
const BREEDS = {
  dachshund:  { name: 'Dachshund',        color: '#a35d2b', dark: '#7a4620', light: '#c98a4f', collar: '#3b6ea5', earStyle: 'floppy', size: 0.85, range: 65,  coneDeg: 50, speed: 24, fillRate: 0.55, behavior: 'pace' },
  bulldog:    { name: 'Bulldog',          color: '#c9a877', dark: '#8a6f4e', light: '#e6cfa0', collar: '#b23a3a', earStyle: 'floppy', size: 1.10, range: 68,  coneDeg: 55, speed: 16, fillRate: 0.50, behavior: 'sleepy' },
  corgi:      { name: 'Corgi',            color: '#e0a94a', dark: '#8a5a1e', light: '#f0c878', collar: '#3a8a5a', earStyle: 'pointy', size: 0.90, range: 80,  coneDeg: 55, speed: 30, fillRate: 0.60, behavior: 'pace' },
  beagle:     { name: 'Beagle',           color: '#caa06a', dark: '#5a3a1e', light: '#e0bd8c', collar: '#c9862e', earStyle: 'floppy', size: 0.95, range: 92,  coneDeg: 60, speed: 34, fillRate: 0.65, behavior: 'pace' },
  poodle:     { name: 'Poodle',           color: '#f2ead9', dark: '#cbbfa0', light: '#ffffff', collar: '#a83a8a', earStyle: 'floppy', size: 1.00, range: 85,  coneDeg: 65, speed: 32, fillRate: 0.70, behavior: 'erratic' },
  husky:      { name: 'Husky',            color: '#7d8896', dark: '#333a42', light: '#a7b3c0', collar: '#d94f4f', earStyle: 'pointy', size: 1.05, range: 112, coneDeg: 60, speed: 30, fillRate: 0.75, behavior: 'sentry' },
  shepherd:   { name: 'German Shepherd',  color: '#8a5a2e', dark: '#2a1a10', light: '#b07d45', collar: '#2e6b8a', earStyle: 'pointy', size: 1.10, range: 122, coneDeg: 70, speed: 48, fillRate: 0.85, behavior: 'pace' },
  rottweiler: { name: 'Rottweiler',       color: '#2a2018', dark: '#0f0b08', light: '#4a4038', collar: '#c9a23a', earStyle: 'floppy', size: 1.20, range: 106, coneDeg: 60, speed: 36, fillRate: 0.85, behavior: 'sentry' },
  greatdane:  { name: 'Great Dane',       color: '#b8a98f', dark: '#5a4a35', light: '#d8cbb0', collar: '#5a3a8a', earStyle: 'floppy', size: 1.30, range: 138, coneDeg: 50, speed: 34, fillRate: 0.80, behavior: 'sentry' },
  doberman:   { name: 'Doberman',         color: '#1c1410', dark: '#000000', light: '#3a2e28', collar: '#c94141', earStyle: 'pointy', size: 1.15, range: 150, coneDeg: 75, speed: 54, fillRate: 1.00, behavior: 'pace' },
};

/* House siding/roof/door/trim color variants, cycled per house for street variety */
const HOUSE_PALETTES = [
  { siding: '#d8c39a', roof: '#8a4a3a', door: '#5a3a22', trim: '#a9865a' },
  { siding: '#c9d6c0', roof: '#465264', door: '#3a2a1a', trim: '#8a9a80' },
  { siding: '#e0c9b0', roof: '#6a3a3a', door: '#2e2a26', trim: '#b09070' },
  { siding: '#cfe0d8', roof: '#3a4a3a', door: '#4a2a1a', trim: '#8fae9d' },
  { siding: '#e8dcc0', roof: '#5a4a6a', door: '#3a2a3a', trim: '#c0b090' },
];

/* ---------- Level configs ---------- */
const LEVELS = [
  { houses: 3, breeds: ['dachshund', 'bulldog'],                         doubleDogHouses: 0, bushChance: 0.85, desc: 'A quiet street. Easy does it.' },
  { houses: 4, breeds: ['dachshund', 'bulldog', 'corgi'],                 doubleDogHouses: 0, bushChance: 0.75, desc: 'A few more houses to cover.' },
  { houses: 4, breeds: ['corgi', 'beagle', 'bulldog'],                    doubleDogHouses: 1, bushChance: 0.65, desc: 'One house has backup.' },
  { houses: 5, breeds: ['beagle', 'poodle', 'corgi'],                     doubleDogHouses: 1, bushChance: 0.55, desc: 'Poodles move unpredictably. Watch closely.' },
  { houses: 5, breeds: ['poodle', 'beagle', 'husky'],                     doubleDogHouses: 2, bushChance: 0.45, desc: 'Huskies stand and stare a long way off.' },
  { houses: 6, breeds: ['husky', 'shepherd', 'poodle'],                   doubleDogHouses: 2, bushChance: 0.35, desc: 'Shepherds are fast and alert. Stay sharp.' },
  { houses: 6, breeds: ['shepherd', 'rottweiler', 'husky'],               doubleDogHouses: 3, bushChance: 0.25, desc: 'Heavy muscle on this block.' },
  { houses: 7, breeds: ['rottweiler', 'greatdane', 'shepherd'],           doubleDogHouses: 3, bushChance: 0.20, desc: 'Great Danes see for miles. Few bushes left.' },
  { houses: 8, breeds: ['greatdane', 'doberman', 'rottweiler'],           doubleDogHouses: 4, bushChance: 0.10, desc: 'Nearly no cover. Nerves of steel required.' },
  { houses: 9, breeds: ['doberman', 'greatdane', 'rottweiler', 'shepherd'], doubleDogHouses: 5, bushChance: 0.05, desc: 'The final gauntlet. Every elite breed on the route.' },
];

const HOUSE_H = 210;
const HOUSE_GAP = 26;
const LOT_W = 340;          // width of one house's footprint (yard + house)
const STREET_W = VIEW_W - LOT_W * 2; // center street/sidewalk strip

/* ---------- Utility ---------- */
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }
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
  mode: 'menu', // menu, howto, levelintro, playing, paused, busted, gameover, levelcomplete, win
  level: 0,     // 0-indexed
  lives: 3,
  world: null,
  camY: 0,
  lastTime: 0,
  suspicionDisplay: 0,
};

function screens() {
  return {
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
  const worldH = cfg.houses * (HOUSE_H + HOUSE_GAP) + 260;

  for (let i = 0; i < cfg.houses; i++) {
    const side = i % 2 === 0 ? 'left' : 'right';
    const topY = 140 + i * (HOUSE_H + HOUSE_GAP);
    const house = makeHouse(side, topY, cfg, i);
    houses.push(house);
  }

  const totalMail = houses.length;

  // static decorative elements, precomputed once so they don't flicker/jitter each frame
  const roadSpeckles = [];
  const speckleCount = Math.round(worldH / 14);
  for (let i = 0; i < speckleCount; i++) {
    roadSpeckles.push({
      x: LOT_W + 34 + Math.random() * (STREET_W - 68),
      y: Math.random() * worldH,
      r: 1 + Math.random() * 1.8,
      a: 0.05 + Math.random() * 0.08,
    });
  }
  const clouds = [];
  for (let i = 0; i < 3; i++) {
    clouds.push({ x: 80 + Math.random() * (VIEW_W - 160), y: 20 + Math.random() * 90, s: 0.7 + Math.random() * 0.6 });
  }

  return {
    cfg,
    houses,
    worldH,
    totalMail,
    delivered: 0,
    decor: { roadSpeckles, clouds },
    player: {
      x: VIEW_W / 2,
      y: 60,
      r: 11,
      speed: 130,
      sneakSpeed: 78,
      facing: Math.PI / 2,
      sneaking: false,
    },
    startPlayer: { x: VIEW_W / 2, y: 60 },
  };
}

function makeHouse(side, topY, cfg, index) {
  const houseW = 150;
  const yardW = LOT_W - houseW - 20;
  let houseX, yardX, mailboxX;
  if (side === 'left') {
    houseX = 0;
    yardX = houseW;
    mailboxX = LOT_W - 14;
  } else {
    houseX = VIEW_W - houseW;
    yardX = VIEW_W - LOT_W;
    mailboxX = VIEW_W - LOT_W + 14;
  }

  const wallRect = { x: houseX, y: topY, w: houseW, h: HOUSE_H };
  const yardRect = { x: yardX, y: topY, w: yardW, h: HOUSE_H };
  const mailbox = { x: mailboxX, y: topY + HOUSE_H / 2, delivered: false, r: 16 };

  // porch center = where sentry/pace dogs anchor (inside the yard, near the house), facing toward the street
  const porchX = side === 'left' ? yardX + 18 : yardX + yardW - 18;
  const facingAngle = side === 'left' ? 0 : Math.PI;

  // bushes: random small obstacles within yard, avoiding mailbox & porch line
  const bushes = [];
  const bushCount = Math.random() < cfg.bushChance ? (Math.random() < 0.4 ? 2 : 1) : 0;
  for (let b = 0; b < bushCount; b++) {
    const bw = 34, bh = 28;
    const bx = clamp(yardX + 20 + Math.random() * (yardW - 40 - bw), yardX, yardX + yardW - bw);
    const by = topY + 30 + Math.random() * (HOUSE_H - 60 - bh);
    bushes.push({ x: bx, y: by, w: bw, h: bh });
  }

  const palette = HOUSE_PALETTES[index % HOUSE_PALETTES.length];
  const hasChimney = index % 2 === 0;
  const flowerWindow = Math.random() < 0.5 ? 0 : 1;
  const doorX = side === 'left' ? houseX + houseW - 26 : houseX + 6;
  const doorCenterY = topY + HOUSE_H / 2;
  const walkway = side === 'left'
    ? { x: houseX + houseW, y: doorCenterY - 8, w: (mailboxX - 12) - (houseX + houseW), h: 16 }
    : { x: mailboxX + 12, y: doorCenterY - 8, w: houseX - (mailboxX + 12), h: 16 };

  // grass tufts: small static texture marks scattered in the yard
  const grassTufts = [];
  const tuftCount = 22;
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
      homeX: porchX,
      homeY: anchorY,
      angle: facingAngle,
      baseAngle: facingAngle,
      side,
      suspicion: 0,
      state: 'awake',
      sleepTimer: breed.behavior === 'sleepy' ? 2 + Math.random() * 2 : 0,
      patrolDir: 1,
      patrolRange: 34,
      sweepDir: 1,
      sweepT: Math.random() * Math.PI * 2,
      seen: false,
    };
    dogs.push(dog);
  }

  return {
    side, topY, wallRect, yardRect, mailbox, bushes, dogs, index,
    palette, hasChimney, flowerWindow, doorX, walkway, grassTufts,
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

  if (dx !== 0 || dy !== 0) {
    const len = Math.hypot(dx, dy);
    dx /= len; dy /= len;
    p.facing = Math.atan2(dy, dx);
    const spd = p.sneaking ? p.sneakSpeed : p.speed;
    const nx = p.x + dx * spd * dt;
    const ny = p.y + dy * spd * dt;

    // collide vs house walls only (yards, street, sidewalks are all walkable)
    let blockedX = false, blockedY = false;
    for (const h of w.houses) {
      if (circleRectOverlap(nx, p.y, p.r, h.wallRect)) blockedX = true;
      if (circleRectOverlap(p.x, ny, p.r, h.wallRect)) blockedY = true;
    }
    p.x = blockedX ? p.x : clamp(nx, p.r, VIEW_W - p.r);
    p.y = blockedY ? p.y : clamp(ny, p.r, w.worldH - p.r);
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

  if (breed.behavior === 'pace') {
    dog.x += dog.patrolDir * breed.speed * 0.5 * dt;
    if (dog.x > dog.homeX + dog.patrolRange) dog.patrolDir = -1;
    if (dog.x < dog.homeX - dog.patrolRange) dog.patrolDir = 1;
    dog.angle = dog.baseAngle; // always faces the street while pacing the porch
  } else if (breed.behavior === 'sentry') {
    dog.sweepT += dt * (breed.speed / 40);
    const sweep = Math.sin(dog.sweepT) * (breed.coneDeg * Math.PI / 180) * 0.6;
    dog.angle = dog.baseAngle + sweep;
  } else if (breed.behavior === 'erratic') {
    dog.sweepT += dt;
    if (dog.sweepT > 1.2) {
      dog.sweepT = 0;
      dog.patrolDir = Math.random() < 0.5 ? -1 : 1;
    }
    dog.x += dog.patrolDir * breed.speed * 0.35 * dt;
    dog.x = clamp(dog.x, dog.homeX - dog.patrolRange, dog.homeX + dog.patrolRange);
    dog.angle = dog.baseAngle + Math.sin(dog.sweepT * 3) * 0.5;
  }

  // clamp dog inside yard
  dog.x = clamp(dog.x, house.yardRect.x + 10, house.yardRect.x + house.yardRect.w - 10);
}

function canSeePlayer(dog, house, p) {
  if (dog.state === 'asleep') return false;
  const breed = dog.breed;
  const d = dist(dog.x, dog.y, p.x, p.y);
  let range = breed.range;
  if (p.sneaking) range *= 0.7;
  if (d > range) return false;

  const angToPlayer = Math.atan2(p.y - dog.y, p.x - dog.x);
  const diff = Math.abs(normAngle(angToPlayer - dog.angle));
  let halfCone = (breed.coneDeg * Math.PI / 180) / 2;
  if (p.sneaking) halfCone *= 0.85;
  if (diff > halfCone) return false;

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
  const targetY = clamp(p.y - VIEW_H / 2, 0, Math.max(0, w.worldH - VIEW_H));
  state.camY += (targetY - state.camY) * 0.15;
}

/* ---------- Rendering ---------- */
function draw() {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  if (!state.world) return;
  const w = state.world;

  ctx.save();
  ctx.translate(0, -state.camY);

  drawBackground(w);
  for (const h of w.houses) drawYard(h);
  drawRoad(w);
  for (const h of w.houses) drawHouse(h);
  for (const h of w.houses) for (const b of h.bushes) drawBush(b);
  for (const h of w.houses) drawMailbox(h.mailbox);

  // vision cones on top of scenery, under the characters
  for (const h of w.houses) for (const dog of h.dogs) drawVisionCone(dog);

  drawPlayer(w.player);
  for (const h of w.houses) for (const dog of h.dogs) drawDog(dog);

  ctx.restore();
}

function drawBackground(w) {
  ctx.fillStyle = '#4f8a4b';
  ctx.fillRect(0, 0, VIEW_W, w.worldH);
  // sky strip above the first house, with soft clouds
  const skyH = 130;
  const sky = ctx.createLinearGradient(0, 0, 0, skyH);
  sky.addColorStop(0, '#8fd0e8');
  sky.addColorStop(1, '#4f8a4b');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_W, skyH);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (const c of w.decor.clouds) {
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, 26 * c.s, 12 * c.s, 0, 0, Math.PI * 2);
    ctx.ellipse(c.x + 20 * c.s, c.y + 4 * c.s, 18 * c.s, 10 * c.s, 0, 0, Math.PI * 2);
    ctx.ellipse(c.x - 18 * c.s, c.y + 5 * c.s, 16 * c.s, 9 * c.s, 0, 0, Math.PI * 2);
    ctx.fill();
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
  // walkway from door to mailbox
  const wk = h.walkway;
  if (wk.w > 4) {
    ctx.fillStyle = '#c9c3b4';
    ctx.fillRect(wk.x, wk.y, wk.w, wk.h);
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1;
    for (let lx = wk.x + 10; lx < wk.x + wk.w; lx += 14) {
      ctx.beginPath();
      ctx.moveTo(lx, wk.y);
      ctx.lineTo(lx, wk.y + wk.h);
      ctx.stroke();
    }
  }
}

function drawRoad(w) {
  ctx.fillStyle = '#a19c8d';
  ctx.fillRect(LOT_W, 0, STREET_W, w.worldH);
  ctx.fillStyle = '#54585c';
  ctx.fillRect(LOT_W + 30, 0, STREET_W - 60, w.worldH);
  // curb lines
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(LOT_W + 30, 0); ctx.lineTo(LOT_W + 30, w.worldH);
  ctx.moveTo(LOT_W + STREET_W - 30, 0); ctx.lineTo(LOT_W + STREET_W - 30, w.worldH);
  ctx.stroke();
  // sidewalk expansion-joint ticks
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 1.5;
  for (let y = 20; y < w.worldH; y += 46) {
    ctx.beginPath();
    ctx.moveTo(LOT_W + 4, y); ctx.lineTo(LOT_W + 27, y);
    ctx.moveTo(LOT_W + STREET_W - 27, y); ctx.lineTo(LOT_W + STREET_W - 4, y);
    ctx.stroke();
  }
  // asphalt speckle texture
  for (const sp of w.decor.roadSpeckles) {
    ctx.fillStyle = `rgba(255,255,255,${sp.a})`;
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
    ctx.fill();
  }
  // center dashed line
  ctx.strokeStyle = 'rgba(255,224,110,0.8)';
  ctx.setLineDash([16, 18]);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(VIEW_W / 2, 0);
  ctx.lineTo(VIEW_W / 2, w.worldH);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawHouse(h) {
  const r = h.wallRect;
  const pal = h.palette;
  const flip = h.side === 'right';

  // soft ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(r.x + (flip ? -6 : 6), r.y + 8, r.w, r.h - 4);

  // roof/siding base
  ctx.fillStyle = pal.siding;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  // vertical siding texture
  ctx.strokeStyle = 'rgba(0,0,0,0.07)';
  ctx.lineWidth = 1;
  for (let lx = r.x + 10; lx < r.x + r.w; lx += 11) {
    ctx.beginPath();
    ctx.moveTo(lx, r.y + 14);
    ctx.lineTo(lx, r.y + r.h - 14);
    ctx.stroke();
  }

  // gable roof caps (top & bottom) with ridge + shingle ticks
  const capH = 16;
  ctx.fillStyle = pal.roof;
  ctx.fillRect(r.x, r.y, r.w, capH);
  ctx.fillRect(r.x, r.y + r.h - capH, r.w, capH);
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 1;
  for (let lx = r.x + 6; lx < r.x + r.w; lx += 9) {
    ctx.beginPath();
    ctx.moveTo(lx, r.y + 2); ctx.lineTo(lx, r.y + capH - 2);
    ctx.moveTo(lx, r.y + r.h - capH + 2); ctx.lineTo(lx, r.y + r.h - 2);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.moveTo(r.x, r.y + capH); ctx.lineTo(r.x + r.w, r.y + capH);
  ctx.moveTo(r.x, r.y + r.h - capH); ctx.lineTo(r.x + r.w, r.y + r.h - capH);
  ctx.stroke();

  // chimney
  if (h.hasChimney) {
    const chX = flip ? r.x + r.w - 26 : r.x + 12;
    ctx.fillStyle = '#8a5a4a';
    ctx.fillRect(chX, r.y - 6, 14, 18);
    ctx.fillStyle = '#6b4238';
    ctx.fillRect(chX - 2, r.y - 8, 18, 5);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.ellipse(chX + 6, r.y - 14, 4, 3.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.beginPath();
    ctx.ellipse(chX + 10, r.y - 21, 5.5, 4.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.ellipse(chX + 15, r.y - 29, 7, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // windows
  const winXs = flip ? [r.x + r.w * 0.55] : [r.x + r.w * 0.2];
  const winYs = [r.y + 24, r.y + r.h - 46];
  winYs.forEach((wy, i) => {
    const wx = winXs[0];
    drawWindow(wx, wy, 22, 22, pal.trim, h.flowerWindow === i);
  });

  // door with frame, panels, awning, knob
  const doorW = 20, doorH = 42;
  const dx = h.doorX, dy = r.y + r.h / 2 - doorH / 2;
  ctx.fillStyle = pal.trim;
  ctx.fillRect(dx - 3, dy - 3, doorW + 6, doorH + 3);
  ctx.fillStyle = pal.door;
  ctx.fillRect(dx, dy, doorW, doorH);
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(dx + 3, dy + 4, doorW - 6, doorH * 0.42);
  ctx.strokeRect(dx + 3, dy + doorH * 0.52, doorW - 6, doorH * 0.42);
  ctx.fillStyle = '#e8c95a';
  ctx.beginPath();
  ctx.arc(flip ? dx + 4 : dx + doorW - 4, dy + doorH / 2, 1.6, 0, Math.PI * 2);
  ctx.fill();
  // awning
  ctx.fillStyle = pal.roof;
  ctx.beginPath();
  ctx.ellipse(dx + doorW / 2, dy - 3, doorW / 2 + 5, 6, 0, Math.PI, 0);
  ctx.fill();
  // porch step
  ctx.fillStyle = '#bdb8ab';
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
    ctx.fillStyle = p.c;
    ctx.beginPath();
    ctx.ellipse(cx + p.dx, cy + p.dy, p.r, p.r * 0.82, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMailbox(mb) {
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.ellipse(mb.x, mb.y + 20, 9, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  // post
  const postGrad = ctx.createLinearGradient(mb.x - 2, 0, mb.x + 2, 0);
  postGrad.addColorStop(0, '#6b4a2e'); postGrad.addColorStop(1, '#8a5a2e');
  ctx.fillStyle = postGrad;
  ctx.fillRect(mb.x - 2, mb.y - 2, 4, 22);
  ctx.fillStyle = '#5a3e26';
  ctx.fillRect(mb.x - 6, mb.y + 18, 12, 4);
  // box (loaf shape)
  const boxColor = mb.delivered ? '#3bb54a' : '#c94141';
  const boxDark = mb.delivered ? '#2a8a37' : '#9c3131';
  ctx.fillStyle = boxDark;
  ctx.beginPath();
  ctx.moveTo(mb.x - 10, mb.y - 2);
  ctx.arc(mb.x, mb.y - 10, 10, Math.PI, 0);
  ctx.lineTo(mb.x + 10, mb.y - 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = boxColor;
  ctx.beginPath();
  ctx.moveTo(mb.x - 10, mb.y - 4);
  ctx.arc(mb.x, mb.y - 12, 10, Math.PI, 0);
  ctx.lineTo(mb.x + 10, mb.y - 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.ellipse(mb.x - 4, mb.y - 15, 4, 2, -0.3, 0, Math.PI * 2);
  ctx.fill();
  // flag
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(mb.x + 9, mb.y - 4);
  ctx.lineTo(mb.x + 9, mb.y - (mb.delivered ? 16 : 4));
  ctx.stroke();
  ctx.fillStyle = '#d94141';
  if (mb.delivered) {
    ctx.beginPath();
    ctx.moveTo(mb.x + 9, mb.y - 16);
    ctx.lineTo(mb.x + 15, mb.y - 13);
    ctx.lineTo(mb.x + 9, mb.y - 10);
    ctx.fill();
  }
  if (mb.delivered) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✓', mb.x, mb.y - 6);
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
}

function drawDog(dog) {
  const breed = dog.breed;
  const s = breed.size;

  // ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(dog.x, dog.y + 8 * s, 15 * s, 5 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(dog.x, dog.y);

  if (dog.state === 'asleep') {
    ctx.rotate(dog.angle > Math.PI / 2 || dog.angle < -Math.PI / 2 ? Math.PI : 0);
    ctx.fillStyle = breed.dark;
    ctx.beginPath();
    ctx.ellipse(0, 3 * s, 16 * s, 9 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = breed.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, 16 * s, 9 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = breed.dark;
    ctx.beginPath();
    ctx.ellipse(11 * s, 1, 6 * s, 5 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${11}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('z z z', dog.x - 8, dog.y - 14 * s - 4);
    return;
  }

  ctx.rotate(dog.angle);
  const wag = Math.sin(performance.now() / 180 + dog.x * 0.3) * 0.5;

  // legs (peek out from under the body)
  ctx.fillStyle = breed.dark;
  const legY = 7 * s;
  [-9, -3, 5, 11].forEach((lx) => {
    ctx.beginPath();
    ctx.ellipse(lx * s, legY, 2.4 * s, 4 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  // tail (wagging curve)
  ctx.strokeStyle = breed.dark;
  ctx.lineWidth = 4 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-14 * s, 0);
  ctx.quadraticCurveTo(-22 * s, -6 * s + wag * 4, -24 * s, -10 * s + wag * 6);
  ctx.stroke();

  // body with volume shading
  const bodyGrad = ctx.createRadialGradient(-3 * s, -4 * s, 2, 0, 0, 17 * s);
  bodyGrad.addColorStop(0, breed.light);
  bodyGrad.addColorStop(0.55, breed.color);
  bodyGrad.addColorStop(1, breed.dark);
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(-4 * s, 0, 12 * s, 8.5 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(6 * s, -1, 9 * s, 7.5 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // collar
  ctx.strokeStyle = breed.collar;
  ctx.lineWidth = 2.2 * s;
  ctx.beginPath();
  ctx.ellipse(11 * s, 0, 4.2 * s, 5.2 * s, 0, 0.3, Math.PI * 1.6);
  ctx.stroke();

  // head
  const headGrad = ctx.createRadialGradient(15 * s, -2 * s, 1, 14 * s, 0, 8 * s);
  headGrad.addColorStop(0, breed.light);
  headGrad.addColorStop(1, breed.color);
  ctx.fillStyle = headGrad;
  ctx.beginPath();
  ctx.ellipse(15 * s, 0, 8 * s, 7 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // ears
  ctx.fillStyle = breed.dark;
  if (breed.earStyle === 'pointy') {
    ctx.beginPath();
    ctx.moveTo(11 * s, -5 * s);
    ctx.lineTo(9 * s, -14 * s);
    ctx.lineTo(15 * s, -7 * s);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(19 * s, -5 * s);
    ctx.lineTo(21 * s, -14 * s);
    ctx.lineTo(16 * s, -7 * s);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(11 * s, -5 * s);
    ctx.quadraticCurveTo(6 * s, 0, 9 * s, 8 * s);
    ctx.quadraticCurveTo(13 * s, 4 * s, 12 * s, -4 * s);
    ctx.fill();
  }

  // snout + nose
  ctx.fillStyle = breed.color;
  ctx.beginPath();
  ctx.ellipse(22 * s, 1, 4.5 * s, 3.2 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = breed.dark;
  ctx.beginPath();
  ctx.ellipse(25.5 * s, 1, 2 * s, 1.6 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // eye
  ctx.fillStyle = '#1a1410';
  ctx.beginPath();
  ctx.arc(16.5 * s, -2.5 * s, 1.4 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.arc(17 * s, -3 * s, 0.5 * s, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // suspicion indicator (screen-aligned, not rotated with the dog)
  if (dog.suspicion > 0.02) {
    ctx.fillStyle = dog.suspicion >= 0.99 ? '#ff2222' : '#ffcc33';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(dog.suspicion > 0.6 ? '!' : '?', dog.x, dog.y - 18 * s - 4);
  }
}

function drawPlayer(p) {
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 9, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.facing);

  const bodyColor = p.sneaking ? '#2b6e4f' : '#3f9463';
  const bodyDark = p.sneaking ? '#1d4c36' : '#2c6d48';

  // legs (subtle walking hint)
  ctx.fillStyle = '#2e4a6b';
  ctx.beginPath();
  ctx.ellipse(-4, 7, 3.4, 5, 0, 0, Math.PI * 2);
  ctx.ellipse(-4, -7, 3.4, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // mailbag with strap and flap
  ctx.fillStyle = '#7a4a28';
  ctx.beginPath();
  ctx.ellipse(-6, 0, 3, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3b5fa0';
  ctx.beginPath();
  ctx.ellipse(-5, 7, 8.5, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2c4a80';
  ctx.beginPath();
  ctx.ellipse(-5, 4, 8, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // torso with shading
  const torsoGrad = ctx.createRadialGradient(-2, -3, 2, 0, 0, 12);
  torsoGrad.addColorStop(0, bodyColor);
  torsoGrad.addColorStop(1, bodyDark);
  ctx.fillStyle = torsoGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, 11, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  // belt
  ctx.strokeStyle = '#2a2a2a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, 11, 11, 0, 0.15, Math.PI - 0.15);
  ctx.stroke();

  // arms
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.ellipse(2, 9, 3.4, 4.5, 0, 0, Math.PI * 2);
  ctx.ellipse(2, -9, 3.4, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // head
  ctx.fillStyle = '#e8b98a';
  ctx.beginPath();
  ctx.ellipse(7, 0, 5.4, 5.4, 0, 0, Math.PI * 2);
  ctx.fill();
  // face hint (eye)
  ctx.fillStyle = '#2a1a12';
  ctx.beginPath();
  ctx.arc(10, -1.5, 1, 0, Math.PI * 2);
  ctx.fill();

  // cap with brim
  ctx.fillStyle = '#274b7a';
  ctx.beginPath();
  ctx.ellipse(6, -1, 6, 4.4, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#1c3a5e';
  ctx.beginPath();
  ctx.ellipse(9.5, -1, 3.2, 1.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd54a';
  ctx.beginPath();
  ctx.arc(6, -3.4, 1.1, 0, Math.PI * 2);
  ctx.fill();

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

showOnly('menu');
