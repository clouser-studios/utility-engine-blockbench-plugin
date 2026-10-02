import type { CollectionOptions } from '@blockbench-types/generated/outliner/collections.js'
import type { UtilityModelAnimationOptions } from '@utility/mods/utilityModelAnimationMod.ts'
import type { ISkinTextureData } from '@utility/textures/skin-texture/index.ts'
import type { UTILITY_MODEL_PROJECT_FORMAT_ID } from '../index.ts'
import type { v0_0_9 } from './0.0.9.ts'

export namespace v0_0_10 {
	export interface Settings {
		model_identifier: string
	}

	export type UtilityDisplaySettings = Partial<DisplaySlotOptions> & {
		left_arm_rotation?: ArrayVector3
		left_arm_rotation_when_offhand_occupied?: ArrayVector3
		right_arm_rotation?: ArrayVector3
		right_arm_rotation_when_offhand_occupied?: ArrayVector3
		overrides?: string
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
	upgrade(model: v0_0_9.Json): v0_0_10.Json {
		console.groupCollapsed('Updating utility model to 0.0.10')
		const fixed = JSON.parse(JSON.stringify(model)) as v0_0_10.Json

		// turn anim.path into anim.group
		for (const anim of fixed.animations ?? []) {
			anim.group_name = anim.path
		}

		fixed.meta.format_version = '0.0.10'
		console.groupEnd()
		return fixed
	},
}
