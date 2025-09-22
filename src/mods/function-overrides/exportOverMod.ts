import { registerMod } from '@blockbench-tools'
import {
	currentFormatIsUtilityModelProject,
	UTILITY_MODEL_CODEC,
} from '@utility/formats/utility-model-project'

registerMod({
	id: `utility-engine:export-over-mod`,
	apply: () => {
		const action = BarItems.export_over as Action
		const originalClick = action.click

		action.click = (event: Event) => {
			if (!Project || !Format) return
			const codec = UTILITY_MODEL_CODEC.get()
			if (!codec) {
				throw new Error(
					'Tried to export as Utility Model, but the Utility Model codec was not found!'
				)
			}

			if (currentFormatIsUtilityModelProject()) {
				const path = Project?.save_path
				if (path) {
					if (fs.existsSync(PathModule.dirname(path))) {
						Project.save_path = path
						codec.write(codec.compile(), path)
					} else {
						console.error(
							`Failed to export Utility Model, file location '${path}' does not exist!`
						)
						codec.export()
					}
				} else {
					codec.export()
				}
			} else {
				originalClick.call(action, event)
			}
		}

		return { action, originalClick }
	},
	revert: ({ action, originalClick }) => {
		action.click = originalClick
	},
})
