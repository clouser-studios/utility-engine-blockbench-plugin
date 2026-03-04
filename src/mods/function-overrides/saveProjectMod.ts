import {
	currentFormatIsUtilityModelProject,
	saveUtilityModelProject,
} from '@utility/formats/utility-model-project/index.ts'
import { registerPatch } from 'blockbench-patch-manager'

registerPatch({
	id: `utility-engine:save-project`,
	apply: () => {
		const action = BarItems.save_project as Action
		const originalClick = action.click

		action.click = (event?: Event) => {
			if (!Project || !Format) return
			if (currentFormatIsUtilityModelProject()) {
				saveUtilityModelProject()
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
