import { injectComponent } from '@utility/svelte/injectComponent'
import { createBlockbenchMod } from '@utility/util/moddingTools'
import { UTILITY_MODEL_PROJECT_FORMAT } from '.'
import Icon from './icon.svelte'

// Format Category Icon
createBlockbenchMod({
	id: `utility-engine:utility-model-format-icon`,
	apply: () => {
		return injectComponent({
			component: Icon,
			props: {},
			elementSelector() {
				$(`li[format="${UTILITY_MODEL_PROJECT_FORMAT.id}"] span`)[0]?.remove()
				return $(`li[format="${UTILITY_MODEL_PROJECT_FORMAT.id}"]`)[0]
			},
			prepend: true,
		})
	},
	revert: unmountPromise => {
		unmountPromise.then(unmount => unmount())
	},
})
