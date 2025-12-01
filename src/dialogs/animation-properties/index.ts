import { SvelteDialog } from '@utility/svelte/dialog'
import { localize } from '@utility/util/lang'
import { syncable } from '@utility/util/stores'
import AnimationProperties from './animationProperties.svelte'

export function openAnimationPropertiesDialog(animation: _Animation) {
	const animationName = syncable(animation.name ?? 'new_animation')
	const animationPath = syncable(animation.path ?? 'custom')
	const animationType = syncable(animation.utility_model_animation_type ?? 'custom')
	const loopMode = syncable(animation.loop as string)
	const loopDelay = syncable(Number(animation.loop_delay) ?? 0)

	new SvelteDialog({
		id: `utility-engine:animation-properties-dialog`,
		title: localize('dialog.animation_properties.title', animation.name),
		width: 600,
		component: AnimationProperties,
		props: {
			animationName,
			animationType,
			animationPath,
			loopMode,
			loopDelay,
		},
		disableKeybinds: true,
		onConfirm() {
			animation.name = animationName.get()
			animation.createUniqueName(Blockbench.Animation.all)
			animation.utility_model_animation_type = animationType.get()
			animation.path = animationPath.get()
			animation.loop = loopMode.get() as typeof animation.loop
			animation.loop_delay = loopDelay.get().toString()
			Animator.exportAnimationFile('') // Custom override for utility models doesn't take a path
			Project!.saved = false
		},
	}).show()
}
