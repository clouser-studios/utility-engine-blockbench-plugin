import { BB } from '@utility/util/blockbenchCompat.ts'
import { registerPatch } from 'blockbench-patch-manager'

registerPatch({
	id: `utility-engine:add-animation/click`,
	apply: () => {
		const action = BarItems.add_animation as Action
		const original = action.click
		action.click = function () {
			const anim = new BB.Animation({
				name: 'new_animation',
			}).add(true)
			anim.propertiesDialog()
			anim.saved = true
			Project!.saved = false
		}

		return { action, original }
	},
	revert: ({ action, original }) => {
		action.click = original
	},
})
