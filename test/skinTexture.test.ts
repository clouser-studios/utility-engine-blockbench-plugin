import { describe, expect, it } from '@jest/globals'
import { blockbench, gui, newProject } from '@snavesutit/jestbench'
import { FORMAT_ID } from './support'

const CREATE_SKIN_ACTION = 'utility_engine:action/create-skin-texture'

describe('skin textures', () => {
	it('offers the "create skin texture" action only until one exists', async () => {
		await newProject(FORMAT_ID)

		expect(await gui.action(CREATE_SKIN_ACTION).isEnabled()).toBe(true)

		await gui.action(CREATE_SKIN_ACTION).trigger()

		const skinCount = await blockbench.evaluate(
			() => Texture.all.filter(t => (t as { isSkinTexture?: boolean }).isSkinTexture).length
		)
		expect(skinCount).toBe(1)

		// A project can only have one skin texture.
		expect(await gui.action(CREATE_SKIN_ACTION).isEnabled()).toBe(false)
	})

	it('marks its save copy so it round-trips as a skin texture', async () => {
		await newProject(FORMAT_ID)
		const save = await blockbench.evaluate(() => {
			BarItems['utility_engine:action/create-skin-texture'].trigger()
			const skin = Texture.all.find(t => (t as { isSkinTexture?: boolean }).isSkinTexture)!
			return skin.getSaveCopy() as { isSkinTexture?: boolean; name: string }
		})

		expect(save.isSkinTexture).toBe(true)
		expect(save.name).toBe('utility:current_skin')
	})
})
