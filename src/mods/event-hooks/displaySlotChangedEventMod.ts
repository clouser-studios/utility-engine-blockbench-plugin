import { registerMod } from '@blockbench-tools'
import EVENTS from '@events'

registerMod({
	id: 'utility-engine:display-slot-changed-event',
	apply: () => {
		const originalLoadDisplayFunctions = {
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
		}

		for (const [key, oldFunc] of Object.entries(originalLoadDisplayFunctions)) {
			// @ts-expect-error - No type is defined for this function
			DisplayMode[key] = function () {
				const previous = DisplayMode.display_slot
				oldFunc.call()
				const slot = DisplayMode.display_slot
				EVENTS.DISPLAY_SLOT_CHANGED.publish({ slot, previous })
			}
		}

		return originalLoadDisplayFunctions
	},
	revert: originalLoadDisplayFunctions => {
		for (const [key, oldFunc] of Object.entries(originalLoadDisplayFunctions)) {
			// @ts-expect-error - No type is defined for this function
			DisplayMode[key] = oldFunc
		}
	},
})
