import { describe, expect, it } from '@jest/globals'
import { blockbench, gui, newProject } from '@snavesutit/jestbench'
import { FORMAT_ID } from './support'

describe('Utility Model Project format', () => {
	it('creates a project on the format with the expected capabilities enabled', async () => {
		await newProject(FORMAT_ID)
		const info = await blockbench.evaluate(() => ({
			id: Format.id,
			meshes: Format.meshes,
			bones: Format.bone_rig,
			locators: Format.locators,
			animations: Format.animation_mode,
			boxUv: Format.box_uv,
			displayMode: Format.display_mode,
		}))

		expect(info.id).toBe(FORMAT_ID)
		expect(info.meshes).toBe(true)
		expect(info.bones).toBe(true)
		expect(info.locators).toBe(true)
		expect(info.animations).toBe(true)
		expect(info.boxUv).toBe(false)
		expect(info.displayMode).toBe(true)
	})

	it('gates the export / settings actions on the active format', async () => {
		await newProject('free')
		expect(await gui.action('utility_engine:action/export-utility-model').isEnabled()).toBe(
			false
		)
		expect(
			await gui.action('utility_engine:action/open-utility-model-settings').isEnabled()
		).toBe(false)

		await newProject(FORMAT_ID)
		expect(await gui.action('utility_engine:action/export-utility-model').isEnabled()).toBe(
			true
		)
		expect(
			await gui.action('utility_engine:action/open-utility-model-settings').isEnabled()
		).toBe(true)
	})

	it('wires the codec and format to each other', async () => {
		const linked = await blockbench.evaluate(() => {
			const format = Formats['utility_engine:format/utility-model-project'] as unknown as {
				codec?: { id: string }
			}
			const codec = Codecs['utility_engine:codec/utility-model-project'] as unknown as {
				format?: { id: string }
			}
			return {
				formatCodecId: format.codec?.id,
				codecFormatId: codec.format?.id,
			}
		})
		expect(linked.formatCodecId).toBe('utility_engine:codec/utility-model-project')
		expect(linked.codecFormatId).toBe('utility_engine:format/utility-model-project')
	})
})
