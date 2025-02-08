import PACKAGE from '../../../package.json'
import SteveSkin from '../../assets/steve.png'
import { UTILITY_MODEL_FORMAT } from '../../formats/utilityModel'
import { createAction, createBlockbenchMod } from '../../util/moddingTools'
import { Valuable } from '../../util/stores'
import { SvelteDialog } from '../../util/svelteDialog'
import { translate } from '../../util/translation'
import UsernamePrompt from './usernamePrompt.svelte'

const SKIN_URL = 'https://sessionserver.mojang.com/session/minecraft/profile/'
const USERNAME_TO_UUID_URL = 'https://api.mojang.com/users/profiles/minecraft/'
const SKIN_TEXTURE_NAME = 'utility:skin'

async function fetchSkinUrl(username: string) {
	const data = await fetch(USERNAME_TO_UUID_URL + username).catch(() => undefined)
	if (!data) return
	const json = await data.json()
	if (!json.id) return
	const uuid = json.id as string
	const profileData = await fetch(SKIN_URL + uuid)
		.then(res => res.json())
		.catch(() => undefined)
	if (!profileData) return
	try {
		const skinData = JSON.parse(
			Buffer.from(profileData.properties[0].value as string, 'base64').toString()
		)
		return skinData.textures.SKIN.url as string
	} catch {
		return
	}
}

// Automatically converts the old 64x32 skin format to the new 64x64 format
async function autoUpdateSkinFormat(skinUrl: string) {
	const texture = new Texture().fromDataURL(skinUrl)
	return new Promise<string>(resolve => {
		texture.img.onload = () => {
			const canvas = document.createElement('canvas')
			canvas.width = 64
			canvas.height = 64
			const ctx = canvas.getContext('2d')!
			if (texture.height === 32) {
				ctx.drawImage(texture.img, 0, 0, 64, 32, 0, 0, 64, 32)
				// ctx.drawImage(texture.img, 0, 0, 64, 32, 0, 32, 64, 32)
			} else {
				ctx.drawImage(texture.img, 0, 0, 64, 64, 0, 0, 64, 64)
			}
			return resolve(canvas.toDataURL())
		}
	})
}

async function promptForUsername() {
	const username = new Valuable<string | undefined>('')
	return new Promise<string | undefined>(resolve => {
		new SvelteDialog({
			id: `${PACKAGE.name}:username_prompt`,
			title: '',
			component: UsernamePrompt,
			props: { username },
			onClose() {
				resolve(username.get())
			},
		}).show()
	})
}

export const CREATE_SKIN_TEXTURE_ACTION = createAction(`${PACKAGE.name}:create_skin_texture`, {
	name: translate('action.create_skin_texture.label'),
	icon: 'portrait',
	condition() {
		return (
			UTILITY_MODEL_FORMAT.isCurrentFormat() &&
			// Project can only have one skin texture
			!Texture.all.some(v => v instanceof SkinTexture)
		)
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
		isSkinTexture?: boolean
	}
}

export interface ISkinTextureData extends TextureData {
	// Will always be true, but I want to keep the ISkinTextureData interface separate from TextureData, and don't have any other properties to add yet.
	isSkinTexture?: boolean
}

class OverrideTexture extends Texture {
	constructor(data?: TextureData, uuid?: string, forceNotSkinTexture = false) {
		if (!forceNotSkinTexture && data?.isSkinTexture) {
			// REVIEW: This might not be necessary anymore now that we're using a custom codec.
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
	public isSkinTexture = true

	constructor(data?: ISkinTextureData, uuid?: string) {
		data ??= {}
		data.name = SKIN_TEXTURE_NAME
		super(data, uuid, true)
		this.extend(data)
		this.load()
	}

	extend(data: ISkinTextureData) {
		data.name = SKIN_TEXTURE_NAME
		Texture.prototype.extend.call(this, data)
		return this
	}

	load() {
		this.error = 0
		this.name = SKIN_TEXTURE_NAME
		this.show_icon = true
		this.img.src = this.source
		this.internal = true
		this.saved = true
		return this
	}

	edit() {
		// Cannot edit skin textures
	}

	resetPreviewSkin() {
		this.fromDataURL(SteveSkin)
	}

	fromFile(file: { name: string; path: string; content?: any }) {
		this.loadContentFromPath(file.path)
		return this
	}

	getSaveCopy() {
		const copy = Texture.prototype.getSaveCopy.call(this) as TextureData
		// @ts-expect-error
		for (const key in SkinTexture.properties) {
			// @ts-expect-error
			SkinTexture.properties[key].copy(this, copy)
		}
		copy.isSkinTexture = true
		return copy
	}
}

SkinTexture.prototype.menu = new Menu([
	{
		id: '',
		icon: 'portrait',
		name: translate('menu.skin_texture.change_preview_skin.label'),
		children: [
			{
				icon: 'image',
				name: translate('menu.skin_texture.change_preview_skin.from_file'),
				click(texture: Texture) {
					texture.reopen(true)
				},
			},
			{
				icon: 'person',
				name: translate('menu.skin_texture.change_preview_skin.from_username'),
				click(texture: SkinTexture) {
					void promptForUsername().then(async username => {
						if (!username) return
						const url = await fetchSkinUrl(username)
						if (url) {
							texture.fromDataURL(await autoUpdateSkinFormat(url))
						} else {
							Blockbench.showQuickMessage(
								'Failed to fetch skin, please double check your username is correct, then try again',
								8000
							)
						}
					})
				},
			},
		],
	},
	{
		icon: 'close',
		name: translate('menu.skin_texture.remove_preview_skin'),
		condition(texture: SkinTexture) {
			return texture.source !== SteveSkin
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
		new SkinTexture(copy).load().add(true)
	},
})

new Property(SkinTexture, 'boolean', 'isSkinTexture', {})
