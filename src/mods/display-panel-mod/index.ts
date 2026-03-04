import { registerPatch } from 'blockbench-patch-manager'
import { injectComponent } from 'svelte-patching-tools'
import Panel from './panel.svelte'

registerPatch({
	id: 'utility-engine:display-panel/arm-rotation',
	apply: () => {
		const unmountCallback = injectComponent({
			component: Panel,
			elementSelector() {
				return document.querySelector<HTMLDivElement>('#panel_display > .panel_vue_wrapper')
			},
			postMount(component, target) {
				const parent = target.parentElement!
				parent.style.overflowX = 'hidden'
				parent.style.overflowY = 'auto'
			},
		})
		return { unmountCallback }
	},
	revert: async ({ unmountCallback }) => {
		await unmountCallback()
	},
})
