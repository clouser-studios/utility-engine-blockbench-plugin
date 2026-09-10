# Utility Engine

A [Blockbench](https://blockbench.net) plugin for creating [Utility Engine](https://www.utility-engine.com) models.

Requires Blockbench `5.1.6` or newer, desktop.

## Features

- **Utility Model** format and **Utility Model Project** files (`.utilityproject`) that keep every bit of project data for future editing
- Import and export `.utility.json` models
- **Animation Properties** dialog with typed animations — main loop, custom, and the full set of held / placed / consume / charging / swimming states — plus loop mode and loop delay
- **Skin textures** with a preview skin loaded from a file or a Minecraft username
- **Arm Rotation** display panel for posing the player's arms around a held item, including a separate pose for when the offhand is occupied
- Per-element backface culling with a project-wide default, and a model identifier in project settings
- Display-mode helpers: rotation lock and pose-angle sliders

## Development

- `bun install` — set up the dev environment
- `bun run dev` — build in dev mode and watch for changes
- `bun run prod` — build a production plugin and exit
- `bun run test` — production build, then the Jest suite
- `bun run lint` / `bun run format` — ESLint / Prettier

Runtime patches (function overrides, property overrides, format-conditional behavior) go through
[`blockbench-patch-manager`](https://github.com/SnaveSutit/blockbench-patch-manager) so they apply and
revert cleanly and compose with other plugins that patch the same members — see `src/mods/`.
