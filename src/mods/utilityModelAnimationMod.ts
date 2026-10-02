import {
	currentFormatIsUtilityModelProject,
	UTILITY_MODEL_PROJECT_FORMAT_ID,
} from '@utility/formats/utility-model-project/index.ts'
import { BB } from '@utility/util/blockbenchCompat.ts'
import { localize } from '@utility/util/lang.ts'
import {
	registerPatch,
	registerProjectPatch,
	registerPropertyOverridePatch,
} from 'blockbench-patch-manager'

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

declare global {
	interface _Animation {
		utility_model_animation_type: AnimationType
		// Untyped vanilla BB property
		group_name: string
	}
}

export interface UtilityModelAnimationOptions extends AnimationOptions {
	utility_model_animation_type?: AnimationType
	animators?: Record<string, GeneralAnimator>
	group_name?: string
}

registerPatch({
	id: 'utility_engine:properties/animation/utility_model_animation_type',

	apply() {
		const utilityModelAnimationType = new Property(
			Animation,
			'string',
			'utility_model_animation_type',
			{
				default: 'custom',
				options: Object.keys(ANIMATION_TYPES),
				condition: () => currentFormatIsUtilityModelProject(),
			}
		)

		return { utilityModelAnimationType }
	},

	revert({ utilityModelAnimationType }) {
		utilityModelAnimationType?.delete()
	},
})

function classifyUtilityAnimation(anim: _Animation) {
	// Reclassification below is Utility Model Project-specific.
	if (!currentFormatIsUtilityModelProject()) {
		anim.utility_model_animation_type ??= 'custom'
		return anim
	}

	if (anim.utility_model_animation_type) {
		// respect existing classification
	} else if (anim.name.startsWith('utility.')) {
		anim.name = anim.name.slice(8)
		anim.utility_model_animation_type = anim.name as AnimationType
	} else if (Object.keys(ANIMATION_TYPES).includes(anim.name)) {
		anim.utility_model_animation_type = anim.name as AnimationType
	} else {
		anim.utility_model_animation_type = 'custom'
	}

	const type = anim.utility_model_animation_type
	if (type && type !== 'custom' && type in ANIMATION_TYPES) {
		anim.group_name = 'utility'
	} else {
		anim.group_name =
			anim.group_name && anim.group_name !== 'utility' ? anim.group_name : 'custom'
	}

	// Optional: clear any leftover path so nothing treats it as a file
	anim.path = ''
}

registerPropertyOverridePatch({
	id: 'utility_engine:function_override/animation/extend',
	target: BB.Animation.prototype,
	key: 'extend',

	condition: currentFormatIsUtilityModelProject,

	get(original) {
		return function (this: _Animation, data?: UtilityModelAnimationOptions) {
			original.call(this, data)

			classifyUtilityAnimation(this)

			return this
		}
	},
})

registerPropertyOverridePatch({
	id: 'utility_engine:function_override/BarItems/condition',
	target: BarItems.create_animation_group,
	key: 'condition',

	condition: currentFormatIsUtilityModelProject,

	get(original) {
		return function () {
			if (currentFormatIsUtilityModelProject()) {
				return false
			}
			return Condition(original)
		}
	},
})

registerProjectPatch({
	id: 'utility_engine:project_patch/file_menu',

	condition({ project }) {
		return project.format.id === UTILITY_MODEL_PROJECT_FORMAT_ID
	},

	apply() {
		// @ts-expect-error
		const originalFileMenu = BB.Animation.prototype.group_menu
		// @ts-expect-error
		BB.Animation.prototype.group_menu = new Menu([
			{
				name: localize('action.delete_animation_folder.label'),
				icon: 'delete',
				click(folderName: string) {
					Undo.initEdit({ animations: Animator.animations })
					for (const anim of Animator.animations.filter(
						a => a.group_name === folderName
					)) {
						anim.remove(false, false)
					}
					Undo.finishEdit('Remove Animation Folder', {
						animations: Animator.animations,
					})
				},
			},
		])
		return { originalFileMenu }
	},

	revert({ originalFileMenu }) {
		// @ts-expect-error
		BB.Animation.prototype.group_menu = originalFileMenu
	},
})
