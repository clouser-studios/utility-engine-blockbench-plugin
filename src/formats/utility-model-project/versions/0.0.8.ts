import type { UtilityModelAnimationOptions } from '@utility/mods/utilityModelAnimationMod'
import type { ISkinTextureData } from '@utility/textures/skin-texture'
import type { UTILITY_MODEL_PROJECT_FORMAT_ID } from '..'
import type { v0_0_7 } from './0.0.7'

export namespace v0_0_8 {
	export interface Settings {
		model_identifier: string
	}

	export type UtilityDisplaySettings = Partial<DisplaySettings> & {
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
		display_settings?: Partial<Record<DisplaySlotName, UtilityDisplaySettings>>
	}
}

export default {
	upgrade(model: v0_0_7.Json): v0_0_8.Json {
		console.groupCollapsed('Updating utility model to 0.0.8')
		const fixed = JSON.parse(JSON.stringify(model)) as v0_0_8.Json

		// Update to new merged display settings
		console.log(
			'Fixing display settings...',
			model.display_settings,
			model.utility_display_settings
		)

		model.display_settings ??= {} as NonNullable<v0_0_7.Json['display_settings']>
		model.utility_display_settings ??= {} as NonNullable<
			v0_0_7.Json['utility_display_settings']
		>

		const mergedDisplaySettings: v0_0_8.Json['display_settings'] = {}
		for (const slot of DisplayMode.slots) {
			mergedDisplaySettings[slot] = {}

			Object.assign(mergedDisplaySettings[slot], model.display_settings[slot])
			Object.assign(mergedDisplaySettings[slot], model.utility_display_settings[slot])

			if (Object.keys(mergedDisplaySettings[slot]!).length === 0) {
				delete mergedDisplaySettings[slot]
			}
		}
		console.log('Merged display settings:', mergedDisplaySettings)
		fixed.display_settings = mergedDisplaySettings
		// @ts-expect-error - Removed in 0.0.8
		delete fixed.utility_display_settings

		fixed.meta.format_version = '0.0.8'
		console.groupEnd()
		return fixed
	},
}
