import { createBlockbenchMod } from '@blockbench-tools'
import { openAnimationPropertiesDialog } from '@utility/dialogs/animation-properties'
import { UTILITY_MODEL_PROJECT_FORMAT } from '@utility/formats/utility-model-project'

createBlockbenchMod({
	id: `utility-engine:animation-properties-action`,
	collectContext: () => ({
		originalOpen: Blockbench.Animation.prototype.propertiesDialog,
	}),
	apply: ctx => {
		Blockbench.Animation.prototype.propertiesDialog = function (this: _Animation) {
			if (UTILITY_MODEL_PROJECT_FORMAT.isCurrentFormat()) {
				if (!Blockbench.Animation.selected) {
					Blockbench.showQuickMessage('No animation selected')
					return
				}
				openAnimationPropertiesDialog(Blockbench.Animation.selected)
			} else {
				ctx.originalOpen.call(this)
			}
		}
		return ctx
	},
	revert: ctx => {
		Blockbench.Animation.prototype.propertiesDialog = ctx.originalOpen
	},
})
