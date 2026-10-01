import { blockbench, newProject } from '@snavesutit/jestbench'

export const PLUGIN_ID = 'utility_engine'
export const FORMAT_ID = 'utility_engine:format/utility-model-project'
/** The format ID written by v1.0.1 and older, before the plugin ID changed. */
export const LEGACY_FORMAT_ID = 'utility-engine:format/utility-model-project'
export const CODEC_ID = 'utility_engine:codec/utility-model-project'
export const LOADER_ID = 'utility_engine:model_loader/utility-model-json-loader'

/**
 * Points `Format` (and the active project's `.format`) at the currently
 * registered utility format instance. blockbench-patch-manager can re-create the
 * format when patches re-apply; under jestbench's shared instance an earlier
 * project can be left referencing the previous one. The plugin compares by id so
 * this is belt-and-braces, but it keeps the codec helpers deterministic.
 */
export async function settleUtilityFormat(): Promise<void> {
	await blockbench.evaluate(formatId => {
		const g = globalThis as unknown as {
			Format?: unknown
			Formats: Record<string, unknown>
			Project?: { format?: unknown }
		}
		const format = g.Formats[formatId]
		if (!format) return
		g.Format = format
		if (g.Project) g.Project.format = format
	}, FORMAT_ID)
}

/** Compiles the current project to the `.utilityproject` JSON string. */
export async function compileProject(): Promise<string> {
	await settleUtilityFormat()
	return blockbench.evaluate(
		(formatId, codecId) => {
			;(
				globalThis as unknown as { Format: unknown; Formats: Record<string, unknown> }
			).Format = (globalThis as unknown as { Formats: Record<string, unknown> }).Formats[
				formatId
			]
			return Codecs[codecId].compile() as string
		},
		FORMAT_ID,
		CODEC_ID
	) as Promise<string>
}

/** Loads a `.utilityproject` JSON string into a fresh project via the codec. */
export async function loadProjectJson(
	json: string,
	path = 'roundtrip.utilityproject'
): Promise<void> {
	await newProject(FORMAT_ID)
	await settleUtilityFormat()
	await blockbench.evaluate(
		(formatId, codecId, content, filePath) => {
			;(
				globalThis as unknown as { Format: unknown; Formats: Record<string, unknown> }
			).Format = (globalThis as unknown as { Formats: Record<string, unknown> }).Formats[
				formatId
			]
			Codecs[codecId].load(JSON.parse(content), {
				path: filePath,
				name: filePath,
			} as unknown as Parameters<(typeof Codecs)[string]['load']>[1])
		},
		FORMAT_ID,
		CODEC_ID,
		json,
		path
	)
}

/**
 * Drops a model file onto the window through Blockbench's `model` drag handler. Unlike our
 * `window.loadModelFile` override, it uses the module-scoped loader, which passes only the
 * parsed content to `load_filter.condition`.
 */
export async function dropFile(path: string, content: string): Promise<void> {
	await blockbench.evaluate(
		(filePath, text) => {
			const handlers = (
				globalThis as unknown as {
					Filesystem: { drag_handlers: Record<string, { cb(files: unknown[]): void }> }
				}
			).Filesystem.drag_handlers
			handlers.model.cb([
				{ path: filePath, name: filePath.split(/[\\/]/).pop(), content: text },
			])
		},
		path,
		content
	)
}

/** A tiny 2x1 PNG (red / blue) as a data URL - enough for a real, loadable texture. */
export const TEST_PNG =
	'data:image/png;base64,' +
	'iVBORw0KGgoAAAANSUhEUgAAAAIAAAABCAYAAADnEwSWAAAAEklEQVR4nGP8z8Dwn4EIwESMIgAxvwME7GsaXwAAAABJRU5ErkJggg=='

/**
 * Creates a fresh Utility Model Project populated with a group, two cubes (one
 * inside the group), a texture, an animation with keyframes, and non-default
 * `head` display-slot settings. Returns the uuids the test can assert against.
 */
export async function buildSampleProject(): Promise<{
	groupUuid: string
	cubeUuids: string[]
	textureUuid: string
	animationUuid: string
}> {
	await newProject(FORMAT_ID)
	await settleUtilityFormat()
	return blockbench.evaluate(
		(pngDataUrl, formatId) => {
			;(
				globalThis as unknown as { Format: unknown; Formats: Record<string, unknown> }
			).Format = (globalThis as unknown as { Formats: Record<string, unknown> }).Formats[
				formatId
			]

			const texture = new Texture({ name: 'test_tex' }).fromDataURL(pngDataUrl).add(false)

			const group = new Group({ name: 'root_bone' }).init()
			const cubeA = new Cube({ name: 'cube_a', from: [0, 0, 0], to: [4, 4, 4] }).init()
			cubeA.addTo(group)
			const cubeB = new Cube({ name: 'cube_b', from: [-2, 0, 0], to: [0, 2, 2] }).init()

			for (const cube of [cubeA, cubeB]) {
				for (const face of Object.keys(cube.faces)) {
					cube.faces[face].texture = texture.uuid
				}
			}

			const animation = new Blockbench.Animation({ name: 'custom.wave' }).add(false)
			animation.loop = 'loop'
			animation.loop_delay = '3'
			const animator = animation.getBoneAnimator(group)
			animator.addKeyframe({
				channel: 'rotation',
				time: 0,
				data_points: [{ x: 0, y: 0, z: 0 }],
			})
			animator.addKeyframe(
				{ channel: 'rotation', time: 0.5, data_points: [{ x: 45, y: 0, z: 0 }] },
				undefined
			)

			Canvas.updateAll()

			return {
				groupUuid: group.uuid,
				cubeUuids: [cubeA.uuid, cubeB.uuid],
				textureUuid: texture.uuid,
				animationUuid: animation.uuid,
			}
		},
		TEST_PNG,
		FORMAT_ID
	)
}

/** A serialisable snapshot of the parts of the project the codec is responsible for. */
export interface ProjectSnapshot {
	elements: Array<{ name: string; type: string; from?: number[]; to?: number[] }>
	groups: string[]
	textures: Array<{ name: string; hasSource: boolean }>
	animations: Array<{ name: string; loop: string; loopDelay: string; keyframeCount: number }>
}

export async function snapshotProject(): Promise<ProjectSnapshot> {
	return blockbench.evaluate(() => {
		return {
			elements: Outliner.elements.map(el => ({
				name: el.name,
				type: (el as { type: string }).type,
				from: (el as { from?: number[] }).from
					? [...(el as { from: number[] }).from]
					: undefined,
				to: (el as { to?: number[] }).to ? [...(el as { to: number[] }).to] : undefined,
			})),
			groups: Group.all.map(g => g.name).sort(),
			textures: Texture.all.map(t => ({ name: t.name, hasSource: !!t.source })),
			animations: Blockbench.Animation.all.map(a => ({
				name: a.name,
				loop: a.loop,
				loopDelay: String(a.loop_delay ?? ''),
				keyframeCount: Object.values(a.animators).reduce(
					(n, animator) =>
						n + ((animator as { keyframes?: unknown[] }).keyframes?.length ?? 0),
					0
				),
			})),
		}
	})
}
