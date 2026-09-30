import { describe, expect, it } from '@jest/globals'
import { blockbench, newProject } from '@snavesutit/jestbench'
import { CODEC_ID, FORMAT_ID, settleUtilityFormat } from './support'

/**
 * In Utility projects every node except cubes and meshes needs a name that's unique across all
 * node types, since `.utility.json` animations reference bones and locators by name.
 */

async function nodeNames(): Promise<string[]> {
	return blockbench.evaluate(() =>
		[...Group.all, ...Outliner.elements].map(node => `${node.type}:${node.name}`)
	)
}

describe('unique node names', () => {
	it('numbers new and renamed nodes that clash with any other type, except cubes and meshes', async () => {
		await newProject(FORMAT_ID)
		await settleUtilityFormat()

		const result = await blockbench.evaluate(() => {
			Modes.options.edit.select()
			new Group({ name: 'locator' }).init()
			unselectAllElements()
			BarItems.add_locator.click()

			const rename = (node: OutlinerNode, name: string) => {
				node.temp_data.old_name = node.name
				node.name = name
				node.saveName(true)
				return node.name
			}
			return {
				locator: Locator.all[0].name,
				billboard: rename(new Billboard({ name: 'sign' }).init(), 'locator'),
				cube: rename(new Cube({ name: 'a' }).init(), 'locator'),
				mesh: rename(new Mesh({ name: 'b' }).init(), 'locator'),
			}
		})

		expect(result).toEqual({
			locator: 'locator2',
			billboard: 'locator3',
			cube: 'locator',
			mesh: 'locator',
		})
	})

	it('numbers added bounding boxes within the same undo step', async () => {
		await newProject(FORMAT_ID)
		await settleUtilityFormat()

		const result = await blockbench.evaluate(() => {
			Modes.options.edit.select()
			BarItems.add_bounding_box.click()
			BarItems.add_bounding_box.click()
			const added = BoundingBox.all.map(box => box.name)
			Undo.undo()
			Undo.redo()
			return { added, afterRedo: BoundingBox.all.map(box => box.name) }
		})

		expect(result).toEqual({
			added: ['bounding_box', 'bounding_box2'],
			afterRedo: ['bounding_box', 'bounding_box2'],
		})
	})

	it('renames duplicates when a .utilityproject loads, keeping the first name', async () => {
		await newProject(FORMAT_ID)
		await settleUtilityFormat()
		const json = await blockbench.evaluate(codecId => {
			new Group({ name: 'dup' }).init()
			new Locator({ name: 'dup' }).init()
			new Billboard({ name: 'dup' }).init()
			new Cube({ name: 'dup' }).init()
			new Cube({ name: 'dup' }).init()
			return Codecs[codecId].compile() as string
		}, CODEC_ID)

		await newProject(FORMAT_ID)
		await settleUtilityFormat()
		await blockbench.evaluate(
			(codecId, content) => {
				Codecs[codecId].parse!(JSON.parse(content), 'dup.utilityproject')
			},
			CODEC_ID,
			json
		)

		expect((await nodeNames()).sort()).toEqual(
			['group:dup', 'locator:dup2', 'billboard:dup3', 'cube:dup', 'cube:dup'].sort()
		)
	})

	it('renames duplicates after a .utility.json import binds its animations', async () => {
		const groupUuid = 'aaaaaaaa-0000-0000-0000-00000000000e'
		const locatorUuid = 'aaaaaaaa-0000-0000-0000-00000000000f'
		const model = {
			format_version: '0.0.3',
			texture_size: [16, 16],
			textures: {},
			elements: [],
			locators: [{ name: 'muzzle', uuid: locatorUuid, position: [0, 0, 0] }],
			structure: {
				bones: [
					{
						name: 'muzzle',
						uuid: groupUuid,
						rotation: { euler: [0, 0, 0], origin: [0, 0, 0] },
						children: {},
					},
				],
				locators: [locatorUuid],
			},
			animations: [
				{
					name: 'spin',
					animation_length: 1,
					loop_mode: 'once',
					loop_delay: 0,
					bones: { muzzle: { rotation: { '0.0': [0, 90, 0] } } },
				},
			],
		}
		await blockbench.evaluate(
			(codecId, content) => {
				Codecs[codecId].load(JSON.parse(content), {
					path: 'fixture.utility.json',
					name: 'fixture.utility.json',
					content,
				} as unknown as Parameters<(typeof Codecs)[string]['load']>[1])
			},
			CODEC_ID,
			JSON.stringify(model)
		)

		const result = await blockbench.evaluate(() => {
			const group = Group.all[0]
			const animator = Blockbench.Animation.all[0].animators[group.uuid] as BoneAnimator
			return {
				names: [group.name, Locator.all[0].name].map(name => name.replace(/\d+$/, '')),
				unique: group.name !== Locator.all[0].name,
				groupRotationKeyframes: animator?.rotation.length ?? 0,
			}
		})

		expect(result).toEqual({
			names: ['muzzle', 'muzzle'],
			unique: true,
			groupRotationKeyframes: 1,
		})
	})

	it('leaves other formats alone', async () => {
		await newProject('java_block')

		const names = await blockbench.evaluate(() => {
			new Group({ name: 'x' }).init()
			new Group({ name: 'x' }).init()
			return Group.all.map(group => group.name)
		})

		expect(names).toEqual(['x', 'x'])
	})
})
