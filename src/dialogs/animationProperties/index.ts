import { PACKAGE } from '../../package'
import { Valuable } from '../../util/stores'
import { SvelteDialog } from '../../util/svelteDialog'
import { translate } from '../../util/translation'
import AnimationProperties from './animationProperties.svelte'

export const DIALOG_ID = `${PACKAGE.name}:animationPropertiesDialog`

export function openAnimationPropertiesDialog(animation: _Animation) {
	const animationName = new Valuable(animation.name)
	const loopMode = new Valuable(animation.loop as string)
	const loopDelay = new Valuable(Number(animation.loop_delay) || 0)

	new SvelteDialog({
		id: DIALOG_ID,
		title: translate('dialog.animation_properties.title', animation.name),
		width: 600,
		component: AnimationProperties,
		props: {
			animationName,
			loopMode,
			loopDelay,
		},
		preventKeybinds: true,
		onConfirm() {
			animation.name = animationName.get()
			animation.createUniqueName(Blockbench.Animation.all)
			animation.loop = loopMode.get() as typeof animation.loop
			animation.loop_delay = loopDelay.get().toString()
			Animator.exportAnimationFile('') // Custom override for utility models doesn't take a path
			Project!.saved = false
		},
	}).show()
}
