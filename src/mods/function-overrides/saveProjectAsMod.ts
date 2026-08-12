import {
	currentFormatIsUtilityModelProject,
	UTILITY_MODEL_PROJECT_CODEC,
} from '@utility/formats/utility-model-project/index.ts'
import { registerPatch } from 'blockbench-patch-manager'

registerPatch({
	id: `utility-engine:save-project-as`,
	apply: () => {
		const action = BarItems.save_project_as as Action
		const originalClick = action.click

		action.click = (event?: Event) => {
			if (!Project || !Format) return
			const codec = UTILITY_MODEL_PROJECT_CODEC.get()
			if (!codec) {
				throw new Error(
					'Tried to export as Utility Model, but the Utility Model codec was not found!'
				)
			}

			if (currentFormatIsUtilityModelProject()) {
				codec.export()
				Project.saved = true
			} else {
				originalClick?.(event)
			}
		}

		return { action, originalClick }
	},
	revert: ({ action, originalClick }) => {
		action.click = originalClick
	},
})
