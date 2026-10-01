import { currentFormatIsUtilityModelProject } from '@utility/formats/utility-model-project/index.ts'
import { BB } from '@utility/util/blockbenchCompat.ts'
import { localize } from '@utility/util/lang.ts'
import { registerPatch } from 'blockbench-patch-manager'

export const ANIMATION_TYPES = {
	custom: 'loop',

	main_loop: 'loop',

	selected_reset: 'once',

	held_reset: 'once',
	held_loop: 'loop',
	held_stop: 'once',

	not_held_loop: 'loop',

	left_click: 'once',
	right_click: 'once',

	used: 'once',

	charging_reset: 'once',
	charging_loop: 'loop',

	consume_reset: 'once',
	consume_loop: 'loop',
	consume_cancel: 'once',

	swimming_reset: 'once',
	swimming_loop: 'loop',
	swimming_stop: 'once',

	picked_up: 'once',

	being_worn_reset: 'once',
	being_worn_loop: 'loop',

	placed_reset: 'once',
	placed_loop: 'loop',

	placed_use_reset: 'once',
	placed_use_loop: 'loop',
	placed_use_stop: 'once',

	placed_falling_reset: 'once',
	placed_falling: 'loop',

	placed_breaking_reset: 'once',
	placed_breaking_loop: 'loop',
	placed_breaking_stop: 'once',
	placed_broken: 'once',

	placed_walked_on_reset: 'once',
	placed_walked_on_loop: 'loop',
}

type AnimationType = keyof typeof ANIMATION_TYPES

export interface UtilityModelAnimationOptions extends AnimationOptions {
	utility_model_animation_type?: AnimationType
	animators?: Record<string, GeneralAnimator>
}

class UtilityModelAnimation extends BB.Animation {
	// `declare`, not a field: a real field (even uninitialized) clobbers what `extend()`
	// sets during `super()`, since it runs its own assignment right after `super()` returns.
	// eslint-disable-next-line @typescript-eslint/naming-convention
	declare utility_model_animation_type: AnimationType

	constructor(data?: UtilityModelAnimationOptions) {
		data ??= {}
		data.name ??= 'new_animation'
		super(data)
	}

	extend(data?: UtilityModelAnimationOptions) {
		data ??= {}
		data.name ??= 'new_animation'

		super.extend(data)

		// Reclassification below is Utility Model Project-specific.
		if (!currentFormatIsUtilityModelProject()) {
			this.utility_model_animation_type ??= 'custom'
			return this
		}

		if (data.utility_model_animation_type) {
			this.utility_model_animation_type = data.utility_model_animation_type
		} else if (this.name.startsWith('utility.')) {
			this.name = this.name.slice(8)
			this.path = 'utility'
			this.utility_model_animation_type = this.name as AnimationType
		} else if (Object.keys(ANIMATION_TYPES).includes(this.name)) {
			this.path = 'utility'
			this.utility_model_animation_type = this.name as AnimationType
		} else {
			this.path = 'custom'
			this.utility_model_animation_type = 'custom'
		}

		return this
	}

	remove(undo: boolean, removeFromFiles = true) {
		if (currentFormatIsUtilityModelProject()) {
			return super.remove(undo, false)
		} else {
			return super.remove(undo, removeFromFiles)
		}
	}

	setLength(len = this.length) {
		this.length = 0
		this.length = limitNumber(len, this.getMaxLength(), 1e4)
		if (BB.Animation.selected == this) {
			// @ts-expect-error
			Timeline.vue._data.animation_length = this.length
			// @ts-expect-error
			BarItems.slider_animation_length.update()
		}
	}
}

UtilityModelAnimation.prototype.file_menu = new Menu([
	{
		name: localize('action.delete_animation_folder.label'),
		icon: 'delete',
		click(folderName: string) {
			Undo.initEdit({ animations: Animator.animations })
			for (const anim of Animator.animations.filter(anim => anim.path === folderName)) {
				anim.remove(false, false)
			}
			Undo.finishEdit('Remove Animation Folder', {
				animations: Animator.animations,
			})
		},
	},
])

registerPatch({
	id: 'utility_engine:utility-model-animation-override',

	apply: () => {
		const originalAddAnimation = Panels.animations.vue.addAnimation
		Panels.animations.vue.addAnimation = function (
			this: any,
			groupName: string,
			...args: any[]
		) {
			if (currentFormatIsUtilityModelProject()) {
				new UtilityModelAnimation({
					name: groupName,
					utility_model_animation_type: groupName === 'utility' ? 'main_loop' : 'custom',
					path: groupName,
				})
					.add(true)
					.propertiesDialog()
				return
			}
			return originalAddAnimation.apply(this, [groupName, ...args])
		}

		const originalAnimation = BB.Animation

		// @ts-expect-error - UtilityModelAnimation is not assignable to libdom's Animation type
		globalThis.Animation = UtilityModelAnimation
		// @ts-expect-error - UtilityModelAnimation is not assignable to libdom's Animation type
		window.Animation = UtilityModelAnimation
		// `BB` is just a typed view of the same `Blockbench` object, so this also updates
		// `window.Blockbench.Animation` / `globalThis.Blockbench.Animation`.
		BB.Animation = UtilityModelAnimation

		return { originalAddAnimation, originalAnimation }
	},

	revert: ({ originalAddAnimation, originalAnimation }) => {
		Panels.animations.vue.addAnimation = originalAddAnimation
		// @ts-expect-error - originalAnimation is not assignable to libdom's Animation type
		globalThis.Animation = originalAnimation
		// @ts-expect-error - originalAnimation is not assignable to libdom's Animation type
		window.Animation = originalAnimation
		BB.Animation = originalAnimation
	},
})
