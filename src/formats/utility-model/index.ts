import { registerDeletableHandlerPatch } from 'blockbench-patch-manager'
import { mount, unmount } from 'svelte'
import FormatPage from './formatPage.svelte'
import { importUtilityModel } from './import.ts'

// FIXME: Temp patch until Blockbench updates
// eslint-disable-next-line @typescript-eslint/naming-convention
declare const ModelLoader: typeof Blockbench.ModelLoader

export const UTILITY_JSON_LOADER_ID = `utility-engine:model_loader/utility-model-json-loader`

export const UTILITY_JSON_LOADER = registerDeletableHandlerPatch({
	id: UTILITY_JSON_LOADER_ID,
	create() {
		let mountedComponent: ReturnType<typeof mount> | null = null
		let titleElement: HTMLElement | null = null

		const loader = new ModelLoader(UTILITY_JSON_LOADER_ID, {
			name: 'Import .utility.json',
			icon: 'fa-file-import',
			category: 'utility-engine',
			target: 'Minecraft: Java Edition',
			confidential: false,
			onStart() {
				importUtilityModel()
			},
			format_page: {
				component: {
					mounted(this: Vue) {
						const target = this.$el.parentElement!
						titleElement = target.querySelector('h2')
						if (titleElement) titleElement.hidden = true
						mountedComponent = mount(FormatPage, { target })
					},
					beforeDestroy(this: Vue) {
						if (titleElement) titleElement.hidden = false
						if (mountedComponent) {
							void unmount(mountedComponent)
							mountedComponent = null
						}
					},
				},
			},
		})

		return loader
	},
})
