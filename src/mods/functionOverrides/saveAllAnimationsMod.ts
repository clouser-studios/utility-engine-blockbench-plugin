import { UTILITY_MODEL_FORMAT } from '../../formats/utilityProject'
import { PACKAGE } from '../../package'
import { createBlockbenchMod } from '../../util/moddingTools'

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
