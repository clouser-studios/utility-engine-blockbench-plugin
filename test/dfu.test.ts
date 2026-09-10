import { describe, expect, it } from '@jest/globals'
import { blockbench } from '@snavesutit/jestbench'
import { FORMAT_ID, loadProjectJson } from './support'

/** Loads a raw legacy `.utilityproject` model through the codec (runs DFU + parse). */
async function loadLegacy(model: unknown) {
	await loadProjectJson(JSON.stringify(model), 'legacy.utilityproject')
}

describe('data-fixer-upper (legacy .utilityproject upgrades)', () => {
	it('merges 0.0.5-era split display settings into one slot', async () => {
		// `display_settings` and `utility_display_settings` were merged in 0.0.8.
		await loadLegacy({
			meta: {
				format_version: '0.0.5',
				uuid: 'cccccccc-0000-0000-0000-000000000001',
				save_location: '/old/model.utilityproject',
			},
			display_settings: { head: { rotation: [10, 20, 30] } },
			utility_display_settings: { head: { translation: [1, 2, 3] } },
		})

		const head = await blockbench.evaluate(() => {
			const slot = Project!.display_settings.head as
				{ rotation?: number[]; translation?: number[] } | undefined
			return slot
				? {
						rotation: slot.rotation ? [...slot.rotation] : undefined,
						translation: slot.translation ? [...slot.translation] : undefined,
					}
				: null
		})

		expect(head).toEqual({ rotation: [10, 20, 30], translation: [1, 2, 3] })
	})

	it('loads a legacy project without throwing and lands on the current format', async () => {
		await loadLegacy({
			meta: {
				format_version: '0.0.5',
				uuid: 'cccccccc-0000-0000-0000-000000000002',
				save_location: '/old/empty.utilityproject',
			},
		})

		const format = await blockbench.evaluate(() => Format.id)
		expect(format).toBe(FORMAT_ID)
	})
})
