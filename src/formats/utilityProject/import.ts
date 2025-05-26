import { PACKAGE } from '@utility/package'
import { importUtilityModel } from '@utility/systems/utilityModel/importer'
import { createAction } from '@utility/util/moddingTools'
import { translate } from '@utility/util/translation'
import Icon from '../../assets/icons/nobackground.png'

export const EXPORT_UTILITY_MODEL_ACTION = createAction(`${PACKAGE.name}:importUtilityModel`, {
	name: translate('action.import_utility_model.label'),
	icon: Icon,
	click() {
		importUtilityModel()
	},
})

MenuBar.addAction(EXPORT_UTILITY_MODEL_ACTION, 'file.import.0')
