import EVENTS from '@utility/util/events'
import { registerMod } from '@utility/util/moddingTools'

const updateArmOrigins = (side: 'left' | 'right') => {
	const model = displayReferenceObjects.active ? displayReferenceObjects.active.model : null
	if (!model) return

	const originOffset = side === 'left' ? -4 : 4
	const armNames = side === 'left' ? 'left_arm' : 'right_arm'
	const armLayerNames = side === 'left' ? 'left_arm_layer' : 'right_arm_layer'

	const objects = model.children.filter(
		child => child.name === armNames || child.name === armLayerNames
	) as THREE.Mesh[]
	if (objects.length === 0) return

	for (const obj of objects) {
		// Skip if the origin is already correct
		if (obj.position.x === originOffset) continue
		obj.position.x += originOffset
		obj.geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(-originOffset, 0, 0))
	}
}

// Alex's arms are offset incorrectly in Blockbench. This isn't an issue for vanilla Blockbench, but utility allows rotating arms on all three axis.
registerMod({
	id: 'utility-engine:player-reference-model/arm-origin-fix',
	apply: () => {
		const unsub = EVENTS.REF_MODEL_CHANGED.subscribe(() => {
			updateArmOrigins('left')
			updateArmOrigins('right')
		})
		return { unsub }
	},
	revert: ({ unsub }) => {
		// I'm not going to try to revert the geometry changes. It's not worth the effort.
		unsub()
	},
})
