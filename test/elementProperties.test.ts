import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { action, blockbench, newProject } from '@snavesutit/jestbench'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildSampleProject, CODEC_ID, FORMAT_ID } from './support'

/**
 * Round-trips the custom `skin_model` / `render_passes` element properties through
 * the `.utility.json` exporter and importer.
 */

const BASE_MODEL = {
	format_version: '0.0.3',
	texture_size: [16, 16],
	textures: {} as Record<string, string>,
	elements: [] as unknown[],
	structure: {} as Record<string, unknown>,
}

async function importUtilityJson(model: unknown) {
	const content = JSON.stringify(model)
	await blockbench.evaluate(
		(codecId, json) => {
			Codecs[codecId].load(JSON.parse(json), {
				path: 'fixture.utility.json',
				name: 'fixture.utility.json',
				content: json,
			} as unknown as Parameters<(typeof Codecs)[string]['load']>[1])
		},
		CODEC_ID,
		content
	)
}

describe('skin_model / render_passes element properties', () => {
	let dir: string

	beforeAll(() => {
		dir = mkdtempSync(join(tmpdir(), 'ue-element-props-'))
	})
	afterAll(() => {
		rmSync(dir, { recursive: true, force: true })
	})

	it('exports the properties on the element, omitting defaults and blank passes', async () => {
		const { cubeUuids } = await buildSampleProject()
		const [cubeA, cubeB] = cubeUuids

		const exportPath = join(dir, 'export.utility.json')
		await blockbench.evaluate(
			(uuidA, path) => {
				// parsePackPath only needs an `assets/<ns>/<subtype>/…` shaped string;
				// the file itself never has to exist for export validation.
				for (const texture of Texture.all) {
					texture.path = '/pack/assets/minecraft/textures/block/stone.png'
				}
				const a = Cube.all.find(c => c.uuid === uuidA)!
				a.skin_model = 'slim'
				a.render_passes = ['glow', '', 'outline']
				// cube_b keeps skin_model 'all' (default) and no render passes.
				Project!.export_path = path
			},
			cubeA,
			exportPath
		)

		await action('utility-engine:action/export-utility-model').trigger()

		const model = JSON.parse(readFileSync(exportPath, 'utf-8')) as {
			elements: Array<{
				uuid: string
				skin_model?: string
				render_passes?: string[]
			}>
		}
		const elemA = model.elements.find(e => e.uuid === cubeA)!
		const elemB = model.elements.find(e => e.uuid === cubeB)!

		expect(elemA.skin_model).toBe('slim')
		expect(elemA.render_passes).toEqual(['glow', 'outline'])
		expect(elemB.skin_model).toBeUndefined()
		expect(elemB.render_passes).toBeUndefined()
	})

	it('imports the properties onto the cube, defaulting when absent', async () => {
		await importUtilityJson({
			...BASE_MODEL,
			elements: [
				{
					uuid: 'dddddddd-0000-0000-0000-000000000001',
					from: [0, 0, 0],
					to: [1, 1, 1],
					skin_model: 'wide',
					render_passes: ['glow'],
					faces: {},
				},
				{
					uuid: 'dddddddd-0000-0000-0000-000000000002',
					from: [0, 0, 0],
					to: [1, 1, 1],
					faces: {},
				},
			],
			structure: {
				elements: [
					'dddddddd-0000-0000-0000-000000000001',
					'dddddddd-0000-0000-0000-000000000002',
				],
			},
		})

		const cubes = await blockbench.evaluate(() =>
			Cube.all.map(c => ({
				name: c.name,
				skinModel: c.skin_model,
				renderPasses: [...(c.render_passes ?? [])],
			}))
		)

		const withProps = cubes.find(c => c.renderPasses.length)!
		expect(withProps.skinModel).toBe('wide')
		expect(withProps.renderPasses).toEqual(['glow'])

		const withoutProps = cubes.find(c => !c.renderPasses.length)!
		expect(withoutProps.skinModel).toBe('all')
	})

	it('round-trips values through export then import', async () => {
		const { cubeUuids } = await buildSampleProject()
		const [cubeA] = cubeUuids

		const exportPath = join(dir, 'roundtrip.utility.json')
		await blockbench.evaluate(
			(uuidA, path) => {
				for (const texture of Texture.all) {
					texture.path = '/pack/assets/minecraft/textures/block/stone.png'
				}
				const a = Cube.all.find(c => c.uuid === uuidA)!
				a.skin_model = 'slim'
				a.render_passes = ['pass_one', 'pass_two']
				Project!.export_path = path
			},
			cubeA,
			exportPath
		)

		await action('utility-engine:action/export-utility-model').trigger()
		const content = readFileSync(exportPath, 'utf-8')

		await newProject(FORMAT_ID)
		await blockbench.evaluate(
			(codecId, json) => {
				Codecs[codecId].load(JSON.parse(json), {
					path: 'roundtrip.utility.json',
					name: 'roundtrip.utility.json',
					content: json,
				} as unknown as Parameters<(typeof Codecs)[string]['load']>[1])
			},
			CODEC_ID,
			content
		)

		const cube = await blockbench.evaluate(() => {
			const c = Cube.all.find(cube => cube.render_passes?.length)
			return c ? { skinModel: c.skin_model, renderPasses: [...c.render_passes!] } : null
		})

		expect(cube).toEqual({ skinModel: 'slim', renderPasses: ['pass_one', 'pass_two'] })
	})
})
