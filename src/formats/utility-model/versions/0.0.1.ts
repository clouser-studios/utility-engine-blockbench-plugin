export namespace v0_0_1 {
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

	export type KeyframeData =
		| ArrayVector3
		| {
				pre: ArrayVector3
				post: ArrayVector3
				lerp_mode: string
		  }

	export interface AnimationBone {
		position: Record<string | number, KeyframeData>
		rotation: Record<string | number, KeyframeData>
		scale: Record<string | number, KeyframeData>
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
		animations?: Animation[]
		front_gui_light?: boolean
		display?: DisplayContainer
	}
}

export default {
	upgrade(model: any): v0_0_1.Json {
		console.groupCollapsed('Updating utility model to 0.0.1')
		const fixed = JSON.parse(JSON.stringify(model)) as v0_0_1.Json

		// As this is the first version the DFU knows of, there is nothing to upgrade.
		// However, we should make sure the format version is correct.
		fixed.format_version = '0.0.1'

		console.groupEnd()
		return fixed
	},
}
