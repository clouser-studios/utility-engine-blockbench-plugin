import { openAnimationPropertiesDialog } from '@utility/dialogs/animation-properties/index.ts'
import { currentFormatIsUtilityModelProject } from '@utility/formats/utility-model-project/index.ts'
import { BB } from '@utility/util/blockbenchCompat.ts'
import { registerPropertyOverridePatch } from 'blockbench-patch-manager'

registerPropertyOverridePatch({
	id: `utility_engine:animation-properties-action`,
	target: BB.Animation.prototype,
	key: 'propertiesDialog',

	getCondition: () => currentFormatIsUtilityModelProject(),

	get: () => {
		return function (this: BBAnimation) {
			if (!BB.Animation.selected) {
				Blockbench.showQuickMessage('No animation selected')
				return
			}
			openAnimationPropertiesDialog(BB.Animation.selected)
		}
	},
})
