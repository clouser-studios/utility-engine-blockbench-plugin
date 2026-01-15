import { registerMod } from '@blockbench-tools'
import EVENTS from '@events'

// Provide a global object for other plugins to interact with
const API = {
	events: EVENTS,
}

declare global {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	const UtilityEngine: typeof API
}

registerMod({
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
