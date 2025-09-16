import { createBlockbenchMod } from '@blockbench-tools'
import { localize } from '@utility/util/lang'

const UTILITY_CATEGORY_QUERY = 'li.format_category:has(li[format="utility-engine:utility_model"])'
const GENERAL_CATEGORY_QUERY = `li.format_category:has(li[format="free"])`

Language.data['format_category.utility-engine'] = localize('format_category.utility_engine')

// Modifies the format category sorting order to insert Utility directly below General
createBlockbenchMod({
	id: `utility-engine:format-category`,
	apply: () => {
		const interval = setInterval(() => {
			const utilityCategory = $(UTILITY_CATEGORY_QUERY).first()
			if (utilityCategory.length === 0) return

			const generalCategory = $(GENERAL_CATEGORY_QUERY).first()
			if (generalCategory.length === 0) return

			utilityCategory.insertAfter(generalCategory)

			clearInterval(interval)
		}, 16)
	},
	revert: () => {
		//
	},
})
