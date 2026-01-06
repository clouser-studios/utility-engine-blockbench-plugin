import { registerMod } from '@blockbench-tools'
import { currentFormatIsUtilityModelProject } from '@utility/formats/utility-model-project'

declare global {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface _Animation {
		utility_model_animation_type?: string
	}
}

registerMod({
	id: `utility-engine:animation-rename-action`,
	apply: () => {
		const structure = Blockbench.Animation.prototype.menu.structure
		const index = structure.findIndex(item => item === 'rename')

		structure.splice(index, 1, {
			id: 'rename',
			name: 'generic.rename',
			icon: 'text_format',
			condition: () => {
				if (!currentFormatIsUtilityModelProject()) {
					return false
				}
				return (
					// @ts-expect-error
					Prop.active_panel === 'animations' &&
					AnimationItem.selected &&
					AnimationItem.selected.utility_model_animation_type === 'custom'
				)
			},
			click: () => {
				SharedActions.actions.rename[0].run()
			},
		})

		return { index, structure }
	},
	revert: ({ index, structure }) => {
		structure.splice(index, 1, 'rename')
	},
})
