import Icon from '@assets/icons/nobackground.png'
import { registerAction } from '@blockbench-tools'
import { UTILITY_MODEL_PROJECT_FORMAT } from '@utility/formats/utility-model-project/index.ts'
import { SKIN_TEXTURE_NAME, SkinTexture } from '@utility/textures/skin-texture/index.ts'
import { localize } from '@utility/util/lang.ts'
import { parsePackPath } from '@utility/util/minecraftUtil.ts'
import { updateUtilityModel } from './dfu.ts'
import { type UtilityModel } from './versions/latest.ts'

export class ImportError extends Error {
	constructor(key: string, ...args: string[]) {
		super(localize(key, ...args))
		this.name = 'ExportError'
	}
}

/**
 * Imports the structure, elements, and meshes of a utility model.
 */
function buildOutliner(
	structure: UtilityModel.Structure,
	elements?: UtilityModel.Element[],
	meshes?: UtilityModel.Mesh[]
) {
	function importCube(element: UtilityModel.Element, parent?: Group) {
		// Logic to import a single element
		console.log(`Importing element: ${element.uuid}`)

		const saveCopy: UtilityModel.Element & { type: 'cube' } = {
			...element,
			type: 'cube',
		}
		for (const [name, face] of Object.entries(saveCopy.faces ?? {}) as Array<
			[string, Omit<UtilityModel.ElementFace, 'texture'> & { texture: string | Texture }]
		>) {
			if (face.texture === undefined) continue
			const texture = Texture.all.find(t => (face.texture as string).endsWith(t.id))
			if (!texture) {
				console.warn(`Texture not found for face: ${name} in element ${element.uuid}`)
				continue
			}
			face.texture = texture
			face.uv = face.uv.map((v, i) => (v / 16) * UVEditor.getResolution(i % 2))
		}
		const newElement = OutlinerElement.fromSave(saveCopy).init() as Cube

		newElement.addTo(parent)
	}

	function importMesh(mesh: UtilityModel.Mesh, parent?: Group) {
		// Logic to import a single mesh
		console.log(`Importing mesh: ${mesh.uuid}`)

		const saveCopy: UtilityModel.MeshSaveCopy & { type: 'mesh' } = {
			type: 'mesh',
			name: mesh.name,
			uuid: mesh.uuid,
			rotation: mesh.rotation?.euler ?? [0, 0, 0],
			origin: mesh.rotation?.origin ?? [0, 0, 0],
			vertices: mesh.vertices,
			faces: mesh.faces,
		}

		for (const [name, face] of Object.entries(saveCopy.faces) as Array<
			[string, Omit<UtilityModel.MeshFace, 'texture'> & { texture: string | Texture }]
		>) {
			if (face.texture === undefined) continue
			const texture = Texture.all.find(t => (face.texture as string).endsWith(t.id))
			if (!texture) {
				console.warn(`Texture not found for face: ${name} in mesh ${mesh.uuid}`)
				continue
			}
			face.texture = texture
		}

		const newMesh = OutlinerElement.fromSave(saveCopy).init() as Mesh
		newMesh.enableBackfaceCulling = mesh.enableBackfaceCulling

		newMesh.addTo(parent)
	}

	function importStructure(struct: UtilityModel.Structure, parent?: Group) {
		for (const uuid of struct.elements ?? []) {
			const element = elements?.find(e => e.uuid === uuid)
			if (!element) {
				console.warn(`Element not found: ${uuid}`)
				continue
			}
			importCube(element, parent)
		}

		for (const uuid of struct.meshes ?? []) {
			const mesh = meshes?.find(m => m.uuid === uuid)
			if (!mesh) {
				console.warn(`Mesh not found: ${uuid}`)
				continue
			}
			importMesh(mesh, parent)
		}

		for (const bone of struct.bones ?? []) {
			importBone(bone, parent)
		}
	}

	function importBone(bone: UtilityModel.Bone, parent?: Group) {
		// Logic to import a single bone
		console.log(`Importing bone: ${bone.name}`)

		const group = new Group({
			name: bone.name,
			rotation: bone.rotation?.euler,
			origin: bone.rotation?.origin,
		}).init()
		group.addTo(parent)

		importStructure(bone.children, group)
	}

	importStructure(structure)
}

function importTextures(textures: UtilityModel.Json['textures'], projectPath = '') {
	const fs = requireNativeModule('fs', {
		message: 'Utility requires this module in order to import Utility Models.',
		optional: false,
	})
	if (!fs) {
		throw new Error('User denied access to native fs module')
	}

	const particleResourceLocation = textures.particle ?? ''

	const duplicateParticleTextureId = Object.entries(textures).find(([id, resourceLocation]) => {
		return id !== 'particle' && resourceLocation === particleResourceLocation
	})?.[0]

	if (duplicateParticleTextureId) {
		delete textures.particle
	}

	for (const [id, resourceLocation] of Object.entries(textures)) {
		console.log(`Importing texture: ${id} -> ${resourceLocation}`)
		const isParticle = id === 'particle' || duplicateParticleTextureId === id
		// Skin textures
		if (resourceLocation === SKIN_TEXTURE_NAME) {
			console.log(`Importing skin texture: ${id}`)
			new SkinTexture({
				name: id,
				id,
				particle: isParticle,
			}).add(false)
			continue
		}

		const parsedProjectPath = parsePackPath('assets', projectPath, true)
		if (!parsedProjectPath) {
			console.warn(
				`Cannot load texture ${id}: ${resourceLocation} - Project is not in a resource pack.`
			)
			new Texture({
				name: id,
				id,
				particle: isParticle,
			}).add(false)
			continue
		}

		const resourceLocationPath = resourceLocation.split(':').at(-1)!
		const path = PathModule.join(parsedProjectPath.namespacePath, resourceLocationPath + '.png')
		if (fs.existsSync(path)) {
			console.log(`Found texture file for ${id} under ${path}`)
			new Texture({
				name: id,
				id,
				particle: isParticle,
			})
				.fromPath(path)
				.add(false)
			continue
		}

		const textureFileName = resourceLocationPath.split(PathModule.sep).at(-1)!
		const relativePath = PathModule.join(
			PathModule.dirname(projectPath),
			textureFileName + '.png'
		)
		if (fs.existsSync(relativePath)) {
			console.log(`Found texture file for ${id} under ${relativePath}`)
			new Texture({
				name: id,
				id,
				particle: isParticle,
			})
				.fromPath(relativePath)
				.add(false)
		}

		console.warn(`Cannot find texture file for ${id}: ${resourceLocation}`)
		new Texture({
			name: id,
			id,
			particle: isParticle,
		}).add(false)
	}
}

function processBoneKeyframe(
	time: string,
	data: UtilityModel.KeyframeData,
	channel: 'position' | 'rotation' | 'scale'
) {
	const keyframe: KeyframeOptions = {
		channel: channel,
		time: parseFloat(time),
		data_points: [],
	}
	if (Array.isArray(data)) {
		keyframe.data_points.push({
			x: data[0],
			y: data[1],
			z: data[2],
		})
	} else {
		keyframe.data_points.push({
			x: data.pre[0],
			y: data.pre[1],
			z: data.pre[2],
		})
		if (!data.pre.equals(data.post)) {
			keyframe.data_points.push({
				x: data.post[0],
				y: data.post[1],
				z: data.post[2],
			})
		}
		keyframe.interpolation = data.lerp_mode
	}
	return keyframe
}

function processBoneKeyframes(bone: UtilityModel.AnimationBone) {
	const keyframes: KeyframeOptions[] = []
	for (const [time, data] of Object.entries(bone.position)) {
		keyframes.push(processBoneKeyframe(time, data, 'position'))
	}
	for (const [time, data] of Object.entries(bone.rotation)) {
		keyframes.push(processBoneKeyframe(time, data, 'rotation'))
	}
	for (const [time, data] of Object.entries(bone.scale)) {
		keyframes.push(processBoneKeyframe(time, data, 'scale'))
	}
	return keyframes
}

function importAnimations(animations: UtilityModel.Json['animations']) {
	for (const animation of animations ?? []) {
		console.log(`Importing animation: ${animation.name}`)

		const saveCopy: AnimationOptions = {
			name: animation.name,
			loop: animation.loop_mode,
			animators: {},
			length: animation.animation_length,
		}

		for (const [name, bone] of Object.entries(animation.bones ?? {})) {
			const animator = {
				name: name,
				type: 'bone',
				keyframes: [] as KeyframeOptions[],
			}
			animator.keyframes = processBoneKeyframes(bone)
			const group = Group.all.find(g => g.name === name)
			if (!group) {
				console.warn(`Unknown group ${name} in animation: ${animation.name}`)
				continue
			}
			saveCopy.animators[group.uuid] = animator
		}

		const anim = new Blockbench.Animation().extend(saveCopy).add()
		anim.loop_delay = animation.loop_delay.toString()
	}
}

export function createUtilityModelProjectFromUtilityModel(
	model: UtilityModel.Json,
	projectPath = ''
): void {
	model = updateUtilityModel(model)

	newProject(UTILITY_MODEL_PROJECT_FORMAT.get()!)

	Project!.export_path = projectPath

	Project!.box_uv = false

	if (model.texture_size) {
		Project!.texture_width = model.texture_size[0]
		Project!.texture_height = model.texture_size[1]
	}

	importTextures(model.textures, projectPath)
	buildOutliner(model.structure, model.elements, model.meshes)
	importAnimations(model.animations)

	if (model.front_gui_light) {
		Project!.front_gui_light = true
		// @ts-expect-error - Missing type
		DisplayMode.updateGUILight()
	}

	if (model.display) {
		DisplayMode.loadJSON(model.display)
	}

	Canvas.updateAll()
}

export function importUtilityModel() {
	Blockbench.import(
		{
			type: 'Utility Model',
			extensions: ['utility.json'],
		},
		files => {
			const file = files.at(0)
			if (!file) return

			console.group('Importing Utility Model as Utility Model Project')
			createUtilityModelProjectFromUtilityModel(
				JSON.parse(file.content.toString()),
				file.path
			)
			console.groupEnd()
		}
	)
}

export const IMPORT_UTILITY_MODEL_ACTION = registerAction(
	{ id: `utility-engine:import-utility-model` },
	{
		name: localize('action.import_utility_model.label'),
		icon: Icon,
		click() {
			importUtilityModel()
		},
	}
)
IMPORT_UTILITY_MODEL_ACTION.onCreated(action => {
	MenuBar.addAction(action, 'file.import.0')
})
