import { createBlockbenchMod } from '@blockbench-tools'
import { PACKAGE } from '@package'
import {
	saveUtilityModelProject,
	UTILITY_MODEL_PROJECT_FORMAT,
} from '@utility/formats/utility-model-project'

createBlockbenchMod(
	`${PACKAGE.name}:save_project`,
	{
		action: BarItems.save_project as Action,
		originalClick: (BarItems.save_project as Action).click,
	},
	context => {
		context.action.click = (event: Event) => {
			if (!Project || !Format) return
			if (UTILITY_MODEL_PROJECT_FORMAT.isCurrentFormat()) {
				saveUtilityModelProject()
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
