import type { ISkinTextureData } from '../../../textures/skinTexture'

export namespace v0_0_5 {
	export interface IUtilityProjectSettings {
		model_identifier: string
	}

	export interface IUtilityProjectJSON {
		meta: {
			format: `utility-engine:utility_model`
			format_version: '0.0.5'
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
		display_settings?: ModelProject['display_settings']
	}
}

export default {
	upgrade(model: any): v0_0_5.IUtilityProjectJSON {
		console.groupCollapsed('Updating utility model to 0.0.5')
		const fixed = JSON.parse(JSON.stringify(model)) as v0_0_5.IUtilityProjectJSON

		// As this is the first version the DFU knows of, there is nothing to upgrade.
		// However, we should make sure the format version is correct.
		fixed.meta.format_version = '0.0.5'

		console.groupEnd()
		return fixed
	},
}
