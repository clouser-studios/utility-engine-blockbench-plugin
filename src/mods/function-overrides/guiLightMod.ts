import { registerMod } from '@blockbench-tools'
import { currentFormatIsUtilityModelProject } from '@utility/formats/utility-model-project/index.ts'

registerMod({
	id: 'utility-engine:gui-light/condition',
	apply: () => {
		const barSelect = BarItems.gui_light as BarSelect<string>
		const original = barSelect.condition

		barSelect.condition = () => {
			if (
				Modes.display &&
				DisplayMode.display_slot === 'gui' &&
				currentFormatIsUtilityModelProject()
			) {
				return true
			}
			return Condition(original)
		}

		return { barSelect, original }
	},
	revert: ({ barSelect, original }) => {
		barSelect.condition = original
	},
})
