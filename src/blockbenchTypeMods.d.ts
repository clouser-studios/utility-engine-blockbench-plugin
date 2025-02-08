import type EVENTS from './util/events'

declare global {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	const UtilityEngine: {
		events: typeof EVENTS
	}

	type UtilityAnimationType =
		| 'basic_loop'
		| 'being_broken'
		| 'being_used_loop'
		| 'left_click'
		| 'obtained'
		| 'placed_loop'
		| 'placed'
		| 'right_click'
		| 'stopped_being_used'
		| 'used'
		| 'custom'
}
