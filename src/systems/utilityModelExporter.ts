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
	origin: ArrayVector3
	rotation: ArrayVector3
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
		rotation: {
			value: ArrayVector3
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
		rotation: {
			value: ArrayVector3
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
		origin: ArrayVector3
		rotation: ArrayVector3
		children: string[]
	}

	export interface IModel {
		__comment?: string
		format_version: string
		textures: Record<string, string> & {
			particle?: string
		}
		elements: IElement[]
		outliner: Array<string | IBone>
		meshes?: IMesh[]
		animations?: IAnimation[]
		display: {
			thirdperson_righthand?: IDisplay
			thirdperson_lefthand?: IDisplay
			firstperson_righthand?: IDisplay
			firstperson_lefthand?: IDisplay
			head?: IDisplay
			gui?: IDisplay
			ground?: IDisplay
			fixed?: IDisplay
		}
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
				texture.path,
			)
		}
	}
}

function renderCube(cube: Cube) {
	if (!cube.export) return

	const element = { uuid: cube.uuid } as UtilityModel.IElement

	element.from = cube.from.slice()
	element.to = cube.to.slice()

	if (cube.inflate) {
		element.from = element.from.map(v => v - cube.inflate)
		element.to = element.to.map(v => v + cube.inflate)
	}

	if (cube.shade === false) element.shade = false

	element.rotation = {
		value: [...cube.rotation],
		origin: [...cube.origin],
	}

	if (cube.parent instanceof Group) {
		const parent = cube.parent
		element.from = element.from.map((v, i) => v - parent.origin[i])
		element.to = element.to.map((v, i) => v - parent.origin[i])
		if (element.rotation && !Array.isArray(element.rotation)) {
			element.rotation.origin = element.rotation.origin.V3_subtract(parent.origin)
		}
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
			value: saveCopy.rotation,
			origin: saveCopy.origin,
		},
		vertices: saveCopy.vertices,
		faces: saveCopy.faces,
	}
}

function createUtilityModel(): UtilityModel.IModel {
	validateTextures()

	const textures: UtilityModel.IModel['textures'] = {}
	const particleTexture = Texture.all.find(v => v.particle)
	if (particleTexture) {
		// Path and Parsed should always be defined after validating textures.
		const parsed = parseResourcePackPath(particleTexture.path!)!
		textures.particle = parsed.resourceLocation
	}
	for (const texture of Texture.all) {
		if (texture instanceof SkinTexture) {
			textures[texture.id] = 'utility:skin'
			continue
		}
		// Path and Parsed should always be defined after validating textures.
		const parsed = parseResourcePackPath(texture.path!)!
		textures[texture.id] = parsed.resourceLocation
	}

	const elements: UtilityModel.IModel['elements'] = []
	for (const cube of Cube.all) {
		const element = renderCube(cube)
		if (element) elements.push(element)
	}

	const meshes: UtilityModel.IModel['meshes'] = []
	for (const mesh of Mesh.all) {
		const renderedMesh = renderMesh(mesh)
		meshes.push(renderedMesh)
	}

	const outliner: UtilityModel.IModel['outliner'] = []
	function recurseGroup(group: Group) {
		const bone: UtilityModel.IBone = {
			name: group.name,
			origin: group.origin,
			rotation: group.rotation,
			children: [],
		}
		outliner.push(bone)
		for (const child of group.children) {
			if (child instanceof Group) {
				recurseGroup(child)
			} else {
				bone.children.push(child.uuid)
			}
		}
	}
	for (const node of Outliner.root) {
		if (node instanceof Group) {
			recurseGroup(node)
		} else {
			outliner.push(node.uuid)
		}
	}

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

	const display: UtilityModel.IModel['display'] = {}

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
		display[key as keyof UtilityModel.IModel['display']] = {
			transform: settings.translation,
			rotation: settings.rotation,
			scale: settings.scale,
			mirror: settings.mirror,
		}
	}

	return {
		__comment:
			'Created in Blockbench, exported via Utility Engine. Will not work in Vanilla Minecraft!',
		format_version: FORMAT_VERSION,
		textures,
		elements,
		outliner,
		meshes,
		animations,
		display,
	}
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
