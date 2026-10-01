import { describe, expect, it } from '@jest/globals'
import { blockbench, newProject } from '@snavesutit/jestbench'
import {
	CODEC_ID,
	compileProject,
	dropFile,
	FORMAT_ID,
	LEGACY_FORMAT_ID,
	settleUtilityFormat,
} from './support'

/**
 * Utility-format data that reaches Blockbench's `.bbmodel` codec (a `.bbmodel` file, a timed
 * backup, an autosave recovery) or File > Convert Project should end up as an unsaved Utility
 * Model Project, so the next save prompts for a `.utilityproject` path.
 */

interface ProjectState {
	format: string
	name: string
	savePath: string
	saved: boolean
	cubes: string[]
	skinTextureClasses: string[]
}

async function projectState(): Promise<ProjectState> {
	return blockbench.evaluate(() => ({
		format: Format.id,
		name: Project!.name,
		savePath: Project!.save_path,
		saved: Project!.saved,
		cubes: Cube.all.map(c => c.name),
		skinTextureClasses: Texture.all
			.filter(t => (t as { isSkinTexture?: boolean }).isSkinTexture)
			.map(t => t.constructor.name),
	}))
}

/** Builds a Utility project with a cube and a skin texture, and returns it as `.bbmodel` JSON. */
async function buildUtilityBbmodel(): Promise<string> {
	await newProject(FORMAT_ID)
	await settleUtilityFormat()
	return blockbench.evaluate(() => {
		new Cube({ name: 'cube', from: [0, 0, 0], to: [8, 8, 8] }).init()
		BarItems['utility_engine:action/create-skin-texture'].trigger()
		Project!.name = 'papyrus_ball.utility'
		const json = Codecs.project.compile() as string
		void Project!.close(true)
		return json
	})
}

const CONVERTED = {
	format: FORMAT_ID,
	name: 'papyrus_ball',
	savePath: '',
	saved: false,
	cubes: ['cube'],
	skinTextureClasses: ['SkinTexture'],
}

describe('.bbmodel in the Utility format', () => {
	it('converts a dropped .bbmodel file', async () => {
		const json = await buildUtilityBbmodel()
		await blockbench.waitFor('ModelProject.all.length === 0')

		await dropFile('models/papyrus_ball.utility.bbmodel', json)
		await blockbench.waitFor('!!Project')

		expect(await projectState()).toEqual(CONVERTED)
	})

	it('converts an autosave recovery', async () => {
		const json = await buildUtilityBbmodel()
		await blockbench.waitFor('ModelProject.all.length === 0')

		// Mirrors `AutoBackup.recoverAllBackups`.
		await blockbench.evaluate(content => {
			const model = JSON.parse(content)
			setupProject(Formats[model.meta.model_format])
			Codecs.project.parse!(model, 'backup.bbmodel')
		}, json)

		expect(await projectState()).toEqual(CONVERTED)
	})

	it('falls back to the .bbmodel parser when the Utility parser fails', async () => {
		const json = await buildUtilityBbmodel()
		await blockbench.waitFor('ModelProject.all.length === 0')

		const warnings = await blockbench.evaluate(
			(codecId, content) => {
				const codec = Codecs[codecId]
				const { parse } = codec
				const { showMessageBox } = Blockbench
				const titles: string[] = []
				codec.parse = () => {
					new Cube({ name: 'partial' }).init()
					throw new Error('forced failure')
				}
				Blockbench.showMessageBox = (options => {
					titles.push(String(options.title))
				}) as typeof Blockbench.showMessageBox
				try {
					const model = JSON.parse(content)
					setupProject(Formats[model.meta.model_format])
					Codecs.project.parse!(model, 'models/papyrus_ball.utility.bbmodel')
				} finally {
					codec.parse = parse
					Blockbench.showMessageBox = showMessageBox
				}
				return titles
			},
			CODEC_ID,
			json
		)

		expect(warnings).toEqual([])
		expect(await projectState()).toEqual(CONVERTED)
	})

	it('warns when both parsers fail', async () => {
		const warnings = await blockbench.evaluate(
			(codecId, formatId) => {
				const codec = Codecs[codecId]
				const { parse } = codec
				const { showMessageBox } = Blockbench
				const titles: string[] = []
				codec.parse = () => {
					throw new Error('forced failure')
				}
				Blockbench.showMessageBox = (options => {
					titles.push(String(options.title))
				}) as typeof Blockbench.showMessageBox
				try {
					setupProject(Formats[formatId])
					Codecs.project.parse!(
						{ meta: { model_format: formatId }, elements: 5, outliner: 'broken' },
						'broken.bbmodel'
					)
				} finally {
					codec.parse = parse
					Blockbench.showMessageBox = showMessageBox
				}
				return titles
			},
			CODEC_ID,
			FORMAT_ID
		)

		expect(warnings).toEqual(['Failed to Convert Project!'])
	})
})

describe('File > Convert Project to Utility Model', () => {
	it('converts the project and clears its save path', async () => {
		await newProject('java_block')
		await blockbench.evaluate(formatId => {
			new Cube({ name: 'cube' }).init()
			Project!.name = 'block'
			Project!.save_path = '/models/block.bbmodel'
			Formats[formatId].convertTo()
		}, FORMAT_ID)

		const state = await projectState()
		expect(state.format).toBe(FORMAT_ID)
		expect(state.savePath).toBe('')
		expect(state.saved).toBe(false)
		expect(state.cubes).toEqual(['cube'])
	})
})

describe('backups of Utility projects', () => {
	/** Builds a Utility project and compiles it with `options` through the `.bbmodel` codec. */
	async function compileBackup(options: Record<string, unknown>): Promise<string> {
		await newProject(FORMAT_ID)
		await settleUtilityFormat()
		return blockbench.evaluate(compileOptions => {
			new Cube({ name: 'cube', from: [0, 0, 0], to: [8, 8, 8] }).init()
			BarItems['utility_engine:action/create-skin-texture'].trigger()
			Project!.name = 'papyrus'
			Project!.model_identifier = 'ns:papyrus'
			const compiled = Codecs.project.compile(compileOptions)
			const json = typeof compiled === 'string' ? compiled : JSON.stringify(compiled)
			void Project!.close(true)
			return json
		}, options)
	}

	it('writes .utilityproject data tagged with the Utility format', async () => {
		const timed = JSON.parse(await compileBackup({ compressed: true, backup: true }))
		const autosave = JSON.parse(await compileBackup({ backup: true, raw: true }))

		for (const model of [timed, autosave]) {
			expect(model.meta.format).toBe(FORMAT_ID)
			expect(model.meta.model_format).toBe(FORMAT_ID)
			expect(model.model_identifier).toBe('ns:papyrus')
		}
	})

	it('leaves edit sessions and regular .bbmodel compiles on the .bbmodel codec', async () => {
		const session = JSON.parse(
			await compileBackup({ uuids: true, bitmaps: true, backup: true })
		)
		const plain = JSON.parse(await compileBackup({ raw: true }))

		for (const model of [session, plain]) {
			expect(model.meta.format).toBeUndefined()
			expect(model.meta.format_version).toBe('5.0')
		}
	})

	it('restores a timed backup file as a Utility project', async () => {
		const json = await compileBackup({ compressed: true, backup: true })
		await blockbench.waitFor('ModelProject.all.length === 0')

		await dropFile('backups/backup_30.9.26_13.00_papyrus.bbmodel', json)
		await blockbench.waitFor('!!Project')

		const state = await projectState()
		expect(state).toMatchObject({ format: FORMAT_ID, savePath: '', cubes: ['cube'] })
		expect(state.skinTextureClasses).toEqual(['SkinTexture'])
		expect(await blockbench.evaluate(() => Project!.model_identifier)).toBe('ns:papyrus')
	})

	it('restores an autosave with its name and project properties', async () => {
		const json = await compileBackup({ backup: true, raw: true })
		await blockbench.waitFor('ModelProject.all.length === 0')

		// Mirrors `AutoBackup.recoverAllBackups`.
		await blockbench.evaluate(content => {
			const model = JSON.parse(content)
			setupProject(Formats[model.meta.model_format])
			Codecs.project.parse!(model, 'backup.bbmodel')
		}, json)

		const state = await projectState()
		expect(state).toMatchObject({ format: FORMAT_ID, name: 'papyrus', savePath: '' })
		expect(state.skinTextureClasses).toEqual(['SkinTexture'])
		expect(await blockbench.evaluate(() => Project!.model_identifier)).toBe('ns:papyrus')
	})
})

describe('files saved before v1.0.2', () => {
	/** Swaps the current format ID in compiled JSON for the pre-v1.0.2 one. */
	function toLegacy(json: string): string {
		return json.replaceAll(FORMAT_ID, LEGACY_FORMAT_ID)
	}

	it('opens a .bbmodel tagged with the old format ID', async () => {
		const json = toLegacy(await buildUtilityBbmodel())
		await blockbench.waitFor('ModelProject.all.length === 0')

		await dropFile('models/papyrus_ball.utility.bbmodel', json)
		await blockbench.waitFor('!!Project')

		expect(await projectState()).toEqual(CONVERTED)
	})

	it('opens a .utilityproject with the old format ID', async () => {
		await newProject(FORMAT_ID)
		await blockbench.evaluate(() => {
			new Cube({ name: 'cube', from: [0, 0, 0], to: [8, 8, 8] }).init()
		})
		const json = toLegacy(await compileProject())
		await blockbench.evaluate(() => void Project!.close(true))
		await blockbench.waitFor('ModelProject.all.length === 0')

		await dropFile('models/papyrus_ball.utilityproject', json)
		await blockbench.waitFor('!!Project')

		const state = await projectState()
		expect(state.format).toBe(FORMAT_ID)
		expect(state.cubes).toEqual(['cube'])
	})
})
