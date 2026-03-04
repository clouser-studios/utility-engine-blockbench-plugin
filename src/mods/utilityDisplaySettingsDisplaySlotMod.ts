import EVENTS from '@events'
import { currentFormatIsUtilityModelProject } from '@utility/formats/utility-model-project/index.ts'
import { scrubUndefined } from '@utility/util/objUtils.ts'
import { registerPatch } from 'blockbench-patch-manager'

declare global {
	interface DisplaySlot {
		left_arm_rotation?: ArrayVector3
		left_arm_rotation_when_offhand_occupied?: ArrayVector3
		right_arm_rotation?: ArrayVector3
		right_arm_rotation_when_offhand_occupied?: ArrayVector3
	}
	// interface ModelProject {
	// 	display_settings: Record<DisplaySlotName, UtilityDisplaySlot>
	// }
}

class UtilityDisplaySlot extends DisplaySlot {
	private disableUpdates = false

	// eslint-disable-next-line @typescript-eslint/naming-convention
	left_arm_rotation?: ArrayVector3
	// eslint-disable-next-line @typescript-eslint/naming-convention
	left_arm_rotation_when_offhand_occupied?: ArrayVector3
	// eslint-disable-next-line @typescript-eslint/naming-convention
	right_arm_rotation?: ArrayVector3
	// eslint-disable-next-line @typescript-eslint/naming-convention
	right_arm_rotation_when_offhand_occupied?: ArrayVector3

	constructor(id: DisplaySlotName, data?: DisplaySlotOptions) {
		super(id, data)
		this.extend(data)
	}

	default() {
		super.default()
		if (currentFormatIsUtilityModelProject()) {
			this.left_arm_rotation = undefined
			this.left_arm_rotation_when_offhand_occupied = undefined
			this.right_arm_rotation = undefined
			this.right_arm_rotation_when_offhand_occupied = undefined
		}
		return this
	}

	copy() {
		const base = super.copy()
		if (!currentFormatIsUtilityModelProject()) return base
		return {
			...base,
			left_arm_rotation: this.left_arm_rotation?.slice(),
			left_arm_rotation_when_offhand_occupied:
				this.left_arm_rotation_when_offhand_occupied?.slice(),
			right_arm_rotation: this.right_arm_rotation?.slice(),
			right_arm_rotation_when_offhand_occupied:
				this.right_arm_rotation_when_offhand_occupied?.slice(),
		}
	}

	extend(data?: any): this {
		if (currentFormatIsUtilityModelProject()) {
			this.disableUpdates = true
			super.extend(data)
			this.disableUpdates = false

			this.left_arm_rotation = data?.left_arm_rotation?.slice()
			this.left_arm_rotation_when_offhand_occupied =
				data?.left_arm_rotation_when_offhand_occupied?.slice()
			this.right_arm_rotation = data?.right_arm_rotation?.slice()
			this.right_arm_rotation_when_offhand_occupied =
				data?.right_arm_rotation_when_offhand_occupied?.slice()

			this.update()
		} else {
			super.extend(data)
		}

		return this
	}

	export() {
		if (currentFormatIsUtilityModelProject()) {
			const build = super.export() ?? ({} as any)

			build.left_arm_rotation = this.left_arm_rotation?.slice()
			build.left_arm_rotation_when_offhand_occupied =
				this.left_arm_rotation_when_offhand_occupied?.slice()
			build.right_arm_rotation = this.right_arm_rotation?.slice()
			build.right_arm_rotation_when_offhand_occupied =
				this.right_arm_rotation_when_offhand_occupied?.slice()

			scrubUndefined(build)

			if (Object.keys(build).length > 0) {
				return build
			}
		} else {
			return super.export()
		}
	}

	update(): this {
		if (this.disableUpdates) return this

		super.update()

		if (Modes.display && this === DisplayMode.slot && currentFormatIsUtilityModelProject()) {
			EVENTS.DISPLAY_SETTINGS_UPDATED.publish(this)
		}

		return this
	}
}

registerPatch({
	id: 'utility-engine:utility-display-settings-display-slot',
	apply: () => {
		const original = DisplaySlot
		// @ts-expect-error
		DisplaySlot = UtilityDisplaySlot
		return { original }
	},
	revert: ({ original }) => {
		// @ts-expect-error
		DisplaySlot = original
	},
})
