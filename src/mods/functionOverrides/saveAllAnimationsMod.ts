import { UTILITY_MODEL_FORMAT } from '../../formats/utilityModel'
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
			return originalCondition.call(this)
		}
		return { ...context, originalCondition }
	},
	context => {
		context.action.condition = context.originalCondition
	}
)
