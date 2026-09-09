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

On a phone, turn it sideways: a thumbstick appears on the left and the sneak,
van, horn and pause buttons on the right. The board is authored at a fixed
900x600 and scaled as one piece to fit the window, so the HUD, overlays and
controls all hold their proportions instead of each needing a breakpoint.

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
- **Three badges per street** — *Swift* (beat the par time), *Unseen* (no dog
  ever laid eyes on you) and *Flawless* (no lives lost). All three is an Ace
  Carrier. Clearing a street is easy; clearing it clean is the actual game.
- **A local scoreboard** on the menu — runs, streets cleared, letters
  delivered, and a best time and badge set per street — kept in `localStorage`
  on your own device. Nothing is uploaded and there's a reset link right next
  to it.

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

**Par times are derived, not typed in.** The target time for a street is
computed from the street itself: drive the van down the road to the next pair
of houses, walk out to those two mailboxes and back for the next two letters,
straight-line at the carrier's pace, then padded for the detours a yard full
of solids forces and for the dogs you have to wait out. Change a level's house
count or move a mailbox in the editor and its par moves with it, which is the
same reason collision is derived rather than authored — hand-tuned numbers go
stale the moment the thing they describe changes.

**Sprites were cut programmatically.** The art arrived as sheets, so the
frames are separated with connected-component labelling and each component
masked individually, so touching frames can't bleed into each other. The van
needed a second pass: the sheet's shadow under each vehicle is as black as
the tyres, so a plain background fill ate the wheels.

**All audio is synthesised** through the Web Audio API — barks, footsteps,
the van engine, delivery chimes — so there are no audio files in the repo.
Barks are attenuated by distance, which turns the pack into a rough
proximity cue.

## Counting visits

`index.html` ends with an opt-in block for [GoatCounter](https://www.goatcounter.com),
which counts page views without cookies, without storing IP addresses and
without profiling the visitor — so there's nothing to put a consent banner in
front of. It's inert as shipped: set `SITE` to your GoatCounter subdomain to
switch it on, and until you do, the page makes no third-party request at all.

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
