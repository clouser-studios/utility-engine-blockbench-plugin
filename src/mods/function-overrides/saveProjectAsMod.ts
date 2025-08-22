import { createBlockbenchMod } from '@blockbench-tools'
import { PACKAGE } from '@package'
import { UTILITY_MODEL_CODEC, UTILITY_MODEL_FORMAT } from '@utility/formats/utility-model-project'

createBlockbenchMod(
	`${PACKAGE.name}:save_project_as`,
	{
		action: BarItems.save_project_as as Action,
		originalClick: (BarItems.save_project_as as Action).click,
	},
	context => {
		context.action.click = (event: Event) => {
			if (!Project || !Format) return
			if (UTILITY_MODEL_FORMAT.isCurrentFormat()) {
				UTILITY_MODEL_CODEC.export()
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
