import { describe, expect, it } from '@jest/globals'
import { blockbench } from '@snavesutit/jestbench'
import { CODEC_ID } from './support'

/** Loads a hand-written `.utility.json` document through the codec. */
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

const BASE_MODEL = {
	format_version: '0.0.2',
	texture_size: [16, 16],
	textures: {} as Record<string, string>,
	elements: [] as unknown[],
	structure: {} as Record<string, unknown>,
}

describe('.utility.json import', () => {
	it("creates a project with the model's elements and textures", async () => {
		await importUtilityJson({
			...BASE_MODEL,
			textures: { '2': 'minecraft:block/stone' },
			elements: [
				{
					uuid: 'aaaaaaaa-0000-0000-0000-000000000001',
					from: [0, 0, 0],
					to: [8, 8, 8],
					faces: { north: { uv: [0, 0, 16, 16], texture: '#2' } },
				},
			],
			structure: { elements: ['aaaaaaaa-0000-0000-0000-000000000001'] },
		})

		const result = await blockbench.evaluate(() => ({
			format: Format.id,
			cubes: Cube.all.map(c => c.name),
			textures: Texture.all.map(t => ({ id: t.id, name: t.name })),
		}))

		expect(result.format).toBe('utility-engine:format/utility-model-project')
		expect(result.cubes).toHaveLength(1)
		expect(result.textures.map(t => t.id)).toContain('2')
	})

	it('matches face textures by exact id, not suffix (regression for #1 vs #11)', async () => {
		await importUtilityJson({
			...BASE_MODEL,
			textures: { '1': 'minecraft:a', '11': 'minecraft:b' },
			elements: [
				{
					uuid: 'bbbbbbbb-0000-0000-0000-000000000001',
					from: [0, 0, 0],
					to: [1, 1, 1],
					faces: {
						north: { uv: [0, 0, 16, 16], texture: '#1' },
						south: { uv: [0, 0, 16, 16], texture: '#11' },
					},
				},
			],
			structure: { elements: ['bbbbbbbb-0000-0000-0000-000000000001'] },
		})

		const faces = await blockbench.evaluate(() => {
			const cube = Cube.all[0]
			const texById = Object.fromEntries(Texture.all.map(t => [t.uuid, t.id]))
			return {
				north: texById[cube.faces.north.texture as string],
				south: texById[cube.faces.south.texture as string],
			}
		})

		expect(faces.north).toBe('1')
		expect(faces.south).toBe('11')
	})
})
