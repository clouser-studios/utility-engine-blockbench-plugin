import Icon from '@assets/icons/nobackground.png'
import { createAction } from '@blockbench-tools'
import { PACKAGE } from '@package'
import { importUtilityModel } from '@utility/formats/utility-model/importer'
import { translate } from '@utility/util/translation'

export const EXPORT_UTILITY_MODEL_ACTION = createAction(`${PACKAGE.name}:importUtilityModel`, {
	name: translate('action.import_utility_model.label'),
	icon: Icon,
	click() {
		importUtilityModel()
	},
})

MenuBar.addAction(EXPORT_UTILITY_MODEL_ACTION, 'file.import.0')
