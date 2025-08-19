import type { ISkinTextureData } from '../../../textures/skinTexture'

export namespace v0_0_6 {
	export interface IUtilityProjectSettings {
		model_identifier: string
	}

	export interface IDisplaySetting {
		translation: ArrayVector3
		rotation: ArrayVector3
		scale: ArrayVector3
		mirror: [boolean, boolean, boolean]
		left_arm?: ArrayVector3
		right_arm?: ArrayVector3
		export?(...args: any[]): any
	}

	export interface IUtilityProjectJSON {
		meta: {
			format: `utility-engine:utility_model`
			format_version: '0.0.6'
			uuid: string
			box_uv?: boolean
			backup?: boolean
			save_location?: string
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
		animations: AnimationOptions[]
		animation_controllers?: AnimationControllerOptions[]
		animation_variable_placeholders: string
		backgrounds?: Record<string, any>
		collections?: CollectionOptions[]
		texture_groups?: Array<Omit<TextureGroupOptions, 'is_material'>>
		display_settings?: Record<DisplaySlotNames, IDisplaySetting>
	}
}

export default {
	upgrade(model: any): v0_0_6.IUtilityProjectJSON {
		console.groupCollapsed('Updating utility model to 0.0.6')

		// Nothing to do here.
		model.meta.format_version = '0.0.6'

		console.groupEnd()
		return model as v0_0_6.IUtilityProjectJSON
	},
}
