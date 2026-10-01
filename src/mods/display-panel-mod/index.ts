import { pollUntilResult } from '@utility/util/promises.ts'
import { registerPatch } from 'blockbench-patch-manager'
import { mount, unmount } from 'svelte'
import { injectComponent } from 'svelte-patching-tools'
import OverridesInput from './overridesInput.svelte'
import Panel from './panel.svelte'

registerPatch({
	id: 'utility_engine:display-panel/arm-rotation',
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

/** Mounts the model-override input as a sibling directly above `#display_sliders`. */
registerPatch({
	id: 'utility_engine:display-panel/overrides',
	apply: () => {
		let cancelled = false
		let instance: ReturnType<typeof mount> | null = null
		let anchor: Comment | null = null

		void pollUntilResult(
			() => document.querySelector<HTMLDivElement>('#panel_display #display_sliders'),
			() => cancelled
		)
			.then(sliders => {
				if (cancelled) return
				anchor = document.createComment('utility_engine:display-overrides')
				sliders.before(anchor)
				instance = mount(OverridesInput, { target: sliders.parentElement!, anchor })
			})
			.catch(() => {
				/* poll cancelled by revert */
			})

		return {
			teardown: () => {
				cancelled = true
				if (instance) void unmount(instance)
				anchor?.remove()
				instance = null
				anchor = null
			},
		}
	},
	revert: ({ teardown }) => teardown(),
})
