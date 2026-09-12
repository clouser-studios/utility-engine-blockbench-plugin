export namespace v0_0_2 {
	export interface MeshFaceSaveCopy {
		uv: Record<string, number[]>
		vertices: string[]
		texture: string
	}

	export interface MeshSaveCopy {
		name: string
		uuid: string
		rotation: ArrayVector3
		origin: ArrayVector3
		vertices: Record<string, ArrayVector3>
		faces: Record<string, MeshFaceSaveCopy>
	}

	export interface ElementFace {
		uv: number[]
		rotation?: number
		texture: string
		cullface?: string
		tintindex?: number
	}

	export interface Element {
		name: string
		uuid: string
		from: number[]
		to: number[]
		shade?: boolean
		rotation?: {
			euler: ArrayVector3
			origin: ArrayVector3
		}
		faces?: Record<string, ElementFace>
		enableBackfaceCulling?: boolean
	}

	export interface MeshFace {
		uv: Record<string, ArrayVector2>
		vertices: string[]
		texture: number
	}

	export interface Mesh {
		name: string
		uuid: string
		rotation?: {
			euler: ArrayVector3
			origin: ArrayVector3
		}
		vertices: Record<string, ArrayVector3>
		faces: Record<string, MeshFaceSaveCopy>
		enableBackfaceCulling?: boolean
	}

	export interface ILocator {
		name: string
		uuid: string
		position: ArrayVector3
	}

	export interface IBillboard {
		name: string
		uuid: string
		position: ArrayVector3
		size: ArrayVector2
		offset: ArrayVector2
		billboard_mode: 'look_at' | 'look_at_y' | 'rotate' | 'rotate_y'
		/** Omitted if the billboard has no texture assigned, same as `Element.faces`. */
		face?: ElementFace
	}

	export type BoundingBoxFunction = 'collision' | 'hitbox'

	export interface IBoundingBox {
		name: string
		uuid: string
		from: ArrayVector3
		to: ArrayVector3
		function?: BoundingBoxFunction[]
	}

	export interface IArmatureBone {
		name: string
		uuid: string
		origin: ArrayVector3
		rotation: ArrayVector3
		length: number
		width: number
		/** Keyed the same way Blockbench keys them internally: `<mesh.uuid[0:6]>:<vertex_key>`. */
		vertex_weights?: Record<string, number>
		children?: IArmatureBone[]
	}

	export interface IArmature {
		name: string
		uuid: string
		bones: IArmatureBone[]
	}

	export type KeyframeData =
		| ArrayVector3
		| {
				pre: ArrayVector3
				post: ArrayVector3
				lerp_mode: string
		  }

	export interface AnimationBone {
		/** A bare vector means "constant for the whole animation", same as Bedrock's own shorthand. */
		position?: Record<string | number, KeyframeData> | ArrayVector3
		rotation?: Record<string | number, KeyframeData> | ArrayVector3
		scale?: Record<string | number, KeyframeData> | ArrayVector3
	}

	export interface Animation {
		name: string
		animation_length: number
		loop_mode: 'once' | 'loop' | 'hold'
		loop_delay: number | string
		bones: Record<string, AnimationBone>
	}

	export interface Display {
		translation?: ArrayVector3
		rotation?: ArrayVector3
		scale?: ArrayVector3
		mirror?: [boolean, boolean, boolean]
		left_arm_rotation?: ArrayVector3
		left_arm_rotation_when_offhand_occupied?: ArrayVector3
		right_arm_rotation?: ArrayVector3
		right_arm_rotation_when_offhand_occupied?: ArrayVector3
	}

	export type DisplayContainer = Record<DisplaySlotName, Display>

	export interface Bone {
		name: string
		rotation?: {
			euler: ArrayVector3
			origin: ArrayVector3
		}
		children: Structure
	}

	export interface Structure {
		elements?: string[]
		meshes?: string[]
		locators?: string[]
		billboards?: string[]
		bounding_boxes?: string[]
		armatures?: string[]
		bones?: Bone[]
	}

	export interface Json {
		__comment?: string
		format_version: string
		texture_size: ArrayVector2
		textures: Record<string, string> & {
			particle?: string
		}
		elements: Element[]
		structure: Structure
		meshes?: Mesh[]
		locators?: ILocator[]
		billboards?: IBillboard[]
		bounding_boxes?: IBoundingBox[]
		armatures?: IArmature[]
		animations?: Animation[]
		front_gui_light?: boolean
		display?: DisplayContainer
	}
}

export default {
	upgrade(model: any): v0_0_2.Json {
		console.groupCollapsed('Updating utility model to 0.0.2')
		const fixed = JSON.parse(JSON.stringify(model)) as v0_0_2.Json

		fixed.format_version = '0.0.2'

		console.groupEnd()
		return fixed
	},
}
