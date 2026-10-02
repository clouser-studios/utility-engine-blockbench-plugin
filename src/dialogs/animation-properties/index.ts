import { BB } from '@utility/util/blockbenchCompat.ts'
import { localize } from '@utility/util/lang.ts'
import { observable } from 'svelte-observable-store'
import { SvelteDialog } from 'svelte-patching-tools/blockbench'
import AnimationProperties from './animationProperties.svelte'

export function openAnimationPropertiesDialog(animation: _Animation) {
	const animationName = observable(animation.name ?? 'new_animation')
	const animationGroup = observable(animation.group_name ?? 'custom')
	const animationType = observable(animation.utility_model_animation_type ?? 'custom')
	const loopMode = observable(animation.loop as string)
	const loopDelay = observable(Number(animation.loop_delay) || 0)

	new SvelteDialog({
		id: `utility_engine:animation-properties-dialog`,
		title: localize('dialog.animation_properties.title', animation.name),
		width: 600,
		component: AnimationProperties,
		props: {
			animationName,
			animationType,
			animationGroup,
			loopMode,
			loopDelay,
		},
		disableKeybinds: true,
		onConfirm() {
			animation.name = animationName.get()
			animation.createUniqueName(BB.Animation.all)
			animation.utility_model_animation_type = animationType.get()
			animation.group_name =
				animationType.get() === 'custom' ? animationGroup.get() || 'custom' : 'utility'
			animation.path = '' // keep empty under animation_files: false
			animation.loop = loopMode.get() as typeof animation.loop
			animation.loop_delay = loopDelay.get().toString()
			Animator.exportAnimationFile('') // Custom override for utility models doesn't take a path
			Project!.saved = false
		},
	}).show()
}
