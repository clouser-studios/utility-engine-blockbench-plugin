import { registerMod } from '@blockbench-tools'
import EVENTS from '@events'

// Triggers the REF_MODEL_CHANGED event when a reference model is loaded, or it's variant is changed.
registerMod({
	id: 'utility-engine:ref-model-changed-event',
	apply: () => {
		const refModelPrototype = displayReferenceObjects.refmodels.player.constructor.prototype
		const originalLoad = refModelPrototype.load

		refModelPrototype.load = function (
			this: refModel<keyof typeof displayReferenceObjects.refmodels>,
			...args: any[]
		) {
			const result = originalLoad.apply(this, args)
			EVENTS.REF_MODEL_CHANGED.publish({ refModel: this })
			return result
		}

		const originalSetModelVariant = refModelPrototype.setModelVariant
		refModelPrototype.setModelVariant = function (
			this: refModel<keyof typeof displayReferenceObjects.refmodels>,
			...args: any[]
		) {
			const result = originalSetModelVariant.apply(this, args)
			EVENTS.REF_MODEL_CHANGED.publish({ refModel: this })
			return result
		}

		return { refModelPrototype, originalLoad }
	},
	revert: ({ refModelPrototype, originalLoad }) => {
		refModelPrototype.load = originalLoad
	},
})
