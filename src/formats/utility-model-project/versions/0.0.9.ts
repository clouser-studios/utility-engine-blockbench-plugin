import type { CollectionOptions } from '@blockbench-types/generated/outliner/collections.js'
import type { UtilityModelAnimationOptions } from '@utility/mods/utilityModelAnimationMod.ts'
import type { ISkinTextureData } from '@utility/textures/skin-texture/index.ts'
import type { UTILITY_MODEL_PROJECT_FORMAT_ID } from '../index.ts'
import type { v0_0_8 } from './0.0.8.ts'

export namespace v0_0_9 {
	export interface Settings {
		model_identifier: string
	}

	export type UtilityDisplaySettings = Partial<DisplaySlotOptions> & {
		left_arm_rotation?: ArrayVector3
		left_arm_rotation_when_offhand_occupied?: ArrayVector3
		right_arm_rotation?: ArrayVector3
		right_arm_rotation_when_offhand_occupied?: ArrayVector3
	}

	export interface Json {
		meta: {
			format: typeof UTILITY_MODEL_PROJECT_FORMAT_ID
			format_version: string
			uuid: string
			box_uv?: boolean
			backup?: boolean
			project_save_path?: string
			export_path?: string
		}
		options: Settings

		resolution: {
			width: number
			height: number
		}

		elements: any[]
		outliner: any[]
		groups: any[]
		textures: Array<TextureData | ISkinTextureData>
		animations: UtilityModelAnimationOptions[]
		animation_controllers?: AnimationControllerOptions[]
		animation_variable_placeholders: string
		backgrounds?: Record<string, any>
		collections?: CollectionOptions[]
		texture_groups?: Array<Omit<TextureGroupOptions, 'is_material'>>
		front_gui_light?: 'front'
		display_settings?: Partial<Record<DisplaySlotName, UtilityDisplaySettings>>
	}
}

export default {
	upgrade(model: v0_0_8.Json): v0_0_9.Json {
		console.groupCollapsed('Updating utility model to 0.0.9')
		const fixed = JSON.parse(JSON.stringify(model)) as v0_0_9.Json

		// Invert pos X axis and rot X & Y axis in animations
		for (const animation of fixed.animations ?? []) {
			if (!animation.animators) continue
			// Raw keyframe JSON from the file - data point axes are molang strings or numbers.
			for (const animator of Object.values(animation.animators) as unknown as Array<{
				keyframes: Array<{
					channel: string
					uuid?: string
					data_points: Array<{ x: any; y: any; z: any }>
				}>
			}>) {
				for (const keyframe of animator.keyframes) {
					if (keyframe.channel === 'rotation') {
						for (const dataPoint of keyframe.data_points) {
							dataPoint.x = invertMolang(dataPoint.x)
							dataPoint.y = invertMolang(dataPoint.y)
							console.log(
								'Inverted rotation X & Y axis for keyframe',
								keyframe.uuid,
								'in animator',
								animator
							)
						}
					}
					if (keyframe.channel === 'position') {
						for (const dataPoint of keyframe.data_points) {
							dataPoint.x = invertMolang(dataPoint.x)
							console.log(
								'Inverted position X axis for keyframe',
								keyframe.uuid,
								'in animator',
								animator
							)
						}
					}
				}
			}
		}

		fixed.meta.format_version = '0.0.9'
		console.groupEnd()
		return fixed
	},
}
