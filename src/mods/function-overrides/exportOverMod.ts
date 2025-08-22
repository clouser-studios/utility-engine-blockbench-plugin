import { createBlockbenchMod } from '@blockbench-tools'
import { PACKAGE } from '@package'
import { UTILITY_MODEL_CODEC, UTILITY_MODEL_FORMAT } from '@utility/formats/utility-model-project'

createBlockbenchMod(
	`${PACKAGE.name}:exportOverAction`,
	{
		action: BarItems.export_over as Action,
		originalClick: (BarItems.export_over as Action).click,
	},
	context => {
		context.action.click = (event: Event) => {
			if (!Project || !Format) return
			if (UTILITY_MODEL_FORMAT.isCurrentFormat()) {
				const path = Project?.save_path
				if (path) {
					if (fs.existsSync(PathModule.dirname(path))) {
						Project.save_path = path
						UTILITY_MODEL_CODEC.write(UTILITY_MODEL_CODEC.compile(), path)
					} else {
						console.error(
							`Failed to export Utility Model, file location '${path}' does not exist!`
						)
						UTILITY_MODEL_CODEC.export()
					}
				} else {
					UTILITY_MODEL_CODEC.export()
				}
			} else {
				context.originalClick.call(context.action, event)
			}
		}
		return context
	},
	context => {
		context.action.click = context.originalClick
	}
)
