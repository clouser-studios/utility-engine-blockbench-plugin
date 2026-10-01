import { describe, expect, it } from '@jest/globals'
import { blockbench } from '@snavesutit/jestbench'
import { CODEC_ID, FORMAT_ID, LOADER_ID, PLUGIN_ID } from './support'

describe('utility_engine plugin registration', () => {
	it('loads into Blockbench without errors', async () => {
		await expect(blockbench).toHaveLoadedPlugin(PLUGIN_ID)
	})

	it('registers the format, codec and .utility.json loader', async () => {
		const registered = await blockbench.evaluate(
			(formatId, codecId, loaderId) => {
				const g = globalThis as unknown as {
					Formats: Record<string, unknown>
					Codecs: Record<string, unknown>
					ModelLoader: { loaders: Record<string, unknown> }
				}
				return {
					format: typeof g.Formats[formatId],
					codec: typeof g.Codecs[codecId],
					loader: typeof g.ModelLoader.loaders[loaderId],
				}
			},
			FORMAT_ID,
			CODEC_ID,
			LOADER_ID
		)

		expect(registered.format).toBe('object')
		expect(registered.codec).toBe('object')
		expect(registered.loader).toBe('object')
	})

	it('registers its actions and title-bar menu items', async () => {
		for (const id of [
			'utility_engine:action/export-utility-model',
			'utility_engine:action/export-utility-model-as',
			'utility_engine:import-utility-model',
			'utility_engine:action/open-utility-model-settings',
			'utility_engine:action/create-skin-texture',
		]) {
			await expect(blockbench).toHaveAction(id)
		}
	})

	it('exposes the UtilityEngine public API', async () => {
		const api = await blockbench.evaluate(
			() => (globalThis as unknown as { UtilityEngine?: { events?: unknown } }).UtilityEngine
		)
		expect(api).toBeTruthy()
		expect(api).toHaveProperty('events')
	})
})
