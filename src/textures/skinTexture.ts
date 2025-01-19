import PACKAGE from '../../package.json'
import { UTILITY_MODEL_FORMAT } from '../formats/utilityModel'
import { createAction, createBlockbenchMod } from '../util/moddingTools'
import { translate } from '../util/translation'
import SteveSkin from '../assets/steve.png'

export const CREATE_SKIN_TEXTURE_ACTION = createAction(`${PACKAGE.name}:create_skin_texture`, {
	name: translate('action.create_skin_texture'),
	icon: 'portrait',
	condition() {
		return UTILITY_MODEL_FORMAT.isCurrentFormat()
	},
	click() {
		new SkinTexture().add(true)
	},
})
requestAnimationFrame(() => {
	Toolbars.texturelist.add(CREATE_SKIN_TEXTURE_ACTION)
})

declare global {
	interface TextureData {
		is_skin_texture?: boolean
	}
}

class OverrideTexture extends Texture {
	constructor(data?: TextureData, uuid?: string, forceNotSkinTexture = false) {
		console.log('Texture constructor', data, uuid)

		if (!forceNotSkinTexture && data?.is_skin_texture) {
			return new SkinTexture(data, uuid)
		}

		super(data, uuid)
	}
}

createBlockbenchMod(
	`${PACKAGE.name}:texture_constructor`,
	{
		original: Texture,
	},
	context => {
		// @ts-expect-error
		Texture = OverrideTexture

		return context
	},
	context => {
		// @ts-expect-error
		Texture = context.original
	}
)

export class SkinTexture extends OverrideTexture {
	public previewSkinTexture = new Texture().fromDataURL(SteveSkin)

	constructor(data?: TextureData, uuid?: string) {
		data ??= {}
		data.name ??= 'Skin'
		super(data, uuid, true)

		// texture source should never change
		this.source = SteveSkin
		this.internal = true
		this.saved = false
		this.load()
	}

	load() {
		this.error = 0
		this.show_icon = true
		this.img.src = SteveSkin
		return this
	}

	get material() {
		if (!this.previewSkinTexture) {
			// @ts-expect-error
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return this._static.properties.material
		}
		return this.previewSkinTexture.material
	}

	set material(mat) {
		if (this.previewSkinTexture) {
			this.previewSkinTexture.material = mat
		}
	}

	edit() {
		// Cannot edit skin textures
	}

	resetPreviewSkin() {
		this.previewSkinTexture.fromDataURL(SteveSkin)
	}

	fromFile(file: File) {
		if (file.name === 'Skin.png') {
			this.resetPreviewSkin()
			return this
		}
		this.previewSkinTexture.fromFile(file)
		return this
	}

	fromDataURL(dataUrl: string) {
		this.previewSkinTexture.fromDataURL(dataUrl)
		return this
	}

	reopen(force = false) {
		Texture.prototype.reopen.call(this, force)
	}

	getSaveCopy() {
		const copy = Texture.prototype.getSaveCopy.call(this) as TextureData
		copy.is_skin_texture = true
		return copy
	}
}

SkinTexture.prototype.menu = new Menu([
	{
		icon: 'portrait',
		name: translate('menu.skin_texture.change_preview_skin'),
		click(texture: Texture) {
			texture.reopen(true)
		},
	},
	{
		icon: 'close',
		name: translate('menu.skin_texture.remove_preview_skin'),
		condition(texture: SkinTexture) {
			return texture.previewSkinTexture.source !== SteveSkin
		},
		click(texture: SkinTexture) {
			texture.resetPreviewSkin()
		},
	},
	new MenuSeparator('apply'),
	{
		icon: 'crop_original',
		name: 'menu.texture.face',
		condition() {
			return (
				!Format.single_texture && Outliner.selected.length > 0 && !Format.per_group_texture
			)
		},
		click(texture: Texture) {
			texture.apply()
		},
	},
	{
		icon: 'texture',
		name: 'menu.texture.blank',
		condition() {
			return (
				!Format.single_texture && Outliner.selected.length > 0 && !Format.per_group_texture
			)
		},
		click(texture: Texture) {
			texture.apply('blank')
		},
	},
	{
		icon: 'fa-cube',
		name: 'menu.texture.elements',
		condition() {
			return !Format.single_texture && Outliner.selected.length > 0
		},
		click(texture: Texture) {
			texture.apply(true)
		},
	},
	new MenuSeparator('copypaste'),
	'copy',
	'duplicate',
	new MenuSeparator('file'),
	{
		icon: 'folder',
		name: 'menu.texture.folder',
		condition: function (texture: Texture) {
			return isApp && texture.path
		},
		click(texture: Texture) {
			texture.openFolder()
		},
	},
	{
		icon: 'save',
		name: 'menu.texture.save',
		condition: function (texture: Texture) {
			return !texture.saved && texture.path
		},
		click(texture: Texture) {
			texture.save()
		},
	},
	{
		icon: 'file_download',
		name: 'menu.texture.export',
		click(texture: Texture) {
			texture.save(true)
		},
	},
	'delete',
	new MenuSeparator('properties'),
	{
		icon: 'list',
		name: 'menu.texture.properties',
		click(texture: Texture) {
			texture.openMenu()
		},
	},
])

SharedActions.add('duplicate', {
	priority: 100,
	subject: 'skin_texture',
	// prettier-ignore
	condition: () =>
		!!(
			// @ts-expect-error
			Prop.active_panel == 'textures' &&
			Texture.selected &&
			Texture.selected instanceof SkinTexture
		),
	run() {
		const copy = Texture.selected!.getSaveCopy() as TextureData
		delete copy.path
		const new_tex = new SkinTexture(copy)
		new_tex.load().add(true)
	},
})
