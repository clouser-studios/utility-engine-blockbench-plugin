import { BB } from '@utility/util/blockbenchCompat.ts'
import { registerPropertyOverridePatch } from 'blockbench-patch-manager'

registerPropertyOverridePatch({
	id: `utility-engine:add-animation/click`,
	target: BarItems.add_animation as Action,
	key: 'click',

	get: () => {
		return () => {
			const anim = new BB.Animation({ name: 'new_animation' }).add(true)
			anim.propertiesDialog()
			anim.saved = true
			Project!.saved = false
		}
	},
})
