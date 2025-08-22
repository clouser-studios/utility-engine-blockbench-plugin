import { createBlockbenchMod } from '@blockbench-tools'
import { PACKAGE } from '@package'
import { UTILITY_MODEL_FORMAT } from '@utility/formats/utility-model-project'

createBlockbenchMod(
	`${PACKAGE.name}:animationFileOverrides`,
	{
		exportAnimationFile: Animator.exportAnimationFile,
	},
	context => {
		Animator.exportAnimationFile = function (path: string) {
			if (UTILITY_MODEL_FORMAT.isCurrentFormat()) {
				for (const anim of Blockbench.Animation.all) {
					anim.saved = true
				}
				return
			}
			return context.exportAnimationFile(path)
		}

		return context
	},
	context => {
		Animator.exportAnimationFile = context.exportAnimationFile
	}
)
