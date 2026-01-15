import Icon from '@assets/icons/nobackground.png'
import { registerAction } from '@blockbench-tools'
import { currentFormatIsUtilityModelProject } from '@utility/formats/utility-model-project/index.ts'
import { SKIN_TEXTURE_NAME, SkinTexture } from '@utility/textures/skin-texture/index.ts'
import { localize } from '@utility/util/lang.ts'
import { log } from '@utility/util/log.ts'
import { parsePackPath } from '@utility/util/minecraftUtil.ts'
import { type UtilityModel } from './versions/latest.ts'

const FORMAT_VERSION = '0.0.1'

export class ExportError extends Error {
	constructor(key: string, ...args: string[]) {
		super(localize(key, ...args))
		this.name = 'ExportError'
	}
}

function validateTextures() {
	for (const texture of Texture.all) {
		// Skin textures are always internal
		if (texture instanceof SkinTexture) continue
		if (texture.path === undefined || texture.path === '') {
			texture.save()
		}
		const parsed = parsePackPath('assets', texture.path!, true)
		if (parsed === undefined) {
			Blockbench.showMessageBox({
				title: localize('export.error.invalid_resource_pack_path.title'),
				message: localize(
					'export.error.invalid-resource-pack-path.description',
					texture.name,
					texture.path!
				),
			})
		}
	}
}

function renderCube(cube: Cube) {
	if (!cube.export) return

	const element = { uuid: cube.uuid } as UtilityModel.Element

	element.from = [...cube.from]
	element.to = [...cube.to]

	element.enableBackfaceCulling = cube.enableBackfaceCulling

	if (cube.inflate) {
		element.from.V3_subtract(cube.inflate, cube.inflate, cube.inflate)
		element.to.V3_add(cube.inflate, cube.inflate, cube.inflate)
	}

	if (cube.shade === false) element.shade = false

	element.rotation = {
		euler: [...cube.rotation],
		origin: [...cube.origin],
	}

	element.faces = {}
	for (const [face, data] of Object.entries(cube.faces)) {
		if (!data?.texture) continue
		const renderedFace = {} as UtilityModel.ElementFace
		if (data.enabled) {
			renderedFace.uv = data.uv
				.slice()
				.map((v, i) => (v * 16) / UVEditor.getResolution(i % 2))
		}
		if (data.rotation) renderedFace.rotation = data.rotation
		if (data.texture) {
			const texture = data.getTexture()
			if (!texture) throw new Error('Texture not found')
			renderedFace.texture = '#' + texture.id
		}
		if (data.cullface) renderedFace.cullface = data.cullface
		if (data.tint >= 0) renderedFace.tintindex = data.tint
		element.faces[face] = renderedFace
	}

	if (Object.keys(element.faces).length === 0) return
	return element
}

function renderMesh(mesh: Mesh): UtilityModel.Mesh {
	const saveCopy = mesh.getSaveCopy!() as UtilityModel.MeshSaveCopy

	for (const [key, face] of Object.entries(mesh.faces)) {
		saveCopy.faces[key].vertices = face.getSortedVertices().slice()
	}

	for (const face of Object.values(saveCopy.faces)) {
		const texture = Texture.all.find(t => t.uuid === face.texture)
		if (!texture) {
			throw new ExportError('export.error.texture_not_found', face.texture)
		}
		face.texture = '#' + texture.id
	}

	return {
		name: saveCopy.name,
		uuid: mesh.uuid,
		rotation: {
			euler: saveCopy.rotation,
			origin: saveCopy.origin,
		},
		vertices: saveCopy.vertices,
		faces: saveCopy.faces,
		enableBackfaceCulling: mesh.enableBackfaceCulling,
	}
}

function recurseStructure(
	model: UtilityModel.Json,
	children: OutlinerNode[]
	// parent?: Group
): UtilityModel.Structure {
	const structure: UtilityModel.Structure = {}

	for (const child of children) {
		if (!child.export) continue
		if (child instanceof Group) {
			const bone: UtilityModel.Bone = {
				name: child.name,
				rotation: {
					euler: child.rotation,
					origin: child.origin,
				},
				children: recurseStructure(model, child.children),
			}
			structure.bones ??= []
			structure.bones.push(bone)
		} else if (child instanceof Mesh) {
			const mesh = renderMesh(child)
			model.meshes ??= []
			model.meshes.push(mesh)
			structure.meshes ??= []
			structure.meshes.push(mesh.uuid)
		} else if (child instanceof Cube) {
			const element = renderCube(child)
			if (element) {
				structure.elements ??= []
				structure.elements.push(element.uuid)
				model.elements.push(element)
			}
		} else {
			console.warn(`Skipping unknown outliner node type when generating children:`, child)
		}
	}

	return structure
}

function createUtilityModel(): UtilityModel.Json {
	validateTextures()

	const model: UtilityModel.Json = {
		__comment:
			'Created in Blockbench, exported via Utility Engine. Will not work in Vanilla Minecraft!',
		format_version: FORMAT_VERSION,
		texture_size: [Project!.texture_width, Project!.texture_height],
		textures: {},
		elements: [],
		structure: {},
	}

	const particleTexture = Texture.all.find(v => v.particle)
	if (particleTexture) {
		// Path and Parsed should always be defined after validating textures.
		const parsed = parsePackPath('assets', particleTexture.path!, true)!
		model.textures.particle = parsed.resourceLocation
	}
	for (const texture of Texture.all) {
		if (texture instanceof SkinTexture) {
			model.textures[texture.id] = SKIN_TEXTURE_NAME
			continue
		}
		// Path and Parsed should always be defined after validating textures.
		const parsed = parsePackPath('assets', texture.path!, true)
		if (parsed === undefined) {
			model.textures[texture.id] = texture.name
		} else {
			model.textures[texture.id] = parsed.resourceLocation
		}
	}

	model.structure = recurseStructure(model, Outliner.root)

	const animations: UtilityModel.Json['animations'] = []
	for (const animation of Blockbench.Animation.all) {
		const bedrock = animation.compileBedrockAnimation()
		animations.push({
			name: animation.name,
			animation_length: bedrock.animation_length,
			loop_mode: animation.loop,
			loop_delay: !animation.loop_delay ? '0' : animation.loop_delay,
			bones: bedrock.bones,
		})
	}
	if (animations.length) model.animations = animations

	if (Project!.front_gui_light) {
		model.front_gui_light = true
	}

	const display = {} as UtilityModel.DisplayContainer
	for (const [key, settings] of Object.entries(Project!.display_settings)) {
		const reducedSettings: UtilityModel.Display = {}
		if (!settings.rotation.allAre(v => v === 0)) {
			reducedSettings.rotation = [...settings.rotation]
		}
		if (!settings.scale.allAre(v => v === 1)) {
			reducedSettings.scale = [...settings.scale]
		}
		if (!settings.translation.allAre(v => v === 0)) {
			reducedSettings.translation = [...settings.translation]
		}
		if (!settings.mirror.allAre(v => v === false)) {
			reducedSettings.mirror = [...settings.mirror]
		}
		// Custom utility model display settings
		if (settings.left_arm_rotation) {
			reducedSettings.left_arm_rotation = [...settings.left_arm_rotation]
		}
		if (settings.left_arm_rotation_when_offhand_occupied) {
			reducedSettings.left_arm_rotation_when_offhand_occupied = [
				...settings.left_arm_rotation_when_offhand_occupied,
			]
		}
		if (settings.right_arm_rotation) {
			reducedSettings.right_arm_rotation = [...settings.right_arm_rotation]
		}
		if (settings.right_arm_rotation_when_offhand_occupied) {
			reducedSettings.right_arm_rotation_when_offhand_occupied = [
				...settings.right_arm_rotation_when_offhand_occupied,
			]
		}

		if (Object.keys(reducedSettings).length === 0) continue

		display[key as keyof UtilityModel.DisplayContainer] = reducedSettings
	}

	if (Object.keys(display).length) model.display = display

	return model
}

export function exportUtilityModel(path?: string) {
	try {
		const model = createUtilityModel()
		console.log(model)

		if (path) {
			try {
				Blockbench.writeFile(path, {
					content: autoStringify(model),
				})
				Blockbench.showQuickMessage(localize('message.exported'))
				return
			} catch {} // Ignore errors and continue with the file picker
		}
		Blockbench.export({
			resource_id: 'utility_model.export',
			name: Project!.name,
			type: 'json',
			extensions: ['utility.json'],
			startpath: Project!.export_path.replace(/\.utility\.json$/, ''),
			content: autoStringify(model),
			// eslint-disable-next-line @typescript-eslint/naming-convention
			custom_writer: (content, chosenPath) => {
				console.log('chosenPath:', chosenPath)
				if (!chosenPath.endsWith('.utility.json')) {
					chosenPath += '.utility.json'
				}
				// Patch stupid bug with Blockbench exporter
				chosenPath = chosenPath.replace(/\.utility\.json\.utility\.json$/, '.utility.json')
				Project!.export_path = chosenPath
				Blockbench.writeFile(chosenPath, { content })
				Blockbench.showQuickMessage(localize('message.exported'))
			},
		})
	} catch (e: any) {
		log.error(e)
		if (e instanceof ExportError) {
			Blockbench.showMessageBox({
				title: localize('message.failed_to_export.title'),
				message: e.message,
				icon: 'error',
			})
		} else {
			Blockbench.showMessageBox({
				title: localize('message.failed_to_export.title'),
				message: localize('message.failed_to_export.message', e.message as string),
				icon: 'error',
			})
		}
	}
}

export const EXPORT_UTILITY_MODEL_AS_ACTION = registerAction(
	{ id: `utility-engine:export-utility-model-as` },
	{
		name: localize('action.export_utility_model_as.label'),
		icon: Icon,
		condition: () => currentFormatIsUtilityModelProject(),
		click() {
			exportUtilityModel()
		},
	}
)
EXPORT_UTILITY_MODEL_AS_ACTION.onCreated(action => {
	MenuBar.addAction(action, 'file.export.1')
})

export const EXPORT_UTILITY_MODEL_ACTION = registerAction(
	{ id: `utility-engine:export-utility-model` },
	{
		name: localize('action.export_utility_model.label'),
		icon: Icon,
		condition: () => currentFormatIsUtilityModelProject(),
		click() {
			exportUtilityModel(Project!.export_path)
		},
	}
)
EXPORT_UTILITY_MODEL_ACTION.onCreated(action => {
	MenuBar.addAction(action, 'file.export.0')
})
