import Icon from '@assets/icons/nobackground.png'
import { registerAction, registerMod } from '@blockbench-tools'
import { createScopedTranslator, localize } from '@utility/util/lang'
import { currentFormatIsUtilityModelProject } from '.'
import type { UtilityModelProject } from './versions/latest'

declare global {
	interface ModelProject {
		utility_model: UtilityModelProject.Settings
		default_backface_culling_mode?: 'no_culling' | 'cull_backfaces'
	}
}

export const OPEN_PROJECT_SETTINGS_ACTION = registerAction(
	`utility-engine:open-utility-model-settings`,
	{
		name: localize('action.open_utility_model_settings.label'),
		icon: Icon,
		condition: () => currentFormatIsUtilityModelProject(),
		click() {
			Project?.openSettings()
		},
	}
)

const localizeSettings = createScopedTranslator('model_format.utility_model.project_settings')

registerMod({
	id: `utility-engine:model-format-properties`,
	apply: () => {
		const modelIdentifier = new Property(ModelProject, 'string', 'model_identifier', {
			label: localizeSettings('model_identifier'),
			condition: () => currentFormatIsUtilityModelProject(),
		})

		const defaultBackfaceCullingMode = new Property(
			ModelProject,
			'string',
			'default_backface_culling_mode',
			{
				label: localizeSettings('default_backface_culling_mode.title'),
				condition: () => currentFormatIsUtilityModelProject(),
				options: {
					no_culling: localizeSettings(
						'default_backface_culling_mode.options.no_culling'
					),
					cull_backfaces: localizeSettings(
						'default_backface_culling_mode.options.cull_backfaces'
					),
				},
				default: false,
			}
		)

		return {
			modelIdentifier,
			defaultBackfaceCullingMode,
		}
	},
	revert: ({ modelIdentifier, defaultBackfaceCullingMode }) => {
		modelIdentifier.delete()
		defaultBackfaceCullingMode.delete()
	},
})
