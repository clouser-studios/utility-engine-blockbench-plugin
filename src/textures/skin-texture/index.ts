import SteveSkin from '@assets/steve.png'
import { createAction, createBlockbenchMod } from '@blockbench-tools'
import { UTILITY_MODEL_PROJECT_FORMAT } from '@utility/formats/utility-model-project'
import { SvelteDialog } from '@utility/svelte/dialog'
import { localize } from '@utility/util/lang'
import { syncable } from '@utility/util/stores'
import UsernamePrompt from './usernamePrompt.svelte'

const SKIN_URL = 'https://sessionserver.mojang.com/session/minecraft/profile/'
const USERNAME_TO_UUID_URL = 'https://api.mojang.com/users/profiles/minecraft/'
export const SKIN_TEXTURE_NAME = 'utility:current_skin'

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
	const username = syncable<string | undefined>('')
	return new Promise<string | undefined>(resolve => {
		new SvelteDialog({
			id: `utility-engine:username-prompt`,
			title: '',
			component: UsernamePrompt,
			props: { username },
			onClose() {
				resolve(username.get())
			},
		}).show()
	})
}

export const CREATE_SKIN_TEXTURE_ACTION = createAction(`utility-engine:create-skin-texture`, {
	name: localize('action.create_skin_texture.label'),
	icon: 'portrait',
	condition() {
		return (
			UTILITY_MODEL_PROJECT_FORMAT.isCurrentFormat() &&
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

createBlockbenchMod({
	id: `utility-engine:skin-texture/override-texture-class`,
	collectContext: () => ({
		original: Texture,
	}),
	apply: ctx => {
		// @ts-expect-error
		Texture = OverrideTexture
		return ctx
	},
	revert: ctx => {
		// @ts-expect-error
		Texture = ctx.original
	},
})

export class SkinTexture extends OverrideTexture {
	public isSkinTexture = true

	constructor(data?: ISkinTextureData, uuid?: string) {
		data ??= {}
		data.name = SKIN_TEXTURE_NAME
		super(data, uuid, true)
		this.extend(data)
		this.load()
		if (!this.source) {
			this.resetPreviewSkin()
		}
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

	add(undo?: boolean) {
		super.add(undo)
		// Add skin indicator icon
		requestAnimationFrame(() => {
			const e = $(`li.texture[texid="${this.uuid}"]`)[0]
			const icon = document.createElement('i')
			icon.title = localize('texture.skin')
			icon.className = 'material-icons texture_particle_icon'
			icon.textContent = 'portrait'
			e.insertBefore(icon, e.lastChild)
		})

		return this
	}

	edit() {
		// Cannot edit skin textures
	}

	resetPreviewSkin() {
		this.fromDataURL(SteveSkin)
	}

	fromDataURL(url: string): this {
		super.fromDataURL(url)
		this.path = undefined
		return this
	}

	fromFile(file: { name: string; path: string; content?: any }) {
		this.loadContentFromPath(file.path)
		return this
	}

	getSaveCopy() {
		const copy = Texture.prototype.getSaveCopy.call(this) as TextureData
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
		name: localize('menu.skin_texture.change_preview_skin.label'),
		children: [
			{
				icon: 'image',
				name: localize('menu.skin_texture.change_preview_skin.from_file'),
				click(texture: Texture) {
					texture.reopen(true)
				},
			},
			{
				icon: 'person',
				name: localize('menu.skin_texture.change_preview_skin.from_username'),
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
		name: localize('menu.skin_texture.remove_preview_skin'),
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
