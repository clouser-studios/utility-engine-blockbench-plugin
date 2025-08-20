import type { latest } from './formats/utilityProject/versions/latest'
import type EVENTS from './util/events'

declare global {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	const UtilityEngine: {
		events: typeof EVENTS
	}

	// eslint-disable-next-line @typescript-eslint/naming-convention
	let display_mode: boolean

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

	interface ModelProject {
		default_backface_culling_mode?: 'no_culling' | 'cull_backfaces'
		display_settings: Record<DisplaySlotName, latest.IDisplaySetting>
	}

	interface Cube {
		enableBackfaceCulling?: boolean
	}

	interface Mesh {
		enableBackfaceCulling?: boolean
	}
}
