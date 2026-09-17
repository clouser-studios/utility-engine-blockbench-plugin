import { describe, expect, it } from '@jest/globals'
import { blockbench } from '@snavesutit/jestbench'
import { buildSampleProject } from './support'

const TOGGLE_ID = 'utility-engine:action/skin-model-preview-toggle'
const ELEMENT_PROPERTIES_PATCH_ID = 'utility-engine:element-properties'
const FILTER_PATCH_ID = 'utility-engine:skin-model-preview-toggle/apply-visibility-filter'

/**
 * `apply-visibility-filter` depends on `element-properties`. If that dependency
 * isn't registered first, blockbench-patch-manager throws and skips it, so these
 * checks double as a regression test for that registration-order bug.
 */
describe('skin model preview toggle', () => {
	it('applies both the element-properties patch and its dependent filter patch', async () => {
		const applied = await blockbench.evaluate(
			(elementPropsId, filterId) => {
				const manager = (globalThis as unknown as { BlockbenchPatchManager: { registered: Map<string, { isApplied(): boolean }> } })
					.BlockbenchPatchManager
				return {
					elementProperties: manager.registered.get(elementPropsId)?.isApplied() ?? false,
					filter: manager.registered.get(filterId)?.isApplied() ?? false,
				}
			},
			ELEMENT_PROPERTIES_PATCH_ID,
			FILTER_PATCH_ID
		)

		expect(applied.elementProperties).toBe(true)
		expect(applied.filter).toBe(true)
	})

	it('hides elements whose skin_model does not match the active preview mode, without touching visibility', async () => {
		const { cubeUuids } = await buildSampleProject()
		const [cubeA, cubeB] = cubeUuids

		const result = await blockbench.evaluate(
			(toggleId, uuidA, uuidB) => {
				const a = Cube.all.find(c => c.uuid === uuidA)!
				const b = Cube.all.find(c => c.uuid === uuidB)!
				a.skin_model = 'wide'
				b.skin_model = 'slim'

				BarItems[toggleId].set('wide')
				Canvas.updateVisibility()

				return {
					aMeshVisible: a.mesh.visible,
					bMeshVisible: b.mesh.visible,
					aVisibilityProp: a.visibility,
					bVisibilityProp: b.visibility,
				}
			},
			TOGGLE_ID,
			cubeA,
			cubeB
		)

		expect(result.aMeshVisible).toBe(true)
		expect(result.bMeshVisible).toBe(false)
		expect(result.aVisibilityProp).toBe(true)
		expect(result.bVisibilityProp).toBe(true)
	})

	it('shows every element again once the mode is switched back to all', async () => {
		const { cubeUuids } = await buildSampleProject()
		const [cubeA, cubeB] = cubeUuids

		const result = await blockbench.evaluate(
			(toggleId, uuidA, uuidB) => {
				const a = Cube.all.find(c => c.uuid === uuidA)!
				const b = Cube.all.find(c => c.uuid === uuidB)!
				a.skin_model = 'wide'
				b.skin_model = 'slim'

				BarItems[toggleId].set('slim')
				Canvas.updateVisibility()
				BarItems[toggleId].set('all')
				Canvas.updateVisibility()

				return { aMeshVisible: a.mesh.visible, bMeshVisible: b.mesh.visible }
			},
			TOGGLE_ID,
			cubeA,
			cubeB
		)

		expect(result.aMeshVisible).toBe(true)
		expect(result.bMeshVisible).toBe(true)
	})
})
