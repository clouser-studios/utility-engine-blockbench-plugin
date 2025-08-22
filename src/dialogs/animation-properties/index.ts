import { PACKAGE } from '@package'
import { Syncable } from '@utility/util/stores'
import { SvelteDialog } from '@utility/util/svelteDialog'
import { translate } from '@utility/util/translation'
import AnimationProperties from './animationProperties.svelte'

export const DIALOG_ID = `${PACKAGE.name}:animationPropertiesDialog`

export function openAnimationPropertiesDialog(animation: _Animation) {
	const animationName = new Syncable(animation.name ?? 'new_animation')
	const animationPath = new Syncable(animation.path ?? 'custom')
	const animationType = new Syncable(animation.utility_model_animation_type ?? 'custom')
	const loopMode = new Syncable(animation.loop as string)
	const loopDelay = new Syncable(Number(animation.loop_delay) ?? 0)

	new SvelteDialog({
		id: DIALOG_ID,
		title: translate('dialog.animation_properties.title', animation.name),
		width: 600,
		component: AnimationProperties,
		props: {
			animationName,
			animationType,
			animationPath,
			loopMode,
			loopDelay,
		},
		preventKeybinds: true,
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
