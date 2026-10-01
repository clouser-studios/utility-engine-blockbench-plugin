import { currentFormatIsUtilityModelProject } from '@utility/formats/utility-model-project/index.ts'
import { BB } from '@utility/util/blockbenchCompat.ts'
import { registerPropertyOverridePatch } from 'blockbench-patch-manager'

registerPropertyOverridePatch({
	id: `utility_engine:add-animation/click`,
	target: BarItems.add_animation as Action,
	key: 'click',

	getCondition: () => currentFormatIsUtilityModelProject(),

	get: () => {
		return () => {
			const anim = new BB.Animation({ name: 'new_animation' }).add(true)
			anim.propertiesDialog()
			anim.saved = true
			Project!.saved = false
		}
	},
})
