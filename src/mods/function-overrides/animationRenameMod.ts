import { createBlockbenchMod } from '@blockbench-tools'
import { UTILITY_MODEL_PROJECT_FORMAT } from '@utility/formats/utility-model-project'

const ANIMATION_RENAME_ACTION_CONTENT =
	"() => Prop.active_panel == 'animations' && AnimationItem.selected"

declare global {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface _Animation {
		utility_model_animation_type?: string
	}
}

createBlockbenchMod({
	id: `utility-engine:animation-rename-action`,
	collectContext: () => ({
		action: undefined as (typeof SharedActions.actions.rename)[0] | undefined,
		originalCondition: undefined as unknown as () => boolean,
		newCondition: undefined as unknown as () => boolean,
	}),
	apply: ctx => {
		ctx.newCondition = () => {
			if (!UTILITY_MODEL_PROJECT_FORMAT.isCurrentFormat()) {
				return Condition(ctx.originalCondition)
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
			ctx.action = SharedActions.actions.rename.find(
				v => v.condition?.toString() === ANIMATION_RENAME_ACTION_CONTENT
			)
			if (!ctx.action) return
			ctx.action.condition = ctx.newCondition
			clearInterval(interval)
		}, 16)
		return ctx
	},
	revert: ctx => {
		const action = SharedActions.actions.rename.find(
			v => v.toString() === ctx.newCondition.toString()
		)
		if (!action) return
		action.condition = ctx.originalCondition
	},
})
