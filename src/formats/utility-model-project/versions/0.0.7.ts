import type { CollectionOptions } from '@blockbench-types/generated/outliner/collections.js'
import type { UtilityModelAnimationOptions } from '@utility/mods/utilityModelAnimationMod.ts'
import type { ISkinTextureData } from '@utility/textures/skin-texture/index.ts'
import type { UTILITY_MODEL_PROJECT_FORMAT_ID } from '../index.ts'
import type { v0_0_5 } from './0.0.5.ts'

export namespace v0_0_7 {
	export interface Settings {
		model_identifier: string
	}

	export interface UtilityDisplaySettings {
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
		textures: Array<TextureData | ISkinTextureData>
		animations: UtilityModelAnimationOptions[]
		animation_controllers?: AnimationControllerOptions[]
		animation_variable_placeholders: string
		backgrounds?: Record<string, any>
		collections?: CollectionOptions[]
		texture_groups?: Array<Omit<TextureGroupOptions, 'is_material'>>
		front_gui_light?: boolean
		display_settings?: Record<DisplaySlotName, DisplaySettings>
		utility_display_settings?: Record<DisplaySlotName, UtilityDisplaySettings>
	}
}

export default {
	upgrade(model: v0_0_5.UtilityProjectJSON): v0_0_7.Json {
		console.groupCollapsed('Updating utility model to 0.0.7')
		const fixed = JSON.parse(JSON.stringify(model)) as v0_0_7.Json

		fixed.meta.project_save_path = model.meta.save_location

		fixed.meta.format_version = '0.0.7'
		console.groupEnd()
		return fixed
	},
}
