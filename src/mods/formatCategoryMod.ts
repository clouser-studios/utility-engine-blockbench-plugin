import * as PACKAGE from '../../package.json'
import { createBlockbenchMod } from '../util/moddingTools'

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
