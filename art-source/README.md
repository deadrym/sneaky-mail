# Source art

The original sheets and sprites the game's art was cut from. Nothing here is
loaded at runtime — the game reads the trimmed, game-ready files under
`assets/`. These are kept for provenance and so the art can be re-cut if the
sprite sizes or footprints ever need to change.

| file | cut into |
| --- | --- |
| `dogs-spritesheet.png` | `assets/dogs/` — ten breeds plus move/sleep/bark frames |
| `mailman-spritesheet.png` | `assets/mailman/` — walk, sneak, hurt, victory, portrait |
| `mailboxes-spritesheet.png` | `assets/mailboxes/` — twelve mailbox styles |
| `mailvan-spritesheet.png` | `assets/vehicle/` — four van orientations |
| `sprites/` | `assets/props/` — houses and yard props, trimmed to their opaque bounds |

Sprites were separated with connected-component labelling over an alpha or
background mask, then each component was masked individually so touching
frames on the sheet couldn't bleed into one another.
