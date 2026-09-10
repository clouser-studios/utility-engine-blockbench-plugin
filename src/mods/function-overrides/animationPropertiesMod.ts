import { openAnimationPropertiesDialog } from '@utility/dialogs/animation-properties/index.ts'
import { currentFormatIsUtilityModelProject } from '@utility/formats/utility-model-project/index.ts'
import { BB } from '@utility/util/blockbenchCompat.ts'
import { registerPatch } from 'blockbench-patch-manager'

registerPatch({
	id: `utility-engine:animation-properties-action`,
	apply: () => {
		const original = BB.Animation.prototype.propertiesDialog
		BB.Animation.prototype.propertiesDialog = function (this: BBAnimation) {
			if (currentFormatIsUtilityModelProject()) {
				if (!BB.Animation.selected) {
					Blockbench.showQuickMessage('No animation selected')
					return
				}
				openAnimationPropertiesDialog(BB.Animation.selected)
			} else {
				original.call(this)
			}
		}
		return { original }
	},
	revert: ({ original }) => {
		BB.Animation.prototype.propertiesDialog = original
	},
})
