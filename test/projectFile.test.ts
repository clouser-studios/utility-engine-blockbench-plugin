import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { blockbench, newProject } from '@snavesutit/jestbench'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
	buildSampleProject,
	CODEC_ID,
	FORMAT_ID,
	settleUtilityFormat,
	dropFile,
	snapshotProject,
} from './support'

describe('.utilityproject file save / load', () => {
	let dir: string

	beforeAll(() => {
		dir = mkdtempSync(join(tmpdir(), 'ue-projectfile-'))
	})
	afterAll(() => {
		rmSync(dir, { recursive: true, force: true })
	})

	it('writes a real file and loads it back through loadModelFile', async () => {
		await buildSampleProject()
		const before = await snapshotProject()

		const filePath = join(dir, 'sample.utilityproject')
		await settleUtilityFormat()
		await blockbench.evaluate(
			(formatId, codecId, p) => {
				;(
					globalThis as unknown as { Format: unknown; Formats: Record<string, unknown> }
				).Format = (globalThis as unknown as { Formats: Record<string, unknown> }).Formats[
					formatId
				]
				const codec = Codecs[codecId]
				codec.write(codec.compile(), p)
			},
			FORMAT_ID,
			CODEC_ID,
			filePath
		)

		expect(existsSync(filePath)).toBe(true)
		const content = readFileSync(filePath, 'utf-8')
		expect(() => JSON.parse(content)).not.toThrow()

		await newProject(FORMAT_ID)
		await settleUtilityFormat()
		await blockbench.evaluate(
			(formatId, p, text) => {
				;(
					globalThis as unknown as { Format: unknown; Formats: Record<string, unknown> }
				).Format = (globalThis as unknown as { Formats: Record<string, unknown> }).Formats[
					formatId
				]
				;(globalThis as unknown as { loadModelFile: (f: unknown) => void }).loadModelFile({
					path: p,
					name: p.split(/[\\/]/).pop(),
					content: text,
				})
			},
			FORMAT_ID,
			filePath,
			content
		)

		const after = await snapshotProject()
		expect(after.elements.map(e => e.name).sort()).toEqual(
			before.elements.map(e => e.name).sort()
		)
		expect(after.animations).toEqual(before.animations)
		expect(after.groups).toEqual(before.groups)
	})

	it('opens when dropped onto the window', async () => {
		await buildSampleProject()
		const before = await snapshotProject()

		const filePath = join(dir, 'dropped.utilityproject')
		await settleUtilityFormat()
		await blockbench.evaluate(
			(codecId, p) => {
				const codec = Codecs[codecId]
				codec.write(codec.compile(), p)
				void Project!.close(true)
			},
			CODEC_ID,
			filePath
		)
		await blockbench.waitFor('ModelProject.all.length === 0')

		await dropFile(filePath, readFileSync(filePath, 'utf-8'))
		await blockbench.waitFor(`Project?.save_path === ${JSON.stringify(filePath)}`)

		const format = await blockbench.evaluate(() => Format.id)
		expect(format).toBe(FORMAT_ID)
		const after = await snapshotProject()
		expect(after.elements.map(e => e.name).sort()).toEqual(
			before.elements.map(e => e.name).sort()
		)
	})
})
