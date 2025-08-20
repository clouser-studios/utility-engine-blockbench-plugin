import { PACKAGE } from '../../package'
import { createBlockbenchMod } from '../../util/moddingTools'

createBlockbenchMod(
	`${PACKAGE.name}:addAnimationAction`,
	{
		originalClick: (BarItems.add_animation as Action).click,
	},
	context => {
		;(BarItems.add_animation as Action).click = function () {
			const anim = new Blockbench.Animation({
				name: 'new_animation',
			}).add(true)
			anim.propertiesDialog()
			anim.saved = true
			Project!.saved = false
		}

		return context
	},
	context => {
		;(BarItems.add_animation as Action).click = context.originalClick
	}
)
