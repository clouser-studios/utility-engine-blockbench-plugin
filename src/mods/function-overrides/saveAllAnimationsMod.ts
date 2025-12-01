import { registerMod } from '@blockbench-tools'
import { currentFormatIsUtilityModelProject } from '@utility/formats/utility-model-project'

registerMod({
	id: `utility-engine:save-all-animations`,
	apply: () => {
		const action = BarItems.save_all_animations as Action
		const originalCondition = action.condition!

		action.condition = function (this: Action, context: any) {
			if (currentFormatIsUtilityModelProject()) {
				return false
			}
			if (typeof originalCondition === 'function') {
				return originalCondition.apply(this, [context])
			}
			return Condition(originalCondition)
		}

		return { action, originalCondition }
	},
	revert: ({ action, originalCondition }) => {
		action.condition = originalCondition
	},
})
