import { registerMod } from '@blockbench-tools'
import { currentFormatIsUtilityModelProject } from '@utility/formats/utility-model-project'

const ANIMATION_RENAME_ACTION_CONTENT =
	"() => Prop.active_panel == 'animations' && AnimationItem.selected"

declare global {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface _Animation {
		utility_model_animation_type?: string
	}
}

registerMod({
	id: `utility-engine:animation-rename-action`,
	apply: () => {
		const handler = SharedActions.actions.rename.find(v => {
			return v.condition?.toString() === ANIMATION_RENAME_ACTION_CONTENT
		})
		if (!handler) {
			throw new Error('Failed to find rename action handler!')
		}
		const originalCondition = handler.condition

		handler.condition = () => {
			if (!currentFormatIsUtilityModelProject()) {
				return Condition(originalCondition)
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

		return { handler, originalCondition }
	},
	revert: ({ handler, originalCondition }) => {
		handler.condition = originalCondition
	},
})
