import PACKAGE from '../../package.json'
import { UTILITY_MODEL_FORMAT } from '../formats/utilityModel'
import { createAction } from '../util/moddingTools'
import { translate } from '../util/translation'

export const CREATE_SKIN_TEXTURE_ACTION = createAction(`${PACKAGE.name}:create_skin_texture`, {
	name: translate('action.create_skin_texture'),
	icon: 'portrait',
	condition() {
		return UTILITY_MODEL_FORMAT.isCurrentFormat()
	},
	click() {
		console.log('Create skin texture')
	},
})
requestAnimationFrame(() => {
	Toolbars.texturelist.add(CREATE_SKIN_TEXTURE_ACTION)
})

export class SkinTexture extends Blockbench.Texture {
	constructor(data?: TextureData, uuid?: string) {
		super(data, uuid)
	}
}
