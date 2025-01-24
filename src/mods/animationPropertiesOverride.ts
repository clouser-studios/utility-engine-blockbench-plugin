import * as PACKAGE from '../../package.json'
import { openAnimationPropertiesDialog } from '../dialogs/animationProperties'
import { UTILITY_MODEL_FORMAT } from '../formats/utilityModel'
import { createBlockbenchMod } from '../util/moddingTools'

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
