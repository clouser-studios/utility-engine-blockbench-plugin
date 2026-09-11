export namespace v0_0_3 {
	export interface BaseElement {
		skin_model?: 'wide' | 'slim'
		render_passes?: string[]
	}

	export interface MeshFaceSaveCopy {
		uv: Record<string, number[]>
		vertices: string[]
		texture: string
	}

	export interface MeshSaveCopy extends BaseElement {
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

	export interface Element extends BaseElement {
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

	export interface Mesh extends BaseElement {
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
		overrides?: string
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
	upgrade(model: any): v0_0_3.Json {
		console.groupCollapsed('Updating utility model to 0.0.2')
		const fixed = JSON.parse(JSON.stringify(model)) as v0_0_3.Json

		// Invert pos X axis and rot X & Y axis in animations
		for (const animation of fixed.animations ?? []) {
			if (!animation.bones) continue
			for (const bone of Object.values(animation.bones)) {
				if (bone.rotation) {
					for (const value of Object.values(bone.rotation)) {
						if (Array.isArray(value)) {
							value[0] = invertMolang(value[0])
							value[1] = invertMolang(value[1])
						} else if (typeof value === 'object') {
							if (value.pre != undefined) {
								value.pre[0] = invertMolang(value.pre[0])
								value.pre[1] = invertMolang(value.pre[1])
							}
							if (value.post != undefined) {
								value.post[0] = invertMolang(value.post[0])
								value.post[1] = invertMolang(value.post[1])
							}
						}
					}
				}
				if (bone.position) {
					for (const value of Object.values(bone.position)) {
						if (Array.isArray(value)) {
							value[0] = invertMolang(value[0])
						} else if (typeof value === 'object') {
							if (value.pre != undefined) {
								value.pre[0] = invertMolang(value.pre[0])
							}
							if (value.post != undefined) {
								value.post[0] = invertMolang(value.post[0])
							}
						}
					}
				}
			}
		}

		for (const element of fixed.elements) {
			// @ts-expect-error
			if (element.metadata?.wide_skin_only) {
				element.skin_model = 'wide'
				// @ts-expect-error
			} else if (element.metadata?.slim_skin_only) {
				element.skin_model = 'slim'
			}
			// @ts-expect-error
			delete element.metadata
		}

		fixed.format_version = '0.0.2'

		console.groupEnd()
		return fixed
	},
}
