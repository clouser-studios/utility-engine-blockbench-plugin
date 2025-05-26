import { SKIN_TEXTURE_NAME, SkinTexture } from '../../textures/skinTexture'
import { parseResourcePackPath } from '../../util/minecraftUtil'
import { translate } from '../../util/translation'
import { type v0_0_1 as UtilityModel } from './versions/0.0.1'

const FORMAT_VERSION = '0.0.1'

export class ExportError extends Error {
	constructor(key: string, ...args: string[]) {
		super(translate(key, ...args))
		this.name = 'ExportError'
	}
}

function validateTextures() {
	for (const texture of Texture.all) {
		// Skin textures are always internal
		if (texture instanceof SkinTexture) continue
		if (texture.path === undefined || texture.path === '') {
			throw new ExportError('export.error.texture_not_saved', texture.name)
		}
		const parsed = parseResourcePackPath(texture.path)
		if (parsed === undefined) {
			throw new ExportError(
				'export.error.invalid_resource_pack_path',
				texture.name,
				texture.path
			)
		}
	}
}

function renderCube(cube: Cube) {
	if (!cube.export) return

	const element = { uuid: cube.uuid } as UtilityModel.IElement

	element.from = [...cube.from]
	element.to = [...cube.to]

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
		const renderedFace = {} as UtilityModel.IElementFace
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

function renderMesh(mesh: Mesh): UtilityModel.IMesh {
	const saveCopy = mesh.getSaveCopy!(true) as UtilityModel.IMeshSaveCopy

	for (const face of Object.values(saveCopy.faces)) {
		face.texture = '#' + face.texture

		// Re-order vertices to match Minecraft's winding order
		if (face.vertices.length === 4) {
			const vertex3 = face.vertices[2]
			face.vertices[2] = face.vertices[3]
			face.vertices[3] = vertex3
		}
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
	}
}

function recurseStructure(
	model: UtilityModel.IUtilityModelJSON,
	children: OutlinerNode[]
	// parent?: Group
): UtilityModel.IStructure {
	const structure: UtilityModel.IStructure = {}

	for (const child of children) {
		if (!child.export) continue
		if (child instanceof Group) {
			const bone: UtilityModel.IBone = {
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

function createUtilityModel(): UtilityModel.IUtilityModelJSON {
	validateTextures()

	const model: UtilityModel.IUtilityModelJSON = {
		__comment:
			'Created in Blockbench, exported via Utility Engine. Will not work in Vanilla Minecraft!',
		format_version: FORMAT_VERSION,
		texture_size: [Project!.texture_width, Project!.texture_height],
		textures: {},
		elements: [],
		structure: {},
		display: {},
	}

	const particleTexture = Texture.all.find(v => v.particle)
	if (particleTexture) {
		// Path and Parsed should always be defined after validating textures.
		const parsed = parseResourcePackPath(particleTexture.path!)!
		model.textures.particle = parsed.resourceLocation
	}
	for (const texture of Texture.all) {
		if (texture instanceof SkinTexture) {
			model.textures[texture.id] = SKIN_TEXTURE_NAME
			continue
		}
		// Path and Parsed should always be defined after validating textures.
		const parsed = parseResourcePackPath(texture.path!)!
		model.textures[texture.id] = parsed.resourceLocation
	}

	model.structure = recurseStructure(model, Outliner.root)

	const animations: UtilityModel.IUtilityModelJSON['animations'] = []
	for (const animation of Blockbench.Animation.all) {
		const bedrock = animation.compileBedrockAnimation()
		animations.push({
			name: animation.name,
			animation_length: bedrock.animation_length,
			loop_mode: animation.loop,
			loop_delay: animation.loop_delay,
			bones: bedrock.bones,
		})
	}
	if (animations.length) model.animations = animations

	const display: UtilityModel.IDisplayContainer = {}
	for (const [key, settings] of Object.entries(Project!.display_settings)) {
		if (
			settings.rotation.allAre(v => v === 0) &&
			settings.scale.allAre(v => v === 1) &&
			settings.translation.allAre(v => v === 0) &&
			settings.mirror.allAre(v => v === false)
		) {
			// Ignore default display settings
			continue
		}
		display[key as keyof UtilityModel.IDisplayContainer] = {
			translation: settings.translation,
			rotation: settings.rotation,
			scale: settings.scale,
			mirror: settings.mirror,
		}
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
				fs.writeFileSync(path, autoStringify(model))
				Blockbench.showQuickMessage(translate('message.exported'))
				return
			} catch {} // Ignore errors and continue with the file picker
		}
		Blockbench.export(
			{
				resource_id: 'utility_model.export',
				name: Project!.name + '.utility',
				type: 'json',
				extensions: ['json'],
				startpath: Project!.export_path,
				content: autoStringify(model),
			},
			chosenPath => {
				console.log('chosenPath:', chosenPath)
				Project!.export_path = chosenPath
				Blockbench.showQuickMessage(translate('message.exported'))
			}
		)
	} catch (e: any) {
		console.error(e)
		if (e instanceof ExportError) {
			Blockbench.showMessageBox({
				title: translate('message.failed_to_export.title'),
				message: e.message,
				icon: 'error',
			})
		} else {
			Blockbench.showMessageBox({
				title: translate('message.failed_to_export.title'),
				message: translate('message.failed_to_export.message', e.message as string),
				icon: 'error',
			})
		}
	}
}
