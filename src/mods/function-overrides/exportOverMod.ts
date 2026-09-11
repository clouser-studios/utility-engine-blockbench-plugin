import {
	currentFormatIsUtilityModelProject,
	UTILITY_MODEL_PROJECT_CODEC,
} from '@utility/formats/utility-model-project/index.ts'
import { registerPropertyOverridePatch } from 'blockbench-patch-manager'

registerPropertyOverridePatch({
	id: `utility-engine:export-over-mod`,
	target: BarItems.export_over as Action,
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

			const path = Project.save_path
			if (path) {
				Blockbench.writeFile(path, { content: codec.compile() })
				Project.save_path = path
			} else {
				codec.export()
			}
		}
	},
})
