import { injectComponent } from '@utility/svelte/injectComponent'
import { registerMod } from '@utility/util/moddingTools'
import { UTILITY_MODEL_PROJECT_FORMAT_ID } from '.'
import Icon from './icon.svelte'

// Format Category Icon
registerMod({
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
