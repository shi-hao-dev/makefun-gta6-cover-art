[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/shi-hao-dev/makefun-gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/shi-hao-dev/makefun-gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Sunset Cover Studio

A browser web app that runs fully offline and turns your own photos plus a
caption into multi-panel cover art in the style of a Vice City sunset poster:
one big hero panel, two smaller panels, white poster gutters, a warm neon
grade over every photo, and a big gradient title with a city-tag pill —
exported as a PNG you can post.

## What it makes

Each cover is three photos (or one photo reused across all three panels) under
a sunset wash, with a bold outlined title, a subtitle and a tag in the corner.
Four colour grades — Sunset, Neon, Dusk, Golden — and three post sizes:
1080 × 1080, 1080 × 1350 and 1920 × 1080. The screenshots in this repo show
all three sizes.

## How it works

1. Drop a photo into each of the three panels (or reuse one photo across all
   of them with one button). Click a panel in the live preview to select it,
   then drag inside it to reposition the photo and scroll or use the zoom
   slider to crop it tighter.
2. Type your title, subtitle and city tag. Pick a colour grade and a post size.
3. Hit **Export PNG**. The cover is drawn on a canvas at full post size and
   downloaded straight from your browser — nothing is uploaded anywhere, your
   photos never leave your machine.

Two demo photos ship under `app/samples/` (made with an image model, free to
use) so you can try it without picking a photo first; the **Load demo photos**
button fills all three panels with them.

## Running it

No build step, no network. Serve `app/` with any static file server and open
`index.html`, for example:

```sh
node serve.ts
# open http://localhost:8080
```

The title font is Anton (SIL Open Font License), vendored under
`app/fonts/` with its licence text. Everything else is hand-drawn on canvas:
the sunset wash, the synthwave sun, the panel gutters and the lettering are
all original work — no game artwork, logos or fonts from any game.

## Handing it in

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/`
into the output directory and writes `dossier.json` with the vendored
make.fun library:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Built for make.fun's "Make GTA 6 Cover Art" bounty. Try make.fun yourself:
https://make.fun/r/ssmh6x4k (referral code `ssmh6x4k`).
