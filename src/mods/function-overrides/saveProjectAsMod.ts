import { createBlockbenchMod } from '@blockbench-tools'
import {
	UTILITY_MODEL_CODEC,
	UTILITY_MODEL_PROJECT_FORMAT,
} from '@utility/formats/utility-model-project'

createBlockbenchMod({
	id: `utility-engine:save-project-as`,
	collectContext: () => ({
		action: BarItems.save_project_as as Action,
		originalClick: (BarItems.save_project_as as Action).click,
	}),
	apply: ctx => {
		ctx.action.click = (event: Event) => {
			if (!Project || !Format) return
			if (UTILITY_MODEL_PROJECT_FORMAT.isCurrentFormat()) {
				UTILITY_MODEL_CODEC.export()
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
