import { currentFormatIsUtilityModelProject } from '@utility/formats/utility-model-project/index.ts'
import { BB } from '@utility/util/blockbenchCompat.ts'
import { registerPatch } from 'blockbench-patch-manager'

registerPatch({
	id: `utility_engine:animation-rename-action`,
	apply: () => {
		// The animation menu's structure is always a static array, never the dynamic-menu function variant.
		const structure = BB.Animation.prototype.menu.structure as MenuItem[]
		const index = structure.findIndex(item => item === 'rename')
		if (index === -1) {
			console.warn('Utility Engine: no "rename" item in the animation menu to override.')
			return { index, structure }
		}

		structure.splice(index, 1, {
			id: 'rename',
			name: 'generic.rename',
			icon: 'text_format',
			condition: () => {
				if (!currentFormatIsUtilityModelProject()) {
					return false
				}
				return (
					Prop.active_panel === 'animations' &&
					AnimationItem.selected?.utility_model_animation_type === 'custom'
				)
			},
			click: () => {
				SharedActions.run('rename')
			},
		})

		return { index, structure }
	},
	revert: ({ index, structure }) => {
		if (index === -1) return
		structure.splice(index, 1, 'rename')
	},
})
