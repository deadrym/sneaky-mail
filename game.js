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
  dachshund:  { name: 'Dachshund',        color: '#a35d2b', dark: '#7a4620', size: 0.85, range: 65,  coneDeg: 50, speed: 24, fillRate: 0.55, behavior: 'pace' },
  bulldog:    { name: 'Bulldog',          color: '#c9a877', dark: '#8a6f4e', size: 1.10, range: 68,  coneDeg: 55, speed: 16, fillRate: 0.50, behavior: 'sleepy' },
  corgi:      { name: 'Corgi',            color: '#e0a94a', dark: '#8a5a1e', size: 0.90, range: 80,  coneDeg: 55, speed: 30, fillRate: 0.60, behavior: 'pace' },
  beagle:     { name: 'Beagle',           color: '#caa06a', dark: '#5a3a1e', size: 0.95, range: 92,  coneDeg: 60, speed: 34, fillRate: 0.65, behavior: 'pace' },
  poodle:     { name: 'Poodle',           color: '#f2ead9', dark: '#cbbfa0', size: 1.00, range: 85,  coneDeg: 65, speed: 32, fillRate: 0.70, behavior: 'erratic' },
  husky:      { name: 'Husky',            color: '#7d8896', dark: '#333a42', size: 1.05, range: 112, coneDeg: 60, speed: 30, fillRate: 0.75, behavior: 'sentry' },
  shepherd:   { name: 'German Shepherd',  color: '#8a5a2e', dark: '#2a1a10', size: 1.10, range: 122, coneDeg: 70, speed: 48, fillRate: 0.85, behavior: 'pace' },
  rottweiler: { name: 'Rottweiler',       color: '#2a2018', dark: '#0f0b08', size: 1.20, range: 106, coneDeg: 60, speed: 36, fillRate: 0.85, behavior: 'sentry' },
  greatdane:  { name: 'Great Dane',       color: '#b8a98f', dark: '#5a4a35', size: 1.30, range: 138, coneDeg: 50, speed: 34, fillRate: 0.80, behavior: 'sentry' },
  doberman:   { name: 'Doberman',         color: '#1c1410', dark: '#000000', size: 1.15, range: 150, coneDeg: 75, speed: 54, fillRate: 1.00, behavior: 'pace' },
};

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

  return {
    cfg,
    houses,
    worldH,
    totalMail,
    delivered: 0,
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

  return { side, topY, wallRect, yardRect, mailbox, bushes, dogs, index };
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

  // street background
  ctx.fillStyle = '#4f8a4b';
  ctx.fillRect(0, 0, VIEW_W, w.worldH);

  // road/sidewalk strip
  ctx.fillStyle = '#8f8b80';
  ctx.fillRect(LOT_W, 0, STREET_W, w.worldH);
  ctx.fillStyle = '#565b60';
  ctx.fillRect(LOT_W + 30, 0, STREET_W - 60, w.worldH);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.setLineDash([16, 18]);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(VIEW_W / 2, 0);
  ctx.lineTo(VIEW_W / 2, w.worldH);
  ctx.stroke();
  ctx.setLineDash([]);

  for (const h of w.houses) drawHouse(h);

  // vision cones on top of houses, under the player
  for (const h of w.houses) for (const dog of h.dogs) drawVisionCone(dog);

  drawPlayer(w.player);

  for (const h of w.houses) for (const dog of h.dogs) drawDog(dog);

  ctx.restore();
}

function drawHouse(h) {
  const r = h.wallRect;
  // yard
  ctx.fillStyle = '#5fa85a';
  ctx.fillRect(h.yardRect.x, h.yardRect.y, h.yardRect.w, h.yardRect.h);
  // house body
  ctx.fillStyle = '#d8c39a';
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.fillStyle = '#a9865a';
  ctx.fillRect(r.x, r.y, r.w, 14);
  ctx.fillRect(r.x, r.y + r.h - 14, r.w, 14);
  // door
  ctx.fillStyle = '#5a3a22';
  const doorX = h.side === 'left' ? r.x + r.w - 26 : r.x + 6;
  ctx.fillRect(doorX, r.y + r.h / 2 - 20, 20, 40);
  // a couple windows
  ctx.fillStyle = '#cfe8f2';
  ctx.fillRect(r.x + r.w * 0.2, r.y + 24, 22, 22);
  ctx.fillRect(r.x + r.w * 0.2, r.y + r.h - 46, 22, 22);

  // bushes
  ctx.fillStyle = '#2f6b34';
  for (const b of h.bushes) {
    ctx.beginPath();
    ctx.ellipse(b.x + b.w / 2, b.y + b.h / 2, b.w / 2, b.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(b.x + b.w / 2 - 8, b.y + b.h / 2 + 4, b.w / 3, b.h / 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // mailbox
  const mb = h.mailbox;
  ctx.fillStyle = '#8a5a2e';
  ctx.fillRect(mb.x - 2, mb.y - 4, 4, 22);
  ctx.fillStyle = mb.delivered ? '#3bb54a' : '#c94141';
  ctx.fillRect(mb.x - 10, mb.y - 16, 20, 14);
  ctx.fillStyle = '#fff';
  ctx.fillRect(mb.x - 10, mb.y - 16, 20, 3);
  if (mb.delivered) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✓', mb.x, mb.y - 18);
  }
}

function drawVisionCone(dog) {
  const breed = dog.breed;
  const half = (breed.coneDeg * Math.PI / 180) / 2;
  let range = breed.range;
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
}

function drawDog(dog) {
  const breed = dog.breed;
  const s = breed.size;
  ctx.save();
  ctx.translate(dog.x, dog.y);

  if (dog.state === 'asleep') {
    ctx.fillStyle = breed.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, 16 * s, 10 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('z z z', -10, -14 * s - 4);
  } else {
    ctx.rotate(dog.angle);
    // tail
    ctx.fillStyle = breed.dark;
    ctx.fillRect(-18 * s, -3, 8, 6);
    // body
    ctx.fillStyle = breed.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, 15 * s, 9 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    // head
    ctx.beginPath();
    ctx.ellipse(14 * s, 0, 8 * s, 7 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    // ears
    ctx.fillStyle = breed.dark;
    ctx.beginPath();
    ctx.moveTo(14 * s, -6 * s);
    ctx.lineTo(19 * s, -13 * s);
    ctx.lineTo(10 * s, -8 * s);
    ctx.fill();
    // snout
    ctx.fillStyle = breed.dark;
    ctx.beginPath();
    ctx.ellipse(21 * s, 1, 3.5 * s, 2.5 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.translate(dog.x, dog.y);
  }

  // suspicion indicator
  if (dog.suspicion > 0.02 && dog.state !== 'asleep') {
    ctx.fillStyle = dog.suspicion >= 0.99 ? '#ff2222' : '#ffcc33';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(dog.suspicion > 0.6 ? '!' : '?', 0, -18 * s - 4);
  }

  ctx.restore();
}

function drawPlayer(p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 8, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.rotate(p.facing);
  // mailbag
  ctx.fillStyle = '#3b5fa0';
  ctx.beginPath();
  ctx.ellipse(-2, 6, 8, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // body
  ctx.fillStyle = p.sneaking ? '#2b6e4f' : '#3f9463';
  ctx.beginPath();
  ctx.ellipse(0, 0, 11, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  // head/nose direction
  ctx.fillStyle = '#e8b98a';
  ctx.beginPath();
  ctx.ellipse(6, 0, 5, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // hat
  ctx.fillStyle = '#274b7a';
  ctx.beginPath();
  ctx.ellipse(6, -1, 5.5, 3, 0, 0, Math.PI * 2);
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
