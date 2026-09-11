import { UTILITY_MODEL_PROJECT_FORMAT_ID } from '@utility/formats/utility-model-project/index.ts'
import { localize } from '@utility/util/lang.ts'
import { registerPatch } from 'blockbench-patch-manager'

const UTILITY_CATEGORY_QUERY = `li.format_category:has(li[format="${UTILITY_MODEL_PROJECT_FORMAT_ID}"])`
const GENERAL_CATEGORY_QUERY = `li.format_category:has(li[format="free"])`

// @ts-expect-error
Language.data['format_category.utility-engine'] = localize('format_category.utility_engine')

// Modifies the format category sorting order to insert Utility directly below General
registerPatch({
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
