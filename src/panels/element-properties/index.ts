import { currentFormatIsUtilityModelProject } from '@utility/formats/utility-model-project/index.ts'
import { localize } from '@utility/util/lang.ts'
import { registerPatch } from 'blockbench-patch-manager'
import { injectComponent } from 'svelte-patching-tools'
import ElementProperties from './elementProperties.svelte'

export type SkinModel = 'all' | 'wide' | 'slim'

declare global {
	interface Cube {
		skin_model?: SkinModel
		render_passes?: string[]
	}
	interface Mesh {
		skin_model?: SkinModel
		render_passes?: string[]
	}
}

/** Outliner types these properties are added to, with their registered ids. */
const TARGETS = [
	['cube', Cube],
	['mesh', Mesh],
] as const

const condition = () => currentFormatIsUtilityModelProject()

function defineProperties(target: typeof Cube | typeof Mesh) {
	const skinModel = new Property(target, 'enum', 'skin_model', {
		default: 'all',
		values: ['all', 'wide', 'slim'] satisfies SkinModel[],
		condition,
		inputs: {
			element_panel: {
				input: {
					label: localize('element_properties.skin_model.label'),
					description: localize('element_properties.skin_model.description'),
					type: 'inline_select',
					options: {
						all: localize('element_properties.skin_model.options.all'),
						wide: localize('element_properties.skin_model.options.wide'),
						slim: localize('element_properties.skin_model.options.slim'),
					},
				},
				// The skin model preview toggle only hides elements when the visibility
				// aspect is recomputed, which a plain property change doesn't trigger.
				onChange: () => Canvas.updateVisibility(),
			},
		},
	})

	const renderPasses = new Property(target, 'array', 'render_passes', {
		default: () => [],
		condition,
	})

	return [skinModel, renderPasses]
}

/** Forces the element panel to rebuild its native property inputs (see comment in `apply`). */
function refreshElementPanel() {
	for (const [id, target] of TARGETS) {
		Blockbench.dispatchEvent('register_element_type', { id, constructor: target })
	}
}

registerPatch({
	id: 'utility_engine:element-properties',

	apply() {
		const properties = TARGETS.flatMap(([, target]) => defineProperties(target))

		// The element panel builds its native inputs on plugin load and can race ahead
		// of this patch; re-announcing the types forces it to rebuild with them.
		refreshElementPanel()

		// `#panel_element > .form` is wiped on every form rebuild, so the render-passes
		// editor mounts as a sibling of `.form`.
		const unmountEditor = injectComponent({
			component: ElementProperties,
			elementSelector: () => document.querySelector<HTMLDivElement>('#panel_element'),
		})

		return { properties, unmountEditor }
	},

	revert({ properties, unmountEditor }) {
		void unmountEditor()
		for (const property of properties) property.delete()
		refreshElementPanel()
	},
})
