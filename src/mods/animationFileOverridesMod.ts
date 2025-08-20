import { UTILITY_MODEL_FORMAT } from '../formats/utilityProject'
import { PACKAGE } from '../package'
import { createBlockbenchMod } from '../util/moddingTools'

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
