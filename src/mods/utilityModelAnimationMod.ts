import { currentFormatIsUtilityModelProject } from '@utility/formats/utility-model-project/index.ts'
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
}

class UtilityModelAnimation extends Blockbench.Animation {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	utility_model_animation_type: AnimationType = 'custom'

	constructor(data?: UtilityModelAnimationOptions) {
		data ??= {}
		if (!data?.name) {
			data.name = 'new_animation'
		}
		super(data)
	}

	extend(data?: UtilityModelAnimationOptions) {
		data ??= {}
		if (!data?.name) {
			data.name = 'new_animation'
		}

		super.extend(data)

		if (!data?.utility_model_animation_type) {
			if (this.name.startsWith('utility.')) {
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
		} else {
			this.utility_model_animation_type = data.utility_model_animation_type
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
		if (Blockbench.Animation.selected == this) {
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
	id: 'utility-engine:utility-model-animation-override',

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
			return originalAddAnimation.apply(this, groupName, args)
		}

		const originalAnimation = Blockbench.Animation

		// @ts-expect-error
		globalThis.Animation = UtilityModelAnimation
		// @ts-expect-error
		window.Animation = UtilityModelAnimation
		// @ts-expect-error
		window.Blockbench.Animation = UtilityModelAnimation
		// @ts-expect-error
		globalThis.Blockbench.Animation = UtilityModelAnimation
		// @ts-expect-error
		Blockbench.Animation = UtilityModelAnimation

		return { originalAddAnimation, originalAnimation }
	},

	revert: ({ originalAddAnimation, originalAnimation }) => {
		Panels.animations.vue.addAnimation = originalAddAnimation
		globalThis.Animation = originalAnimation
		window.Animation = originalAnimation
		// @ts-expect-error
		window.Blockbench.Animation = originalAnimation
		// @ts-expect-error
		globalThis.Blockbench.Animation = originalAnimation
		// @ts-expect-error
		Blockbench.Animation = originalAnimation
	},
})
