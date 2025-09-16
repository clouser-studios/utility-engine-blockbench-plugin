import EVENTS from '@utility/util/events'
import { createBlockbenchMod } from '@utility/util/moddingTools'

createBlockbenchMod({
	id: 'utility-engine:display-slot-changed-event',
	collectContext: () => ({
		originalLoadDisplayFunctions: {
			// @ts-expect-error
			loadThirdRight: DisplayMode.loadThirdRight,
			// @ts-expect-error
			loadThirdLeft: DisplayMode.loadThirdLeft,
			// @ts-expect-error
			loadFirstRight: DisplayMode.loadFirstRight,
			// @ts-expect-error
			loadFirstLeft: DisplayMode.loadFirstLeft,
			// @ts-expect-error
			loadHead: DisplayMode.loadHead,
			// @ts-expect-error
			loadGUI: DisplayMode.loadGUI,
			// @ts-expect-error
			loadGround: DisplayMode.loadGround,
			// @ts-expect-error
			loadFixed: DisplayMode.loadFixed,
			// @ts-expect-error
			loadShelf: DisplayMode.loadShelf,
		},
	}),
	apply(ctx) {
		for (const [key, oldFunc] of Object.entries(ctx.originalLoadDisplayFunctions)) {
			// @ts-expect-error - No type is defined for this function
			DisplayMode[key] = function () {
				const previous = display_slot
				oldFunc.call()
				const slot = display_slot
				EVENTS.DISPLAY_SLOT_CHANGED.publish({ slot, previous })
			}
		}
		return ctx
	},
	revert(ctx) {
		for (const [key, oldFunc] of Object.entries(ctx.originalLoadDisplayFunctions)) {
			// @ts-expect-error - No type is defined for this function
			DisplayMode[key] = oldFunc
		}
	},
})
