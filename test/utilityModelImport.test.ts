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

/** A single bone, so animation fixtures have a group to attach a `BoneAnimator` to. */
const BONE_MODEL = {
	...BASE_MODEL,
	structure: { bones: [{ name: 'test_bone', children: {} }] },
}

interface KeyframeDataPoint {
	x: string | number
	y: string | number
	z: string | number
}
interface Keyframe {
	channel: string
	time: number
	data_points: KeyframeDataPoint[]
}

/** Loads a single-bone, single-animation `.utility.json` fixture and returns that
 * animation's keyframes for `test_bone`, keyed by channel. */
async function importAndGetKeyframes(
	bone: Record<string, unknown>,
	formatVersion = BASE_MODEL.format_version
): Promise<Record<string, Keyframe[]>> {
	await importUtilityJson({
		...BONE_MODEL,
		format_version: formatVersion,
		animations: [
			{
				name: 'anim',
				animation_length: 1,
				loop_mode: 'loop',
				loop_delay: 0,
				bones: { test_bone: bone },
			},
		],
	})

	return blockbench.evaluate(() => {
		const group = Group.all.find(g => g.name === 'test_bone')!
		const anim = Blockbench.Animation.all.find(a => a.name === 'anim')!
		const animator = (anim.animators as Record<string, { keyframes: Keyframe[] }>)[
			group.uuid
		]
		const byChannel: Record<string, Keyframe[]> = {}
		for (const kf of animator.keyframes) {
			;(byChannel[kf.channel] ??= []).push({
				channel: kf.channel,
				time: kf.time,
				data_points: kf.data_points.map(p => ({ x: p.x, y: p.y, z: p.z })),
			})
		}
		return byChannel
	})
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

/**
 * Bedrock's animation X axis is mirrored from Blockbench's internal one, so `position.x`
 * and `rotation.x`/`rotation.y` need inverting on the way in - the same thing Blockbench's
 * own Bedrock animation importer does (`getKeyframeDataPoints` in
 * `js/formats/bedrock/bedrock_animation.js`). This used to be done as a one-time DFU
 * migration step (`0.0.1` -> `0.0.2`) instead of on every import, which meant: fresh
 * exports (already at the latest format version, never touched by the DFU) never got
 * inverted at all, and bones using Bedrock's "bare vector = constant for the whole clip"
 * shorthand for `rotation` (used for arm bones in real models) were silently dropped to
 * `[0,0,0]`, since the DFU step and the importer both only handled the time-keyed shape.
 * That combination is what produced the walk-animation forearm bug: an inverted position
 * offset applied to an un-rotated arm.
 */
describe('.utility.json animation keyframe import', () => {
	it('inverts position.x and rotation.x/y, leaves position.y/z and rotation.z untouched', async () => {
		const keyframes = await importAndGetKeyframes({
			position: { '0.0': [1, 2, 3] },
			rotation: { '0.0': [10, 20, 30] },
		})

		expect(keyframes.position[0].data_points[0]).toEqual({ x: '-1', y: '2', z: '3' })
		expect(keyframes.rotation[0].data_points[0]).toEqual({ x: '-10', y: '-20', z: '30' })
	})

	it('does not invert the scale channel', async () => {
		const keyframes = await importAndGetKeyframes({
			scale: { '0.0': [1.5, 2, 0.5] },
		})

		expect(keyframes.scale[0].data_points[0]).toEqual({ x: '1.5', y: '2', z: '0.5' })
	})

	it('treats a bare vector as a constant value for the whole clip instead of dropping it (regression: arm bones using this shorthand had their rotation silently zeroed)', async () => {
		const keyframes = await importAndGetKeyframes({
			rotation: [30.24929, -53.29219, 15.54873],
		})

		expect(keyframes.rotation).toHaveLength(1)
		expect(keyframes.rotation[0].time).toBe(0)
		expect(keyframes.rotation[0].data_points[0]).toEqual({
			x: '-30.24929',
			y: '53.29219',
			z: '15.54873',
		})
	})

	it('inverts both sides of a pre/post keyframe, and drops the duplicate when pre equals post', async () => {
		const keyframes = await importAndGetKeyframes({
			position: {
				'0.0': { pre: [1, 0, 0], post: [2, 0, 0], lerp_mode: 'linear' },
				'1.0': { pre: [5, 0, 0], post: [5, 0, 0], lerp_mode: 'linear' },
			},
		})

		const [first, second] = keyframes.position
		expect(first.data_points.map(p => p.x)).toEqual(['-1', '-2'])
		expect(second.data_points).toHaveLength(1)
		expect(second.data_points[0].x).toBe('-5')
	})

	it('applies the same single inversion whether a model enters at 0.0.1 (goes through the full DFU chain) or is already at the latest version (skips it entirely)', async () => {
		const bone = { position: { '0.0': [4, 5, 6] }, rotation: { '0.0': [7, 8, 9] } }

		const viaFullChain = await importAndGetKeyframes(bone, '0.0.1')
		const alreadyLatest = await importAndGetKeyframes(bone, '0.0.3')

		expect(viaFullChain.position[0].data_points[0]).toEqual(
			alreadyLatest.position[0].data_points[0]
		)
		expect(viaFullChain.rotation[0].data_points[0]).toEqual(
			alreadyLatest.rotation[0].data_points[0]
		)
		// And it's a single inversion, not zero or two.
		expect(viaFullChain.position[0].data_points[0]).toEqual({ x: '-4', y: '5', z: '6' })
	})
})
