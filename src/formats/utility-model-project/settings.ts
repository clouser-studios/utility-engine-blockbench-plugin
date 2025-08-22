import Icon from '@assets/icons/nobackground.png'
import { createAction } from '@blockbench-tools'
import { PACKAGE } from '@package'
import { translate } from '@utility/util/translation'
import { UTILITY_MODEL_FORMAT } from '.'

export const OPEN_UTILITY_MODEL_SETTINGS_ACTION = createAction(
	`${PACKAGE.name}:openUtilityModelSettings`,
	{
		name: translate('action.open_utility_model_settings.label'),
		icon: Icon,
		condition() {
			return UTILITY_MODEL_FORMAT.isCurrentFormat()
		},
		click() {
			Project?.openSettings()
		},
	}
)
