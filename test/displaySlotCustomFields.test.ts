import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { action, blockbench, newProject } from '@snavesutit/jestbench'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildSampleProject, CODEC_ID, FORMAT_ID, settleUtilityFormat } from './support'

/**
 * The utility format adds custom per-slot fields to `DisplaySlot` (per-hand arm rotations
 * and an `overrides` model reference). These must survive undo/redo (Blockbench snapshots
 * the `display_slots` aspect via `copy()` / `extend()`) and `.utilityproject` save/load
 * (`export()`).
 */

/** Enters display mode on the third-person-right slot and returns that slot's id. */
async function enterDisplayMode() {
	await blockbench.evaluate(() => {
		Modes.options.display.select()
		;(DisplayMode as unknown as { loadThirdRight(): void }).loadThirdRight()
	})
}

describe('display slot arm rotations', () => {
	it('copy() carries the arm-rotation fields, keeping unset ones as undefined', async () => {
		await newProject(FORMAT_ID)
		await settleUtilityFormat()
		await enterDisplayMode()

		const copy = await blockbench.evaluate(() => {
			const slot = Project!.display_settings.thirdperson_righthand
			slot.left_arm_rotation = [40, 5, -3]
			const c = slot.copy() as Record<string, unknown>
			return {
				left: c.left_arm_rotation,
				rightIsKey: 'right_arm_rotation' in c,
				right: c.right_arm_rotation,
			}
		})

		expect(copy.left).toEqual([40, 5, -3])
		// Present-but-undefined so extend() can clear it on undo.
		expect(copy.rightIsKey).toBe(true)
		expect(copy.right).toBeUndefined()
	})

	it('extend() applies arm rotations and clears them when the key is undefined', async () => {
		await newProject(FORMAT_ID)
		await settleUtilityFormat()
		await enterDisplayMode()

		const result = await blockbench.evaluate(() => {
			const slot = Project!.display_settings.thirdperson_righthand
			slot.left_arm_rotation = [10, 0, 0]
			slot.extend({ left_arm_rotation: [22, 0, 0] } as never)
			const afterSet = slot.left_arm_rotation && [...slot.left_arm_rotation]
			slot.extend({ left_arm_rotation: undefined } as never)
			const afterClear = slot.left_arm_rotation ?? null
			// A plain display preset (no arm keys) must not touch the field.
			slot.left_arm_rotation = [5, 0, 0]
			slot.extend({ rotation: [1, 2, 3] } as never)
			const afterUnrelated = slot.left_arm_rotation && [...slot.left_arm_rotation]
			return { afterSet, afterClear, afterUnrelated }
		})

		expect(result.afterSet).toEqual([22, 0, 0])
		expect(result.afterClear).toBeNull()
		expect(result.afterUnrelated).toEqual([5, 0, 0])
	})

	it('export() includes set arm rotations and omits an otherwise-default slot', async () => {
		await newProject(FORMAT_ID)
		await settleUtilityFormat()
		await enterDisplayMode()

		const result = await blockbench.evaluate(() => {
			const slot = Project!.display_settings.thirdperson_righthand
			const emptyExport = slot.export()
			slot.right_arm_rotation_when_offhand_occupied = [12, 0, 0]
			const withArm = slot.export() as Record<string, unknown> | undefined
			return { emptyExport, withArm }
		})

		expect(result.emptyExport).toBeUndefined()
		expect(result.withArm).toEqual({ right_arm_rotation_when_offhand_occupied: [12, 0, 0] })
	})

	it('round-trips arm rotations through undo and redo', async () => {
		await newProject(FORMAT_ID)
		await settleUtilityFormat()
		await enterDisplayMode()

		const history = await blockbench.evaluate(() => {
			const slotId = 'thirdperson_righthand' as const
			const read = () => {
				const v = Project!.display_settings[slotId].left_arm_rotation
				return v ? [...v] : null
			}
			const set = (value: ArrayVector3 | undefined) => {
				Undo.initEdit({ display_slots: [slotId] })
				Project!.display_settings[slotId].left_arm_rotation = value
				Undo.finishEdit('Set arm rotation')
			}

			set([30, 0, 0])
			set([60, 10, 0])
			const beforeUndo = read()
			Undo.undo()
			const undo1 = read()
			Undo.undo()
			const undo2 = read()
			Undo.redo()
			const redo1 = read()
			Undo.redo()
			const redo2 = read()
			return { beforeUndo, undo1, undo2, redo1, redo2 }
		})

		expect(history.beforeUndo).toEqual([60, 10, 0])
		expect(history.undo1).toEqual([30, 0, 0])
		expect(history.undo2).toBeNull() // undo of the first set clears the field
		expect(history.redo1).toEqual([30, 0, 0])
		expect(history.redo2).toEqual([60, 10, 0])
	})

	it('round-trips arm rotations through a .utilityproject save and load', async () => {
		await newProject(FORMAT_ID)
		await settleUtilityFormat()
		await enterDisplayMode()

		const json = await blockbench.evaluate(codecId => {
			const slot = Project!.display_settings.thirdperson_righthand
			slot.left_arm_rotation = [15, 0, 0]
			slot.right_arm_rotation_when_offhand_occupied = [0, 45, 0]
			return Codecs[codecId].compile() as string
		}, CODEC_ID)

		await newProject(FORMAT_ID)
		await settleUtilityFormat()
		const loaded = await blockbench.evaluate(
			(codecId, content) => {
				Codecs[codecId].load(JSON.parse(content), {
					path: 'arm-rotations.utilityproject',
					name: 'arm-rotations.utilityproject',
				} as unknown as Parameters<(typeof Codecs)[string]['load']>[1])
				const slot = Project!.display_settings.thirdperson_righthand
				return {
					left: slot.left_arm_rotation && [...slot.left_arm_rotation],
					rightOffhand: slot.right_arm_rotation_when_offhand_occupied && [
						...slot.right_arm_rotation_when_offhand_occupied,
					],
				}
			},
			CODEC_ID,
			json
		)

		expect(loaded.left).toEqual([15, 0, 0])
		expect(loaded.rightOffhand).toEqual([0, 45, 0])
	})
})

describe('display slot model overrides', () => {
	it('copy(), extend() and export() carry the overrides string', async () => {
		await newProject(FORMAT_ID)
		await settleUtilityFormat()
		await enterDisplayMode()

		const result = await blockbench.evaluate(() => {
			const slot = Project!.display_settings.thirdperson_righthand
			const emptyExport = slot.export()

			slot.overrides = 'ns:custom/model'
			const copy = slot.copy() as Record<string, unknown>
			const withOverride = slot.export() as Record<string, unknown> | undefined

			slot.extend({ overrides: 'ns:other' } as never)
			const afterExtend = slot.overrides
			slot.extend({ overrides: undefined } as never)
			const afterClear = slot.overrides ?? null
			// An unrelated preset must not touch it.
			slot.overrides = 'ns:keep'
			slot.extend({ rotation: [1, 2, 3] } as never)
			const afterUnrelated = slot.overrides

			return {
				emptyExport,
				copyOverrides: copy.overrides,
				withOverride,
				afterExtend,
				afterClear,
				afterUnrelated,
			}
		})

		expect(result.emptyExport).toBeUndefined()
		expect(result.copyOverrides).toBe('ns:custom/model')
		expect(result.withOverride).toEqual({ overrides: 'ns:custom/model' })
		expect(result.afterExtend).toBe('ns:other')
		expect(result.afterClear).toBeNull()
		expect(result.afterUnrelated).toBe('ns:keep')
	})

	it('round-trips the override through undo and redo', async () => {
		await newProject(FORMAT_ID)
		await settleUtilityFormat()
		await enterDisplayMode()

		const history = await blockbench.evaluate(() => {
			const slot = () => Project!.display_settings.thirdperson_righthand
			const set = (v: string | undefined) => {
				Undo.initEdit({ display_slots: ['thirdperson_righthand'] })
				slot().overrides = v
				Undo.finishEdit('Set model override')
			}
			set('ns:a')
			set('ns:b')
			const before = slot().overrides
			Undo.undo()
			const undo1 = slot().overrides
			Undo.undo()
			const undo2 = slot().overrides ?? null
			Undo.redo()
			const redo1 = slot().overrides
			return { before, undo1, undo2, redo1 }
		})

		expect(history.before).toBe('ns:b')
		expect(history.undo1).toBe('ns:a')
		expect(history.undo2).toBeNull()
		expect(history.redo1).toBe('ns:a')
	})

	it('round-trips the override through a .utilityproject save and load', async () => {
		await newProject(FORMAT_ID)
		await settleUtilityFormat()
		await enterDisplayMode()

		const json = await blockbench.evaluate(codecId => {
			Project!.display_settings.thirdperson_righthand.overrides = 'ns:saved/model'
			return Codecs[codecId].compile() as string
		}, CODEC_ID)

		await newProject(FORMAT_ID)
		await settleUtilityFormat()
		const loaded = await blockbench.evaluate(
			(codecId, content) => {
				Codecs[codecId].load(JSON.parse(content), {
					path: 'overrides.utilityproject',
					name: 'overrides.utilityproject',
				} as unknown as Parameters<(typeof Codecs)[string]['load']>[1])
				return Project!.display_settings.thirdperson_righthand.overrides
			},
			CODEC_ID,
			json
		)

		expect(loaded).toBe('ns:saved/model')
	})

	describe('.utility.json export', () => {
		let dir: string
		beforeAll(() => {
			dir = mkdtempSync(join(tmpdir(), 'ue-overrides-'))
		})
		afterAll(() => {
			rmSync(dir, { recursive: true, force: true })
		})

		it('writes the slot override into the exported display block', async () => {
			await buildSampleProject()
			const exportPath = join(dir, 'export.utility.json')
			await blockbench.evaluate(path => {
				for (const texture of Texture.all) {
					texture.path = '/pack/assets/minecraft/textures/block/stone.png'
				}
				Modes.options.display.select()
				;(DisplayMode as unknown as { loadThirdRight(): void }).loadThirdRight()
				Project!.display_settings.thirdperson_righthand.overrides = 'ns:exported/model'
				Project!.export_path = path
			}, exportPath)

			await action('utility-engine:action/export-utility-model').trigger()

			const model = JSON.parse(readFileSync(exportPath, 'utf-8')) as {
				display?: Record<string, { overrides?: string }>
			}
			expect(model.display?.thirdperson_righthand?.overrides).toBe('ns:exported/model')
		})

		it('imports a slot override from a hand-written .utility.json', async () => {
			const doc = JSON.stringify({
				format_version: '0.0.3',
				texture_size: [16, 16],
				textures: {},
				elements: [],
				structure: {},
				display: { head: { overrides: 'ns:imported/model' } },
			})
			await blockbench.evaluate(
				(codecId, json) => {
					Codecs[codecId].load(JSON.parse(json), {
						path: 'fixture.utility.json',
						name: 'fixture.utility.json',
						content: json,
					} as unknown as Parameters<(typeof Codecs)[string]['load']>[1])
				},
				CODEC_ID,
				doc
			)

			const override = await blockbench.evaluate(
				() => Project!.display_settings.head?.overrides
			)
			expect(override).toBe('ns:imported/model')
		})
	})

	describe('file picker', () => {
		it('accepts a resource-pack path and rejects one outside a pack', async () => {
			await newProject(FORMAT_ID)
			await settleUtilityFormat()
			await enterDisplayMode()

			const result = await blockbench.evaluate(() => {
				const button = document.querySelector<HTMLElement>(
					'#panel_display .override_input_bar .tool'
				)
				if (!button) return { noButton: true }

				const original = Blockbench.import
				let rejectedMessage: unknown = null
				const originalQuick = Blockbench.showQuickMessage
				Blockbench.showQuickMessage = (m: unknown) => {
					rejectedMessage = m
				}

				const pick = (path: string) => {
					Blockbench.import = (_opts: unknown, cb: (files: unknown[]) => void) =>
						cb([{ name: 'model.json', path }])
					button.click()
				}
				const currentOverride = () =>
					Project!.display_settings.thirdperson_righthand.overrides ?? null

				pick('/somewhere/not/a/pack/model.json')
				const afterBad = { override: currentOverride(), rejected: !!rejectedMessage }

				rejectedMessage = null
				pick('/rp/assets/minecraft/models/item/apple.json')
				const afterGood = {
					override: currentOverride(),
					rejected: !!rejectedMessage,
				}

				Blockbench.import = original
				Blockbench.showQuickMessage = originalQuick
				return { afterBad, afterGood }
			})

			if ('noButton' in result) {
				throw new Error('override input button did not render')
			}
			expect(result.afterBad).toEqual({ override: null, rejected: true })
			expect(result.afterGood).toEqual({
				override: 'minecraft:item/apple',
				rejected: false,
			})
		})
	})

	describe('slider visibility', () => {
		it('hides the display sliders and arm-rotation section while an override is set', async () => {
			await newProject(FORMAT_ID)
			await settleUtilityFormat()
			await enterDisplayMode()

			const snapshot = () =>
				blockbench.evaluate(() => {
					const panel = document.querySelector('#panel_display')!
					const sliders = panel.querySelector<HTMLElement>('#display_sliders')!
					const armSection = [
						...panel.querySelectorAll('.display_slot_section_bar.title'),
					].some(b => /ARM ROTATION/i.test(b.textContent ?? ''))
					return {
						slidersShown: getComputedStyle(sliders).display !== 'none',
						armSectionShown: armSection,
						overrideRowShown: !!panel.querySelector('.override_input_bar'),
					}
				})

			const setOverride = (v: string | undefined) =>
				blockbench.evaluate(value => {
					const cb = document.querySelector<HTMLInputElement>(
						'#panel_display .override_input_bar input[type=checkbox]'
					)!
					const text = document.querySelector<HTMLInputElement>(
						'#panel_display .override_input_bar input[type=text]'
					)!
					cb.checked = !!value
					cb.dispatchEvent(new Event('change', { bubbles: true }))
					text.value = value ?? ''
					text.dispatchEvent(new Event('input', { bubbles: true }))
					text.dispatchEvent(new Event('change', { bubbles: true }))
				}, v)

			expect(await snapshot()).toEqual({
				slidersShown: true,
				armSectionShown: true,
				overrideRowShown: true,
			})

			await setOverride('ns:model/a')
			expect(await snapshot()).toEqual({
				slidersShown: false,
				armSectionShown: false,
				overrideRowShown: true,
			})

			await setOverride(undefined)
			expect(await snapshot()).toEqual({
				slidersShown: true,
				armSectionShown: true,
				overrideRowShown: true,
			})
		})
	})
})
