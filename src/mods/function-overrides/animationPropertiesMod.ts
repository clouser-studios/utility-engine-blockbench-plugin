import { openAnimationPropertiesDialog } from '@utility/dialogs/animation-properties/index.ts'
import { currentFormatIsUtilityModelProject } from '@utility/formats/utility-model-project/index.ts'
import { registerPatch } from 'blockbench-patch-manager'

registerPatch({
	id: `utility-engine:animation-properties-action`,
	apply: () => {
		const original = Blockbench.Animation.prototype.propertiesDialog
		Blockbench.Animation.prototype.propertiesDialog = function (this: _Animation) {
			if (currentFormatIsUtilityModelProject()) {
				if (!Blockbench.Animation.selected) {
					Blockbench.showQuickMessage('No animation selected')
					return
				}
				openAnimationPropertiesDialog(Blockbench.Animation.selected)
			} else {
				original.call(this)
			}
		}
		return { original }
	},
	revert: ({ original }) => {
		Blockbench.Animation.prototype.propertiesDialog = original
	},
})
