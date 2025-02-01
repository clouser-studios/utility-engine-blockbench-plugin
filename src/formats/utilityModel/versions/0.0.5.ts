import type { PACKAGE } from '../../../package'
import type { ISkinTextureData } from '../../../textures/skinTexture'

namespace v0_0_5 {
	interface IUtilityModelSettings {
		model_identifier: string
	}

	export interface IUtilityModelJSON {
		meta: {
			format: `${typeof PACKAGE.name}:utility_model`
			format_version: '0.0.5'
			uuid: string
			box_uv?: boolean
			backup?: boolean
			save_location?: string
		}
		options: IUtilityModelSettings

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
	}
}

export default {
	upgrade(model: any): v0_0_5.IUtilityModelJSON {
		console.groupCollapsed('Updating utility model to 0.0.5')

		// As this is the first version the DFU knows of, there is nothing to upgrade.
		// However, we should make sure the format version is correct.
		model.meta.format_version = '0.0.5'

		console.groupEnd()
		return model as v0_0_5.IUtilityModelJSON
	},
}
