import * as PACKAGE from '../../package.json'
import Icon from '../formats/svelte/utilityModel/icon.svelte'
import { injectSvelteCompomponentMod } from '../util/injectSvelteComponent'
import { createBlockbenchMod } from '../util/moddingTools'

// Delete default format page title
const INTERVAL = setInterval(() => {
	const title = $('#format_page_utility_model h2')[0]
	if (!title) return
	title.remove()
	clearInterval(INTERVAL)
})

// Format Category Icon
injectSvelteCompomponentMod({
	component: Icon,
	props: {},
	elementSelector() {
		$('[format=utility_model] span')[0]?.remove()
		return $('[format=utility_model]')[0]
	},
	prepend: true,
})

// Modifies the format category sorting order to insert Utility directly below General
createBlockbenchMod(
	`${PACKAGE.name}:format_category`,
	undefined,
	() => {
		const interval = setInterval(() => {
			const label = $("li.format_category > label:contains('format_category.utility')")
			const utilityContainer = label.first().parent()
			if (utilityContainer.children().length === 0) return
			console.log('Utility container found')

			label.html('Utility')

			const generalContainer = $(
				`li.format_category > label:contains('${tl('format_category.general')}')`
			)
				.first()
				.parent()
			generalContainer.after(utilityContainer)

			clearInterval(interval)
		}, 16)
	},
	() => {
		//
	}
)
