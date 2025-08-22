import { createBlockbenchMod } from '@blockbench-tools'
import { PACKAGE } from '@package'
import { UTILITY_MODEL_FORMAT } from '@utility/formats/utility-model-project'

createBlockbenchMod(
	`${PACKAGE.name}:saveAllAnimationsActionMod`,
	{
		action: BarItems.save_all_animations as Action,
	},
	context => {
		const originalCondition = context.action.condition!
		context.action.condition = function (this: Action) {
			if (UTILITY_MODEL_FORMAT.isCurrentFormat()) {
				return false
			}
			if (typeof originalCondition === 'function') {
				return originalCondition.apply(this, arguments as any)
			}
			return Condition(originalCondition)
		}
		return { ...context, originalCondition }
	},
	context => {
		context.action.condition = context.originalCondition
	}
)
