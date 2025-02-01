import { events } from './util/events'

declare global {
	// Replace BlockbenchPluginTemplate with the name of your plugin.
	const BlockbenchPluginTemplate: {
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

	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface _Animation {
		utility_type?: UtilityAnimationType
	}
}
