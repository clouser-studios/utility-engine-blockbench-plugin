import { localize } from '@utility/util/lang.ts'
import { observable } from 'svelte-observable-store'
import { SvelteDialog } from 'svelte-patching-tools/blockbench'
import AnimationProperties from './animationProperties.svelte'

export function openAnimationPropertiesDialog(animation: _Animation) {
	const animationName = observable(animation.name ?? 'new_animation')
	const animationPath = observable(animation.path ?? 'custom')
	const animationType = observable(animation.utility_model_animation_type ?? 'custom')
	const loopMode = observable(animation.loop as string)
	const loopDelay = observable(Number(animation.loop_delay) ?? 0)

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
