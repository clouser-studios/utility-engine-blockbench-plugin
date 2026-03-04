import {
	currentFormatIsUtilityModelProject,
	UTILITY_MODEL_PROJECT_CODEC,
} from '@utility/formats/utility-model-project/index.ts'
import { registerPatch } from 'blockbench-patch-manager'

registerPatch({
	id: `utility-engine:export-over-mod`,
	apply: () => {
		const action = BarItems.export_over as Action
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
				const path = Project?.save_path
				if (path) {
					Blockbench.writeFile(path, {
						content: codec.compile(),
					})
					Project.save_path = path
					// codec.write(codec.compile(), path)
				} else {
					codec.export()
				}
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
