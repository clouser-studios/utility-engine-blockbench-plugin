import { SkinTexture } from '../textures/skinTexture'
import { parseResourcePackPath } from '../util/minecraftUtil'
import { translate } from '../util/translation'

const FORMAT_VERSION = '0.0.1'

interface IMeshFaceSaveCopy {
	uv: Record<string, number[]>
	vertices: string[]
	texture: string
}

interface IMeshSaveCopy {
	name: string
	rotation: ArrayVector3
	origin: ArrayVector3
	vertices: Record<string, ArrayVector3>
	faces: Record<string, IMeshFaceSaveCopy>
}

namespace UtilityModel {
	export interface IElementFace {
		uv: number[]
		rotation?: number
		texture: string
		cullface?: string
		tintindex?: number
	}

	export interface IElement {
		name: string
		uuid: string
		from: number[]
		to: number[]
		shade?: boolean
		rotation?: {
			euler: ArrayVector3
			origin: ArrayVector3
		}
		faces?: Record<string, IElementFace>
	}

	export interface IMeshFace {
		uv: Record<string, ArrayVector2>
		vertices: string[]
		texture: number
	}

	export interface IMesh {
		name: string
		uuid: string
		rotation?: {
			euler: ArrayVector3
			origin: ArrayVector3
		}
		vertices: Record<string, ArrayVector3>
		faces: Record<string, IMeshFaceSaveCopy>
	}

	export interface IAnimationBone {
		position: Record<string | number, ArrayVector3>
		rotation: Record<string | number, ArrayVector3>
		scale: Record<string | number, ArrayVector3>
	}

	export interface IAnimation {
		name: string
		animation_length: number
		loop_mode: 'once' | 'loop' | 'hold'
		loop_delay: number | string
		bones: Record<string, IAnimationBone>
	}

	export interface IDisplay {
		transform: ArrayVector3
		rotation: ArrayVector3
		scale: ArrayVector3
		mirror: [boolean, boolean, boolean]
	}

	export interface IBone {
		name: string
		rotation?: {
			euler: ArrayVector3
			origin: ArrayVector3
		}
		children: IStructure
	}

	export interface IStructure {
		elements?: string[]
		meshes?: string[]
		bones?: IBone[]
	}

	export interface IDisplayContainer {
		thirdperson_righthand?: IDisplay
		thirdperson_lefthand?: IDisplay
		firstperson_righthand?: IDisplay
		firstperson_lefthand?: IDisplay
		head?: IDisplay
		gui?: IDisplay
		ground?: IDisplay
		fixed?: IDisplay
	}

	export interface IModel {
		__comment?: string
		format_version: string
		textures: Record<string, string> & {
			particle?: string
		}
		elements: IElement[]
		structure: IStructure
		meshes?: IMesh[]
		animations?: IAnimation[]
		display?: IDisplayContainer
	}
}

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
	const saveCopy = mesh.getSaveCopy!(true) as IMeshSaveCopy

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

// function getGlobalTransform(node: { mesh: THREE.Mesh }) {
// 	const matrixWorld = node.mesh.matrixWorld.clone()

// 	const origin = new THREE.Vector3()
// 	const rotation = new THREE.Euler()
// 	const quaternion = new THREE.Quaternion()
// 	// Throw away scale using a reusable vector
// 	matrixWorld.decompose(origin, quaternion, Reusable.vec1)
// 	rotation.setFromQuaternion(quaternion, node.mesh.rotation.order)

// 	return {
// 		rotation: rotation.toArray() as ArrayVector3,
// 		origin: origin.toArray() as ArrayVector3,
// 	}
// }

function recurseStructure(
	model: UtilityModel.IModel,
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
			//REVIEW - Is origin stored implicitly in the vertices? I might have to add the parent offset to the vertices...
			// if (parent && mesh.rotation) {
			// 	const parentTransform = getGlobalTransform(parent)
			// 	mesh.rotation.euler.V3_subtract(parentTransform.rotation)
			// 	mesh.rotation.origin.V3_subtract(parentTransform.origin)
			// }
			model.meshes ??= []
			model.meshes.push(mesh)
			structure.meshes ??= []
			structure.meshes.push(mesh.uuid)
		} else if (child instanceof Cube) {
			const element = renderCube(child)
			if (element) {
				// if (parent) {
				// 	const parentTransform = getGlobalTransform(parent)
				// 	element.from.V3_subtract(parentTransform.origin)
				// 	element.to.V3_subtract(parentTransform.origin)
				// 	if (element.rotation) {
				// 		element.rotation.euler.V3_subtract(parentTransform.rotation)
				// 		element.rotation.origin.V3_subtract(parentTransform.origin)
				// 	}
				// }
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

function createUtilityModel(): UtilityModel.IModel {
	validateTextures()

	const model: UtilityModel.IModel = {
		__comment:
			'Created in Blockbench, exported via Utility Engine. Will not work in Vanilla Minecraft!',
		format_version: FORMAT_VERSION,
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
			model.textures[texture.id] = 'utility:skin'
			continue
		}
		// Path and Parsed should always be defined after validating textures.
		const parsed = parseResourcePackPath(texture.path!)!
		model.textures[texture.id] = parsed.resourceLocation
	}

	model.structure = recurseStructure(model, Outliner.root)

	const animations: UtilityModel.IModel['animations'] = []
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
			transform: settings.translation,
			rotation: settings.rotation,
			scale: settings.scale,
			mirror: settings.mirror,
		}
	}
	if (Object.keys(display).length) model.display = display

	return model
}

export function exportUtilityModel() {
	try {
		const model = createUtilityModel()
		console.log(model)
		Blockbench.export({
			// FIXME: This should enforce the `.utility.json` extension
			resource_id: 'utility_model.export',
			name: Project!.name + '.utility.json',
			type: 'json',
			extensions: ['json'],
			content: autoStringify(model),
		})
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
