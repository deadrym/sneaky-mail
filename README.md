# Sneaky Mail

A browser stealth game. You're a mail carrier working a suburban route, and
every house has a dog in the yard. Deliver to every mailbox without any of
them getting a good look at you.

Plain HTML5 canvas and vanilla JavaScript — no build step, no dependencies,
no framework.

**[▶ Play it](index.html)** — or clone and open `index.html` directly. To
serve it locally: `python3 -m http.server` and visit `localhost:8000`.

---

## How to play

| | |
| --- | --- |
| Move | Arrow keys or WASD |
| Sneak — slower, quieter, harder to spot | Hold Shift |
| Get in / out of the mail van | Space |
| Sound the horn (from the driver's seat) | H |
| Pause · Restart level · Mute | P · R · M |

Walk up to a mailbox to deliver — it's automatic, but your satchel only
holds two letters, so you'll be walking back to the van to reload. Dogs
can't see you while you're inside the van, and you can't deliver from it
either.

Getting seen fills a dog's suspicion meter. Fill it completely and you're
bitten and lose a life. Break line of sight and it drains — trees, hedges
and shrubs all block sight, and every prop in a yard is solid, so the route
you pick through a garden is the whole game.

The horn is the interesting tool: every dog in earshot breaks off its patrol
and comes to investigate the noise, which is the only way to pull a guard
off the mailbox side of its yard. It also wakes the ones that nap, so it
costs you as much as it buys.

## What's in it

- **Ten dog breeds**, each with its own sight range, cone width, speed,
  suspicion build rate and patrol behaviour — pacing, standing sentry with a
  sweeping gaze, napping on a timer, or moving erratically. Dogs lock on and
  stalk while they can see you, and keep watching where you were for a
  moment after you break cover.
- **Ten levels** of escalating difficulty: more houses, tougher breeds, some
  yards guarded by two dogs.
- **A drivable mail van** confined to the road network, with a satchel limit
  that turns the round into a route-planning problem.
- **Hand-composed lots** built from individual sprites, arranged in a
  companion visual editor rather than hard-coded.

## Notes on the build

A few things here were more interesting than the game logic itself:

**Collision is derived from the art, never hand-authored.** Each prop
declares what share of its sprite is actually standing on the ground, and
the solid rectangles are computed from that. A face-on house blocks at its
base rather than across its roof; a lamppost blocks at its post. An earlier
version had the obstacles typed in by hand against baked scene images, and
they drifted out of step with the art constantly. Deriving them removed that
whole class of bug.

**Levels are verified, not eyeballed.** A flood fill runs from the player's
spawn across every level and confirms that every mailbox is physically
reachable and no dog starts wedged inside a solid. This caught a real
failure: when the mailboxes were moved to sit against the porches, four of
five lots became undeliverable, because the delivery radius was smaller than
the distance the house's own footprint held the player back.

**Sprites were cut programmatically.** The art arrived as sheets, so the
frames are separated with connected-component labelling and each component
masked individually, so touching frames can't bleed into each other. The van
needed a second pass: the sheet's shadow under each vehicle is as black as
the tyres, so a plain background fill ate the wheels.

**All audio is synthesised** through the Web Audio API — barks, footsteps,
the van engine, delivery chimes — so there are no audio files in the repo.
Barks are attenuated by distance, which turns the pack into a rough
proximity cue.

## Layout

```
index.html      page shell and UI overlays
game.js         everything: loop, world generation, dog AI, rendering, audio
style.css       styling
assets/         game-ready sprites and tiles, loaded at runtime
art-source/     the original sheets the sprites were cut from (not loaded)
```

## How this was built

I built this with the help of an AI coding assistant, and I'd rather say so
plainly than let anyone assume otherwise.

I directed the project throughout: the design and art direction, the
neighbourhood and gameplay concepts, the pixel art, arranging every lot
layout by hand, the balance calls, and the testing and bug reports that
drove most of the iterations. The assistant wrote and verified the bulk of
the implementation code, and worked through the debugging with me.

The commit history is the honest record of how it came together, if you want
to see the shape of the work.

## Credits

Art generated and directed by me. Game code written collaboratively as
described above.
