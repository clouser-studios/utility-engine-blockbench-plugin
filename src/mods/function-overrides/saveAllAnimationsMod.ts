import { currentFormatIsUtilityModelProject } from '@utility/formats/utility-model-project/index.ts'
import { registerPropertyOverridePatch } from 'blockbench-patch-manager'

registerPropertyOverridePatch({
	id: `utility_engine:save-all-animations`,
	target: BarItems.save_all_animations as Action,
	key: 'condition',

	getCondition: () => currentFormatIsUtilityModelProject(),

	// Hide "Save All Animations" for Utility Model projects; other formats keep
	// their original condition.
	get: () => false,
})
