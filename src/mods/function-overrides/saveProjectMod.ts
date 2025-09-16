import { createBlockbenchMod } from '@blockbench-tools'
import {
	saveUtilityModelProject,
	UTILITY_MODEL_PROJECT_FORMAT,
} from '@utility/formats/utility-model-project'

createBlockbenchMod({
	id: `utility-engine:save-project`,
	collectContext: () => ({
		action: BarItems.save_project as Action,
		originalClick: (BarItems.save_project as Action).click,
	}),
	apply: ctx => {
		ctx.action.click = (event: Event) => {
			if (!Project || !Format) return
			if (UTILITY_MODEL_PROJECT_FORMAT.isCurrentFormat()) {
				saveUtilityModelProject()
			} else {
				ctx.originalClick.call(ctx.action, event)
			}
		}
		return ctx
	},
	revert: ctx => {
		ctx.action.click = ctx.originalClick
	},
})
