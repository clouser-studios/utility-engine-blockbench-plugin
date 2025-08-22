import { createBlockbenchMod } from '@blockbench-tools'
import { PACKAGE } from '@package'
import { openAnimationPropertiesDialog } from '@utility/dialogs/animation-properties'
import { UTILITY_MODEL_FORMAT } from '@utility/formats/utility-model-project'

createBlockbenchMod(
	`${PACKAGE.name}:animationPropertiesAction`,
	{
		originalOpen: Blockbench.Animation.prototype.propertiesDialog,
	},
	context => {
		Blockbench.Animation.prototype.propertiesDialog = function (this: _Animation) {
			if (UTILITY_MODEL_FORMAT.isCurrentFormat()) {
				if (!Blockbench.Animation.selected) {
					Blockbench.showQuickMessage('No animation selected')
					return
				}
				openAnimationPropertiesDialog(Blockbench.Animation.selected)
			} else {
				context.originalOpen.call(this)
			}
		}
		return context
	},
	context => {
		Blockbench.Animation.prototype.propertiesDialog = context.originalOpen
	}
)
