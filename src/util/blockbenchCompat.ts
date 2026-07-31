import type { ModelFormat } from '@blockbench-types/generated/io/format.js'
import type { ModelLoader } from '@blockbench-types/generated/io/model_loader.js'

/**
 * `@blockbench-types` doesn't yet expose these properties on the `Blockbench` global, even
 * though they're assigned at runtime in `js/globals.js`. This is a typed view of the same
 * object reference, not a copy, so writes through it (e.g. monkey-patching `Animation`)
 * still affect the real global.
 */
export const BB = Blockbench as typeof Blockbench & {
	Animation: typeof _Animation
	AnimationController: typeof AnimationController
	ModelFormat: typeof ModelFormat
	ModelLoader: typeof ModelLoader
}

/**
 * `@blockbench-types` types `DisplayMode.slots`/`display_slot` as plain `string`, and is
 * missing `loadJSON` entirely, even though both exist at runtime.
 */
export const displayModeCompat = DisplayMode as typeof DisplayMode & {
	slots: DisplaySlotName[]
	display_slot: DisplaySlotName
	loadJSON(data: Record<string, DisplaySlotOptions>): void
}

/**
 * `@blockbench-types` types `Toolbars` as `{}` since its members are assigned dynamically
 * at runtime instead of being statically analyzable. It also types `Toolbar.add`'s
 * `position` param as required, even though it's optional at runtime.
 */
export const toolbarsCompat = Toolbars as unknown as Record<
	string,
	Omit<Toolbar, 'add'> & { add(action: any, position?: number): Toolbar }
>
