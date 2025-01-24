import * as PACKAGE from '../../package.json'
import { createBlockbenchMod } from '../util/moddingTools'

const ANIMATION_RENAME_ACTION_CONTENT =
	"() => Prop.active_panel == 'animations' && AnimationItem.selected"

createBlockbenchMod(
	`${PACKAGE.name}:animationRenameAction`,
	{
		originalCondition: undefined as unknown as () => boolean,
		newCondition: () => {
			// @ts-expect-error
			if (Prop.active_panel == 'animations' && AnimationItem.selected) {
				if (AnimationItem.selected.utility_type === 'custom') {
					return true
				} else {
					Blockbench.showQuickMessage('Only "custom" animations can be renamed')
				}
			}
			return false
		},
	},
	context => {
		const interval = setInterval(() => {
			const action = SharedActions.actions.rename.find(
				v => v.condition?.toString() === ANIMATION_RENAME_ACTION_CONTENT
			)
			if (!action) return
			action.condition = context.newCondition
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
