import EVENTS from '@events'
import { registerPatch } from 'blockbench-patch-manager'

// Provide a global object for other plugins to interact with
const API = {
	events: EVENTS,
}

declare global {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	const UtilityEngine: typeof API
}

registerPatch({
	id: 'utility-engine:public-api',
	apply: () => {
		// @ts-expect-error
		window.UtilityEngine = API
	},
	revert: () => {
		// @ts-expect-error
		delete window.UtilityEngine
	},
})
