import { currentFormatIsUtilityModelProject } from '@utility/formats/utility-model-project/index.ts'
import type { SkinModel } from '@utility/panels/element-properties/index.ts'
import { toolbarsCompat } from '@utility/util/blockbenchCompat.ts'
import { createScopedTranslator, localize } from '@utility/util/lang.ts'
import { registerDeletableHandlerPatch, registerPatch } from 'blockbench-patch-manager'

const TOGGLE_ID = 'utility-engine:action/skin-model-preview-toggle'

const localizeOption = createScopedTranslator('element_properties.skin_model.options')

/** Toolbar toggle controlling which `skin_model` variants are shown in the viewport. */
export const SKIN_MODEL_PREVIEW_TOGGLE = registerDeletableHandlerPatch({
	id: TOGGLE_ID,
	create() {
		return new BarSelect(TOGGLE_ID, {
			name: localize('action.skin_model_preview_toggle.label'),
			description: localize('action.skin_model_preview_toggle.description'),
			icon_mode: true,
			value: 'all',
			condition: () => currentFormatIsUtilityModelProject(),
			options: {
				all: { name: localizeOption('all'), icon: 'visibility' },
				wide: { name: localizeOption('wide'), icon: 'highlighter_size_3' },
				slim: { name: localizeOption('slim'), icon: 'highlighter_size_1' },
			},
			onChange() {
				Canvas.updateVisibility()
			},
		})
	},
})
SKIN_MODEL_PREVIEW_TOGGLE.onCreated(toggle => toolbarsCompat.outliner.add(toggle))
SKIN_MODEL_PREVIEW_TOGGLE.onDeleted(toggle => toolbarsCompat.outliner.remove(toggle))

export function getSkinModelPreviewMode(): SkinModel {
	return (SKIN_MODEL_PREVIEW_TOGGLE.get()?.value as SkinModel) ?? 'all'
}

/** Sets the preview toggle programmatically, e.g. after auto-detecting a fetched skin's shape. */
export function setSkinModelPreviewMode(mode: SkinModel) {
	const toggle = SKIN_MODEL_PREVIEW_TOGGLE.get()
	if (!toggle || toggle.value === mode) return
	toggle.set(mode)
	Canvas.updateVisibility()
}

/**
 * Narrows visibility set by the native preview controller: an element whose `skin_model`
 * doesn't match the current preview mode is hidden, without touching its actual
 * `visibility` property (so this stays a view-only filter, not a saved project change).
 */
function applyVisibilityFilter({ element }: { element: Cube | Mesh }) {
	if (!currentFormatIsUtilityModelProject()) return
	const mode = getSkinModelPreviewMode()
	if (mode === 'all') return
	const skinModel = element.skin_model ?? 'all'
	if (skinModel !== 'all' && skinModel !== mode) {
		element.mesh.visible = false
	}
}

registerPatch({
	id: 'utility-engine:skin-model-preview-toggle/apply-visibility-filter',
	dependencies: ['utility-engine:element-properties'],
	apply: () => {
		Cube.preview_controller.on('update_visibility', applyVisibilityFilter)
		Mesh.preview_controller.on('update_visibility', applyVisibilityFilter)
		Canvas.updateVisibility()
	},
	revert: () => {
		Cube.preview_controller.removeListener('update_visibility', applyVisibilityFilter)
		Mesh.preview_controller.removeListener('update_visibility', applyVisibilityFilter)
		Canvas.updateVisibility()
	},
})
