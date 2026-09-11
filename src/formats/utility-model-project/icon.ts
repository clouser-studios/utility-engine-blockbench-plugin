import { registerPatch } from 'blockbench-patch-manager'
import { injectComponent } from 'svelte-patching-tools'
import Icon from './icon.svelte'
import { UTILITY_MODEL_PROJECT_FORMAT_ID } from './index.ts'

// Format Category Icon
registerPatch({
	id: `utility-engine:utility-model-format-icon`,
	apply: () => {
		const unmountCallback = injectComponent({
			component: Icon,
			props: {},
			elementSelector() {
				$(`li[format="${UTILITY_MODEL_PROJECT_FORMAT_ID}"] span`)[0]?.remove()
				return $(`li[format="${UTILITY_MODEL_PROJECT_FORMAT_ID}"]`)[0]
			},
			prepend: true,
		})

		return { unmountCallback }
	},
	revert: async ({ unmountCallback }) => {
		await unmountCallback()
	},
})
