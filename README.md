# Utility Engine

Build [Utility Engine](https://www.utility-engine.com) models without leaving [Blockbench](https://blockbench.net). Model, texture, animate, and export `.utility.json` files that are ready for your pack.

Requires Blockbench `5.1.6` or newer (desktop).

## Install

In Blockbench, open **File > Plugins**, search for **Utility Engine**, and click **Install**.

## Features

- **Utility Model Projects** (`.utilityproject`) save every bit of project data, so you pick up exactly where you left off
- **Import and export `.utility.json`**, with locators, billboards, bounding boxes, and armatures round-tripping intact
- **Typed animations**: main loop, custom, and every held, placed, consume, charging, and swimming state, with loop mode, loop delay, and Function keyframes
- **Skin textures** previewed from a file or any Minecraft username, with All / Wide Only / Slim Only variants per element
- **Arm Rotation** display panel for posing the player's arms around a held item, including a separate pose for a full offhand
- **Display overrides** that point any display slot at another model
- Per-element render passes and backface culling, with a project-wide default
- Display-mode helpers: rotation lock and pose-angle sliders

## Bugs and ideas

Found a bug or want a feature? [Open an issue](https://github.com/clouser-studios/utility-engine-blockbench-plugin/issues).

## Development

- `bun install` — set up the dev environment
- `bun run dev` — build in dev mode and watch for changes
- `bun run prod` — build a production plugin and exit
- `bun run test` — production build, then the Jest suite
- `bun run lint` / `bun run format` — ESLint / Prettier

Runtime patches (function overrides, property overrides, format-conditional behavior) go through
[`blockbench-patch-manager`](https://github.com/SnaveSutit/blockbench-patch-manager) so they apply and
revert cleanly and compose with other plugins that patch the same members — see `src/mods/`.
