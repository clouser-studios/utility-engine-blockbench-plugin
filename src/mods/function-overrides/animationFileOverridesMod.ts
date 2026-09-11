import { currentFormatIsUtilityModelProject } from '@utility/formats/utility-model-project/index.ts'
import { BB } from '@utility/util/blockbenchCompat.ts'
import { registerPatch } from 'blockbench-patch-manager'

registerPatch({
	id: `utility-engine:animation/export-animation-file`,
	apply: () => {
		const original = Animator.exportAnimationFile
		Animator.exportAnimationFile = function (path: string) {
			if (currentFormatIsUtilityModelProject()) {
				for (const anim of BB.Animation.all) {
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
