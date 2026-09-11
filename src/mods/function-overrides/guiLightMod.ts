import { currentFormatIsUtilityModelProject } from '@utility/formats/utility-model-project/index.ts'
import { registerPropertyOverridePatch } from 'blockbench-patch-manager'

registerPropertyOverridePatch({
	id: 'utility-engine:gui-light/condition',
	target: BarItems.gui_light as BarSelect,
	key: 'condition',

	// Force the GUI light selector visible in the GUI display slot for Utility
	// Model projects; other formats keep their original condition.
	getCondition: () =>
		Modes.display && DisplayMode.display_slot === 'gui' && currentFormatIsUtilityModelProject(),

	get: () => true,
})
