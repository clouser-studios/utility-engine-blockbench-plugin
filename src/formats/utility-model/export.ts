import Icon from '@assets/icons/nobackground.png'
import { currentFormatIsUtilityModelProject } from '@utility/formats/utility-model-project/index.ts'
import { SKIN_TEXTURE_NAME, SkinTexture } from '@utility/textures/skin-texture/index.ts'
import { localize } from '@utility/util/lang.ts'
import { log } from '@utility/util/log.ts'
import { parsePackPath } from '@utility/util/minecraftUtil.ts'
import { BB } from '@utility/util/blockbenchCompat.ts'
import { registerDeletableHandlerPatch } from 'blockbench-patch-manager'
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

const BILLBOARD_MODE_TO_FILE: Record<string, UtilityModel.IBillboard['billboard_mode']> = {
	lookat: 'look_at',
	lookat_y: 'look_at_y',
	rotate: 'rotate',
	rotate_y: 'rotate_y',
}

function renderLocator(locator: Locator): UtilityModel.ILocator {
	return {
		name: locator.name,
		uuid: locator.uuid,
		position: [...locator.position],
	}
}

function renderBillboard(billboard: Billboard): UtilityModel.IBillboard {
	const rendered: UtilityModel.IBillboard = {
		name: billboard.name,
		uuid: billboard.uuid,
		position: [...billboard.position] as ArrayVector3,
		size: [...billboard.size] as ArrayVector2,
		offset: [...billboard.offset] as ArrayVector2,
		billboard_mode: BILLBOARD_MODE_TO_FILE[billboard.facing_mode] ?? 'look_at',
	}

	const face = billboard.faces.front
	if (face?.texture) {
		const renderedFace = {} as UtilityModel.ElementFace
		if (face.enabled) {
			renderedFace.uv = face.uv
				.slice()
				.map((v, i) => (v * 16) / UVEditor.getResolution(i % 2))
		}
		if (face.rotation) renderedFace.rotation = face.rotation
		const texture = face.getTexture()
		if (!texture) throw new Error('Texture not found')
		renderedFace.texture = '#' + texture.id
		if (face.cullface) renderedFace.cullface = face.cullface
		if (face.tint >= 0) renderedFace.tintindex = face.tint
		rendered.face = renderedFace
	}

	return rendered
}

function renderBoundingBox(box: BoundingBox): UtilityModel.IBoundingBox {
	const rendered: UtilityModel.IBoundingBox = {
		name: box.name,
		uuid: box.uuid,
		from: [...box.from],
		to: [...box.to],
	}
	if (box.function?.length) rendered.function = [...box.function]
	return rendered
}

function renderArmatureBone(bone: ArmatureBone): UtilityModel.IArmatureBone {
	const rendered: UtilityModel.IArmatureBone = {
		name: bone.name,
		uuid: bone.uuid,
		origin: [...bone.origin],
		rotation: [...bone.rotation],
		length: bone.length,
		width: bone.width,
	}
	if (Object.keys(bone.vertex_weights ?? {}).length) {
		rendered.vertex_weights = { ...bone.vertex_weights }
	}
	const childBones = bone.children.filter((c): c is ArmatureBone => c instanceof ArmatureBone)
	if (childBones.length) {
		rendered.children = childBones.map(renderArmatureBone)
	}
	return rendered
}

function renderArmature(armature: Armature): UtilityModel.IArmature {
	const rootBones = armature.children.filter((c): c is ArmatureBone => c instanceof ArmatureBone)
	const strayChildren = armature.children.filter(c => !(c instanceof ArmatureBone))
	if (strayChildren.length) {
		console.warn(
			`Armature '${armature.name}' has children that aren't attached to a bone. These will not be exported:`,
			strayChildren
		)
	}
	return {
		name: armature.name,
		uuid: armature.uuid,
		bones: rootBones.map(renderArmatureBone),
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
		} else if (child instanceof Locator) {
			const locator = renderLocator(child)
			model.locators ??= []
			model.locators.push(locator)
			structure.locators ??= []
			structure.locators.push(locator.uuid)
		} else if (child instanceof Billboard) {
			const billboard = renderBillboard(child)
			model.billboards ??= []
			model.billboards.push(billboard)
			structure.billboards ??= []
			structure.billboards.push(billboard.uuid)
		} else if (child instanceof BoundingBox) {
			const boundingBox = renderBoundingBox(child)
			model.bounding_boxes ??= []
			model.bounding_boxes.push(boundingBox)
			structure.bounding_boxes ??= []
			structure.bounding_boxes.push(boundingBox.uuid)
		} else if (child instanceof Armature) {
			const armature = renderArmature(child)
			model.armatures ??= []
			model.armatures.push(armature)
			structure.armatures ??= []
			structure.armatures.push(armature.uuid)
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
	for (const animation of BB.Animation.all) {
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
	for (const [key, settings] of Object.entries(Project!.display_settings) as Array<
		[DisplaySlotName, DisplaySlot]
	>) {
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
			custom_writer: (content: string | ArrayBuffer | Blob, chosenPath: string) => {
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

export const EXPORT_UTILITY_MODEL_AS_ACTION = registerDeletableHandlerPatch({
	id: `utility-engine:action/export-utility-model-as`,
	create() {
		const action = new Action(`utility-engine:action/export-utility-model-as`, {
			name: localize('action.export_utility_model_as.label'),
			icon: Icon,
			condition: () => currentFormatIsUtilityModelProject(),
			click() {
				exportUtilityModel()
			},
		})

		MenuBar.addAction(action, 'file.export.1')

		return action
	},
})

export const EXPORT_UTILITY_MODEL_ACTION = registerDeletableHandlerPatch({
	id: `utility-engine:action/export-utility-model`,
	create() {
		const action = new Action(`utility-engine:action/export-utility-model`, {
			name: localize('action.export_utility_model.label'),
			icon: Icon,
			condition: () => currentFormatIsUtilityModelProject(),
			click() {
				exportUtilityModel(Project!.export_path)
			},
		})

		MenuBar.addAction(action, 'file.export.0')
		return action
	},
})
