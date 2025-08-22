import type { UtilityModelAnimationOptions } from '@utility/mods/utilityModelAnimationMod'
import type { ISkinTextureData } from '@utility/textures/skin-texture'
import type { v0_0_5 } from './0.0.5'

export namespace v0_0_7 {
	export interface IUtilityProjectSettings {
		model_identifier: string
	}

	export interface IUtilityDisplaySettings {
		left_arm_rotation?: ArrayVector3
		right_arm_rotation?: ArrayVector3
	}

	export interface IUtilityProjectJSON {
		meta: {
			format: `utility-engine:utility_model`
			format_version: '0.0.7'
			uuid: string
			box_uv?: boolean
			backup?: boolean
			project_save_path?: string
			export_path?: string
		}
		options: IUtilityProjectSettings

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
		display_settings?: Record<DisplaySlotName, DisplaySettings>
		utility_display_settings?: Record<DisplaySlotName, IUtilityDisplaySettings>
	}
}

export default {
	upgrade(model: v0_0_5.IUtilityProjectJSON): v0_0_7.IUtilityProjectJSON {
		console.groupCollapsed('Updating utility model to 0.0.7')
		const fixed = JSON.parse(JSON.stringify(model)) as v0_0_7.IUtilityProjectJSON

		fixed.meta.project_save_path = model.meta.save_location

		fixed.meta.format_version = '0.0.7'
		console.groupEnd()
		return fixed
	},
}
