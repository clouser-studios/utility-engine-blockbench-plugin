import {
	currentFormatIsUtilityModelProject,
	UTILITY_MODEL_PROJECT_CODEC,
} from '@utility/formats/utility-model-project/index.ts'
import { registerPropertyOverridePatch } from 'blockbench-patch-manager'

registerPropertyOverridePatch({
	id: `utility-engine:save-project-as`,
	target: BarItems.save_project_as as Action,
	key: 'click',

	getCondition: () => currentFormatIsUtilityModelProject(),

	get: () => {
		return () => {
			if (!Project || !Format) return
			const codec = UTILITY_MODEL_PROJECT_CODEC.get()
			if (!codec) {
				throw new Error(
					'Tried to export as Utility Model, but the Utility Model codec was not found!'
				)
			}

			codec.export()
			Project.saved = true
		}
	},
})
