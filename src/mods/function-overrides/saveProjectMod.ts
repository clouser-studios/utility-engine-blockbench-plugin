import {
	currentFormatIsUtilityModelProject,
	saveUtilityModelProject,
} from '@utility/formats/utility-model-project/index.ts'
import { registerPropertyOverridePatch } from 'blockbench-patch-manager'

registerPropertyOverridePatch({
	id: `utility-engine:save-project`,
	target: BarItems.save_project as Action,
	key: 'click',

	getCondition: () => currentFormatIsUtilityModelProject(),

	get: () => {
		return () => {
			if (!Project || !Format) return
			saveUtilityModelProject()
			Project.saved = true
		}
	},
})
