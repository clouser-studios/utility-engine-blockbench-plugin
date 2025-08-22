import { createBlockbenchMod } from '@blockbench-tools'
import { PACKAGE } from '@package'
import { UTILITY_MODEL_FORMAT } from '@utility/formats/utility-model-project'

const ANIMATION_RENAME_ACTION_CONTENT =
	"() => Prop.active_panel == 'animations' && AnimationItem.selected"

createBlockbenchMod(
	`${PACKAGE.name}:animationRenameAction`,
	{
		action: undefined as (typeof SharedActions.actions.rename)[0] | undefined,
		originalCondition: undefined as unknown as () => boolean,
		newCondition: undefined as unknown as () => boolean,
	},
	context => {
		context.newCondition = () => {
			if (!UTILITY_MODEL_FORMAT.isCurrentFormat()) {
				return Condition(context.originalCondition)
			}
			// @ts-expect-error
			if (Prop.active_panel === 'animations' && AnimationItem.selected) {
				if (AnimationItem.selected.utility_model_animation_type === 'custom') {
					return true
				} else {
					Blockbench.showQuickMessage('Only animations of type "custom" can be renamed')
				}
			}
			return false
		}

		const interval = setInterval(() => {
			context.action = SharedActions.actions.rename.find(
				v => v.condition?.toString() === ANIMATION_RENAME_ACTION_CONTENT
			)
			if (!context.action) return
			context.action.condition = context.newCondition
			clearInterval(interval)
		}, 16)
		return context
	},
	context => {
		const action = SharedActions.actions.rename.find(
			v => v.toString() === context.newCondition.toString()
		)
		if (!action) return
		action.condition = context.originalCondition
	}
)
