import Icon from '@assets/icons/nobackground.png'
import { UTILITY_MODEL_PROJECT_FORMAT } from '@utility/formats/utility-model-project/index.ts'
import { SKIN_TEXTURE_NAME, SkinTexture } from '@utility/textures/skin-texture/index.ts'
import { BB, displayModeCompat } from '@utility/util/blockbenchCompat.ts'
import { localize } from '@utility/util/lang.ts'
import { parsePackPath } from '@utility/util/minecraftUtil.ts'
import { registerDeletableHandlerPatch } from 'blockbench-patch-manager'
import { updateUtilityModel } from './dfu.ts'
import { type UtilityModel } from './versions/latest.ts'

export class ImportError extends Error {
	constructor(key: string, ...args: string[]) {
		super(localize(key, ...args))
		this.name = 'ImportError'
	}
}

const BILLBOARD_MODE_FROM_FILE: Record<UtilityModel.IBillboard['billboard_mode'], string> = {
	look_at: 'lookat',
	look_at_y: 'lookat_y',
	rotate: 'rotate',
	rotate_y: 'rotate_y',
}

/**
 * Resolves a face's texture reference (written as `#<id>` on export) to the matching
 * loaded {@link Texture}. Matches the id exactly - `endsWith` would let `#1` match
 * texture `11`.
 */
function resolveFaceTexture(ref: string): Texture | undefined {
	const id = ref.replace(/^#/, '')
	return Texture.all.find(t => t.id === id)
}

/**
 * Imports the structure, elements, meshes, locators, billboards, bounding boxes, and
 * armatures of a utility model.
 */
function buildOutliner(
	structure: UtilityModel.Structure,
	elements?: UtilityModel.Element[],
	meshes?: UtilityModel.Mesh[],
	locators?: UtilityModel.ILocator[],
	billboards?: UtilityModel.IBillboard[],
	boundingBoxes?: UtilityModel.IBoundingBox[],
	armatures?: UtilityModel.IArmature[]
) {
	function importCube(element: UtilityModel.Element, parent?: Group) {
		for (const [name, face] of Object.entries(element.faces ?? {}) as Array<
			[string, Omit<UtilityModel.ElementFace, 'texture'> & { texture: string | Texture }]
		>) {
			if (face.texture === undefined) continue
			const texture = resolveFaceTexture(face.texture as string)
			if (!texture) {
				console.warn(`Texture not found for face: ${name} in element ${element.uuid}`)
				continue
			}
			face.texture = texture
			face.uv = face.uv.map((v, i) => (v / 16) * UVEditor.getResolution(i % 2))
		}

		const baseCube = new Cube(element as any)

		if (typeof element.rotation == 'object') {
			if (element.rotation.origin) {
				baseCube.extend({ origin: element.rotation.origin })
			}
			if (element.rotation.euler) {
				baseCube.extend({ rotation: element.rotation.euler })
			}
		}

		baseCube.init()
		baseCube.addTo(parent)
	}

	function importMesh(mesh: UtilityModel.Mesh, parent?: Group) {
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
			const texture = resolveFaceTexture(face.texture as string)
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

	function importLocator(locator: UtilityModel.ILocator, parent?: Group) {
		const newLocator = new Locator(
			{
				name: locator.name,
				position: locator.position,
			},
			locator.uuid
		).init()
		newLocator.addTo(parent)
	}

	function importBillboard(billboard: UtilityModel.IBillboard, parent?: Group) {
		const faceData: any = {}
		if (billboard.face) {
			if (billboard.face.uv) {
				faceData.uv = billboard.face.uv.map(
					(v, i) => (v / 16) * UVEditor.getResolution(i % 2)
				)
			}
			if (billboard.face.rotation) faceData.rotation = billboard.face.rotation
			if (billboard.face.texture !== undefined) {
				const texture = resolveFaceTexture(billboard.face.texture)
				if (texture) {
					faceData.texture = texture
				} else {
					console.warn(`Texture not found for billboard face in ${billboard.uuid}`)
				}
			}
		}

		const newBillboard = new Billboard(
			{
				name: billboard.name,
				position: billboard.position,
				size: billboard.size,
				offset: billboard.offset,
				facing_mode: BILLBOARD_MODE_FROM_FILE[billboard.billboard_mode] ?? 'lookat',
				faces: { front: faceData },
			},
			billboard.uuid
		).init()
		newBillboard.addTo(parent)
	}

	function importBoundingBox(box: UtilityModel.IBoundingBox, parent?: Group) {
		const newBox = new BoundingBox(
			{
				name: box.name,
				from: box.from,
				to: box.to,
				function: box.function,
			},
			box.uuid
		).init()
		newBox.addTo(parent)
	}

	function importArmatureBone(bone: UtilityModel.IArmatureBone, parent: Armature | ArmatureBone) {
		const newBone = new ArmatureBone(
			{
				name: bone.name,
				origin: bone.origin,
				rotation: bone.rotation,
				length: bone.length,
				width: bone.width,
				vertex_weights: bone.vertex_weights,
			},
			bone.uuid
		).init()
		newBone.addTo(parent)

		for (const child of bone.children ?? []) {
			importArmatureBone(child, newBone)
		}
	}

	function importArmature(armature: UtilityModel.IArmature, parent?: Group) {
		const newArmature = new Armature({ name: armature.name }, armature.uuid).init()
		newArmature.addTo(parent)

		for (const bone of armature.bones) {
			importArmatureBone(bone, newArmature)
		}
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

		for (const uuid of struct.locators ?? []) {
			const locator = locators?.find(l => l.uuid === uuid)
			if (!locator) {
				console.warn(`Locator not found: ${uuid}`)
				continue
			}
			importLocator(locator, parent)
		}

		for (const uuid of struct.billboards ?? []) {
			const billboard = billboards?.find(b => b.uuid === uuid)
			if (!billboard) {
				console.warn(`Billboard not found: ${uuid}`)
				continue
			}
			importBillboard(billboard, parent)
		}

		for (const uuid of struct.bounding_boxes ?? []) {
			const boundingBox = boundingBoxes?.find(b => b.uuid === uuid)
			if (!boundingBox) {
				console.warn(`Bounding box not found: ${uuid}`)
				continue
			}
			importBoundingBox(boundingBox, parent)
		}

		for (const uuid of struct.armatures ?? []) {
			const armature = armatures?.find(a => a.uuid === uuid)
			if (!armature) {
				console.warn(`Armature not found: ${uuid}`)
				continue
			}
			importArmature(armature, parent)
		}

		for (const bone of struct.bones ?? []) {
			importBone(bone, parent)
		}
	}

	function importBone(bone: UtilityModel.Bone, parent?: Group) {
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

		const resourceLocationPath = 'textures/' + resourceLocation.split(':').at(-1)!
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
			continue
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
		if (data.pre != undefined) {
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
		} else if (data.post != undefined) {
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
	for (const [time, data] of Object.entries(bone.position ?? {})) {
		keyframes.push(processBoneKeyframe(time, data, 'position'))
	}
	for (const [time, data] of Object.entries(bone.rotation ?? {})) {
		keyframes.push(processBoneKeyframe(time, data, 'rotation'))
	}
	for (const [time, data] of Object.entries(bone.scale ?? {})) {
		keyframes.push(processBoneKeyframe(time, data, 'scale'))
	}
	return keyframes
}

function importAnimations(animations: UtilityModel.Json['animations']) {
	for (const animation of animations ?? []) {
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

		const anim = new BB.Animation().extend(saveCopy).add()
		anim.loop_delay = (animation.loop_delay ?? 0).toString()
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

	Project!.model_identifier = PathModule.basename(projectPath, '.utility.json')

	if (model.texture_size) {
		Project!.texture_width = model.texture_size[0]
		Project!.texture_height = model.texture_size[1]
	}

	importTextures(model.textures, projectPath)
	buildOutliner(
		model.structure,
		model.elements,
		model.meshes,
		model.locators,
		model.billboards,
		model.bounding_boxes,
		model.armatures
	)
	importAnimations(model.animations)

	if (model.front_gui_light) {
		Project!.front_gui_light = true
		// @ts-expect-error - Missing type
		DisplayMode.updateGUILight()
	}

	if (model.display) {
		displayModeCompat.loadJSON(model.display)
	}

	Canvas.updateAll()
}

export function importUtilityModelFile(file: Filesystem.FileResult) {
	console.group('Importing Utility Model as Utility Model Project')
	createUtilityModelProjectFromUtilityModel(JSON.parse(file.content!.toString()), file.path)
	console.groupEnd()
}

export function importUtilityModel() {
	Blockbench.import(
		{
			type: 'Utility Model',
			extensions: ['utility.json'],
		},
		(files: Filesystem.FileResult[]) => {
			const file = files.at(0)
			if (!file) return
			importUtilityModelFile(file)
		}
	)
}

export const IMPORT_UTILITY_MODEL_ACTION = registerDeletableHandlerPatch({
	id: `utility-engine:action/import-utility-model`,
	create() {
		const action = new Action(`utility-engine:import-utility-model`, {
			name: localize('action.import_utility_model.label'),
			icon: Icon,
			click() {
				importUtilityModel()
			},
		})

		MenuBar.addAction(action, 'file.import.0')

		return action
	},
})
