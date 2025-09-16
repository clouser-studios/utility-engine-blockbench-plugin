import Icon from '@assets/icons/nobackground.png'
import { createAction } from '@blockbench-tools'
import { localize } from '@utility/util/lang'
import { UTILITY_MODEL_PROJECT_FORMAT } from '.'

export const OPEN_UTILITY_MODEL_SETTINGS_ACTION = createAction(
	`utility-engine:open-utility-model-settings`,
	{
		name: localize('action.open_utility_model_settings.label'),
		icon: Icon,
		condition() {
			return UTILITY_MODEL_PROJECT_FORMAT.isCurrentFormat()
		},
		click() {
			Project?.openSettings()
		},
	}
)
