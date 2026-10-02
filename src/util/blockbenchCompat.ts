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
 * `@blockbench-types` only exposes `StartScreen.loaders`/`open()`; `vue` and
 * `getFormatCategories` exist at runtime but aren't typed.
 */
export const startScreenCompat = StartScreen as typeof StartScreen & {
	vue: Vue & {
		getFormatCategories(): Record<string, { name: string; entries: unknown[] }>
	}
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

/**
 * `@blockbench-types` types `Locator` without its `position` property and `Billboard`
 * without its `facing_mode` property, even though both are real `Property` declarations
 * assigned at runtime in `js/outliner/types/locator.js` and
 * `js/outliner/types/billboard.js` respectively.
 */
declare global {
	interface LocatorOptions {
		position?: ArrayVector3
	}
	// @ts-expect-error - Duplicate definition warning for Locator interfaces
	interface Locator {
		position: ArrayVector3
	}
	interface Billboard {
		facing_mode: 'lookat' | 'lookat_y' | 'rotate' | 'rotate_y'
	}
}
