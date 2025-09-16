import { injectComponent } from '@utility/svelte/injectComponent'
import { createBlockbenchMod } from '@utility/util/moddingTools'
import { unmount } from 'svelte'
import Panel from './panel.svelte'

createBlockbenchMod({
	id: 'utility-engine:display-panel/arm-rotation',
	collectContext: () => ({}),
	apply: () => {
		const component = injectComponent({
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
		return { component }
	},
	revert: async ctx => {
		await unmount(await ctx.component)
	},
})
