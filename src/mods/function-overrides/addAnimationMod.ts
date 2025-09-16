import { createBlockbenchMod } from '@blockbench-tools'

createBlockbenchMod({
	id: `utility-engine:add-animation/click`,
	collectContext: () => ({
		action: BarItems.add_animation as Action,
		originalClick: (BarItems.add_animation as Action).click,
	}),
	apply: ctx => {
		ctx.action.click = function () {
			const anim = new Blockbench.Animation({
				name: 'new_animation',
			}).add(true)
			anim.propertiesDialog()
			anim.saved = true
			Project!.saved = false
		}

		return ctx
	},
	revert: ctx => {
		ctx.action.click = ctx.originalClick
	},
})
