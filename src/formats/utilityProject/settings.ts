import { PACKAGE } from '@utility/package'
import { createAction } from '@utility/util/moddingTools'
import { translate } from '@utility/util/translation'
import { UTILITY_MODEL_FORMAT } from '.'
import Icon from '../../assets/icons/nobackground.png'

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
