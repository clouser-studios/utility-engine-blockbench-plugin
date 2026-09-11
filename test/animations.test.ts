import { describe, expect, it } from '@jest/globals'
import { blockbench, newProject } from '@snavesutit/jestbench'
import { FORMAT_ID } from './support'

describe('utility model animations', () => {
	it('replaces the Animation class with UtilityModelAnimation', async () => {
		const name = await blockbench.evaluate(
			() => (globalThis as unknown as { Animation: { name: string } }).Animation.name
		)
		expect(name).toBe('UtilityModelAnimation')
	})

	it('classifies animations by name into utility types vs custom on extend()', async () => {
		await newProject(FORMAT_ID)
		const result = await blockbench.evaluate(() => {
			const animationCtor = (
				globalThis as unknown as {
					Animation: new (data: unknown) => {
						extend(data: unknown): { add(undo: boolean): unknown }
						utility_model_animation_type?: string
						path?: string
						name?: string
					}
				}
			).Animation
			const make = (name: string) => {
				const anim = new animationCtor({})
				anim.extend({ name })
				anim.add(false)
				return anim
			}
			const known = make('main_loop')
			const custom = make('my_wave')
			const prefixed = make('utility.left_click')
			return {
				knownType: known.utility_model_animation_type,
				knownPath: known.path,
				customType: custom.utility_model_animation_type,
				customPath: custom.path,
				prefixedType: prefixed.utility_model_animation_type,
				prefixedName: prefixed.name,
			}
		})

		expect(result.knownType).toBe('main_loop')
		expect(result.knownPath).toBe('utility')
		expect(result.customType).toBe('custom')
		expect(result.customPath).toBe('custom')
		expect(result.prefixedType).toBe('left_click')
		expect(result.prefixedName).toBe('left_click')
	})

	it('keeps a non-numeric loop_delay from crashing the properties observable', async () => {
		await newProject(FORMAT_ID)
		const delay = await blockbench.evaluate(() => {
			const animationCtor = (
				globalThis as unknown as {
					Animation: new (data: unknown) => {
						loop_delay: string
						add(undo: boolean): unknown
					}
				}
			).Animation
			const anim = new animationCtor({ name: 'weird' })
			anim.add(false)
			anim.loop_delay = ''
			return Number(anim.loop_delay) || 0
		})
		expect(delay).toBe(0)
	})
})
