import { describe, expect, it } from '@jest/globals'
import { blockbench, newProject } from '@snavesutit/jestbench'
import { CODEC_ID, FORMAT_ID, settleUtilityFormat } from './support'

/**
 * The utility format adds custom per-hand arm-rotation fields to `DisplaySlot`.
 * These must survive undo/redo (Blockbench snapshots the `display_slots` aspect via
 * `copy()` / `extend()`) and `.utilityproject` save/load (`export()`).
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
