import { startScreenCompat } from '@utility/util/blockbenchCompat.ts'
import { localize } from '@utility/util/lang.ts'
import { registerPropertyOverridePatch } from 'blockbench-patch-manager'

const UTILITY_CATEGORY = 'utility-engine'
const GENERAL_CATEGORY = 'general'

// @ts-expect-error
Language.data['format_category.utility-engine'] = localize('format_category.utility_engine')

// Reorders the New Project format category list to put "Utility Engine" directly below "General".
registerPropertyOverridePatch({
	id: `utility-engine:format-category`,
	target: startScreenCompat.vue,
	key: 'getFormatCategories',

	get: original => {
		return function (this: Vue) {
			const categories: ReturnType<typeof original> = original.call(this)
			const utilityCategory = categories[UTILITY_CATEGORY]
			if (!utilityCategory) return categories

			delete categories[UTILITY_CATEGORY]
			const reordered: typeof categories = {}
			for (const key in categories) {
				reordered[key] = categories[key]
				if (key === GENERAL_CATEGORY) reordered[UTILITY_CATEGORY] = utilityCategory
			}
			// "General" not present for some reason - keep Utility Engine rather than drop it.
			reordered[UTILITY_CATEGORY] ??= utilityCategory

			return reordered
		}
	},
})
