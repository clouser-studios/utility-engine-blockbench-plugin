import { createBlockbenchMod } from '@blockbench-tools'
import { UTILITY_MODEL_PROJECT_FORMAT } from '@utility/formats/utility-model-project'

createBlockbenchMod({
	id: `utility-engine:save-all-animations`,
	collectContext: () => ({
		action: BarItems.save_all_animations as Action,
	}),
	apply: ctx => {
		const originalCondition = ctx.action.condition!
		ctx.action.condition = function (this: Action) {
			if (UTILITY_MODEL_PROJECT_FORMAT.isCurrentFormat()) {
				return false
			}
			if (typeof originalCondition === 'function') {
				return originalCondition.apply(this, arguments as any)
			}
			return Condition(originalCondition)
		}
		return { ...ctx, originalCondition }
	},
	revert: ctx => {
		ctx.action.condition = ctx.originalCondition
	},
})
