import { createBlockbenchMod } from '@blockbench-tools'
import { UTILITY_MODEL_PROJECT_FORMAT } from '@utility/formats/utility-model-project'

createBlockbenchMod({
	id: `utility-engine:animation/export-animation-file`,
	collectContext: () => ({
		exportAnimationFile: Animator.exportAnimationFile,
	}),
	apply: ctx => {
		Animator.exportAnimationFile = function (path: string) {
			if (UTILITY_MODEL_PROJECT_FORMAT.isCurrentFormat()) {
				for (const anim of Blockbench.Animation.all) {
					anim.saved = true
				}
				return
			}
			return ctx.exportAnimationFile(path)
		}

		return ctx
	},
	revert: ctx => {
		Animator.exportAnimationFile = ctx.exportAnimationFile
	},
})
