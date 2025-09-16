import { createBlockbenchMod } from '@blockbench-tools'
import {
	UTILITY_MODEL_CODEC,
	UTILITY_MODEL_PROJECT_FORMAT,
} from '@utility/formats/utility-model-project'

createBlockbenchMod({
	id: `utility-engine:export-over-mod`,
	collectContext: () => ({
		action: BarItems.export_over as Action,
		originalClick: (BarItems.export_over as Action).click,
	}),
	apply: ctx => {
		ctx.action.click = (event: Event) => {
			if (!Project || !Format) return
			if (UTILITY_MODEL_PROJECT_FORMAT.isCurrentFormat()) {
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
				ctx.originalClick.call(ctx.action, event)
			}
		}
		return ctx
	},
	revert: ctx => {
		ctx.action.click = ctx.originalClick
	},
})
