export namespace v0_0_1 {
	export interface IMeshFaceSaveCopy {
		uv: Record<string, number[]>
		vertices: string[]
		texture: string
	}

	export interface IMeshSaveCopy {
		name: string
		uuid: string
		rotation: ArrayVector3
		origin: ArrayVector3
		vertices: Record<string, ArrayVector3>
		faces: Record<string, IMeshFaceSaveCopy>
	}

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
		enableBackfaceCulling?: boolean
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
		enableBackfaceCulling?: boolean
	}

	export type KeyframeData =
		| ArrayVector3
		| {
				pre: ArrayVector3
				post: ArrayVector3
				lerp_mode: string
		  }

	export interface IAnimationBone {
		position: Record<string | number, KeyframeData>
		rotation: Record<string | number, KeyframeData>
		scale: Record<string | number, KeyframeData>
	}

	export interface IAnimation {
		name: string
		animation_length: number
		loop_mode: 'once' | 'loop' | 'hold'
		loop_delay: number | string
		bones: Record<string, IAnimationBone>
	}

	export interface IDisplay {
		translation?: ArrayVector3
		rotation?: ArrayVector3
		scale?: ArrayVector3
		mirror?: [boolean, boolean, boolean]
		left_arm_rotation?: ArrayVector3
		left_arm_rotation_when_offhand_occupied?: ArrayVector3
		right_arm_rotation?: ArrayVector3
		right_arm_rotation_when_offhand_occupied?: ArrayVector3
	}

	export type DisplayContainer = Record<DisplaySlotName, IDisplay>

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

	export interface IUtilityModelJSON {
		__comment?: string
		format_version: string
		texture_size: ArrayVector2
		textures: Record<string, string> & {
			particle?: string
		}
		elements: IElement[]
		structure: IStructure
		meshes?: IMesh[]
		animations?: IAnimation[]
		display?: DisplayContainer
	}
}

export default {
	upgrade(model: any): v0_0_1.IUtilityModelJSON {
		console.groupCollapsed('Updating utility model to 0.0.1')

		// As this is the first version the DFU knows of, there is nothing to upgrade.
		// However, we should make sure the format version is correct.
		model.format_version = '0.0.1'

		console.groupEnd()
		return model as v0_0_1.IUtilityModelJSON
	},
}
