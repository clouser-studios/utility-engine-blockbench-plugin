import { registerMod } from '@blockbench-tools'
import { currentFormatIsUtilityModelProject } from '@utility/formats/utility-model-project/index.ts'

registerMod({
	id: `utility-engine:animation/export-animation-file`,
	apply: () => {
		const original = Animator.exportAnimationFile
		Animator.exportAnimationFile = function (path: string) {
			if (currentFormatIsUtilityModelProject()) {
				for (const anim of Blockbench.Animation.all) {
					anim.saved = true
				}
				return
			}
			return original(path)
		}

		return { original }
	},
	revert: ({ original }) => {
		Animator.exportAnimationFile = original
	},
})
