import type { events } from './util/events'

declare global {
	const UtilityEngine: {
		events: typeof events
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
