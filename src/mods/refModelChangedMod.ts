import EVENTS from '@utility/util/events'
import { registerMod } from '@utility/util/moddingTools'

registerMod({
	id: 'utility-engine:ref-model-changed-event',
	apply: () => {
		const refModelPrototype = displayReferenceObjects.refmodels.player.constructor.prototype
		const original = refModelPrototype.load
		refModelPrototype.load = function (
			this: refModel<keyof typeof displayReferenceObjects.refmodels>,
			...args: any[]
		) {
			const result = original.apply(this, args)
			EVENTS.REF_MODEL_CHANGED.publish({ refModel: this })
			return result
		}
		return { refModelPrototype, original }
	},
	revert: ({ refModelPrototype, original }) => {
		refModelPrototype.load = original
	},
})
