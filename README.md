# sneaky-mail
Stealth Game

A browser stealth game: deliver mail to every house on the street without
being spotted by the dogs guarding the porches.

## Play

Open `index.html` in a browser (or serve the folder with any static file
server, e.g. `python3 -m http.server`).

- **Move:** Arrow keys or WASD
- **Sneak (slower, quieter, harder to detect):** Hold Shift
- **Deliver mail:** Walk up to a mailbox — it's automatic
- **Avoid:** Dog vision cones. Standing in one fills a suspicion meter; if it
  maxes out, the dog barks and you lose a life
- **Hide:** Bushes block a dog's line of sight
- **Pause:** P &nbsp; **Restart level:** R

## Features

- 10 dog breeds (Dachshund, Bulldog, Corgi, Beagle, Poodle, Husky, German
  Shepherd, Rottweiler, Great Dane, Doberman), each with distinct sight
  range, vision cone width, speed, and patrol behavior (pacing, standing
  sentry with a sweeping gaze, napping on a timer, or erratic movement)
- 10 levels of escalating difficulty — more houses, tougher breeds, houses
  guarded by two dogs, and progressively less bush cover
- No build step or dependencies — plain HTML5 canvas + vanilla JS

## Files

- `index.html` — page structure and UI overlays (menu, level intro, pause, etc.)
- `style.css` — styling
- `game.js` — game loop, level generation, dog AI, rendering
