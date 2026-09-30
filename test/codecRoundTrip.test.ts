import { describe, expect, it } from '@jest/globals'
import { blockbench } from '@snavesutit/jestbench'
import {
	buildSampleProject,
	CODEC_ID,
	compileProject,
	FORMAT_ID,
	loadProjectJson,
	snapshotProject,
} from './support'

/**
 * The core data-integrity guarantee: compiling a project to the `.utilityproject`
 * format and loading it back reproduces the same model.
 */
describe('utility-model-project codec round-trip', () => {
	it('preserves elements, groups, textures and animations', async () => {
		await buildSampleProject()
		const before = await snapshotProject()

		// Guard against a vacuous pass: the sample project must actually have content.
		expect(before.elements.map(e => e.name).sort()).toEqual(['cube_a', 'cube_b'])
		expect(before.groups).toContain('root_bone')
		expect(before.textures).toHaveLength(1)
		expect(before.animations).toEqual([
			{ name: 'custom.wave', loop: 'loop', loopDelay: '3', keyframeCount: 2 },
		])

		const json = await compileProject()
		expect(typeof json).toBe('string')

		await loadProjectJson(json)
		const after = await snapshotProject()

		expect(after.groups).toEqual(before.groups)
		expect(after.elements.map(e => e.name).sort()).toEqual(
			before.elements.map(e => e.name).sort()
		)
		expect(after.textures).toEqual(before.textures)
		expect(after.animations).toEqual(before.animations)
	})

	it('compile({ raw: true }) returns the model object, not a string', async () => {
		await buildSampleProject()
		const model = await blockbench.evaluate(
			codecId => Codecs[codecId].compile({ raw: true }) as { meta?: { format: string } },
			CODEC_ID
		)
		expect(model).toMatchObject({ meta: { format: FORMAT_ID } })
	})

	it('preserves project properties (regression: all were dropped on save)', async () => {
		await buildSampleProject()
		await blockbench.evaluate(() => {
			Project!.model_identifier = 'ns:sample'
		})

		await loadProjectJson(await compileProject())

		expect(await blockbench.evaluate(() => Project!.model_identifier)).toBe('ns:sample')
	})
})
