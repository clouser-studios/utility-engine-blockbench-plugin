import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { action, blockbench, newProject } from '@snavesutit/jestbench'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { FORMAT_ID, settleUtilityFormat } from './support'

const EXPORT_ACTION = 'utility_engine:action/export-utility-model'
const EXPORT_AS_ACTION = 'utility_engine:action/export-utility-model-as'

describe('.utility.json export file extension', () => {
	let dir: string
	beforeAll(() => {
		dir = mkdtempSync(join(tmpdir(), 'ue-export-extension-'))
	})
	afterAll(() => {
		rmSync(dir, { recursive: true, force: true })
	})

	it('fixes the extension of an existing export path', async () => {
		await newProject(FORMAT_ID)
		await settleUtilityFormat()
		const exportPath = join(dir, 'model.json')
		await blockbench.evaluate(path => {
			Project!.export_path = path
		}, exportPath)

		await action(EXPORT_ACTION).trigger()

		expect(existsSync(join(dir, 'model.utility.json'))).toBe(true)
		expect(existsSync(exportPath)).toBe(false)
		expect(await blockbench.evaluate(() => Project!.export_path)).toBe(
			join(dir, 'model.utility.json')
		)
	})

	it('writes the save dialog path with exactly one .utility.json', async () => {
		await newProject(FORMAT_ID)
		await settleUtilityFormat()

		// Paths as Blockbench's save dialog hands them over, after appending `.utility.json`.
		const chosen = [
			'/models/a.utility.json',
			'/models/a.utility.json.utility.json',
			'/models/a.json.utility.json',
			'/models/a.utility.utility.json',
			'/models/my.model.utility.json',
		]
		const written = await blockbench.evaluate(
			(actionId, paths) => {
				const writes: string[] = []
				const { export: originalExport, writeFile: originalWrite } = Blockbench
				Blockbench.writeFile = (path => {
					writes.push(path)
				}) as typeof Blockbench.writeFile
				try {
					for (const path of paths) {
						Blockbench.export = (options => {
							options.custom_writer!(options.content!, path)
						}) as typeof Blockbench.export
						BarItems[actionId].trigger()
					}
				} finally {
					Blockbench.export = originalExport
					Blockbench.writeFile = originalWrite
				}
				return writes
			},
			EXPORT_AS_ACTION,
			chosen
		)

		expect(written).toEqual([
			'/models/a.utility.json',
			'/models/a.utility.json',
			'/models/a.utility.json',
			'/models/a.utility.json',
			'/models/my.model.utility.json',
		])
	})
})
