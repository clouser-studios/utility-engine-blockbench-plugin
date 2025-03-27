import { UTILITY_MODEL_FORMAT } from '.'
import Icon from '../../assets/icons/nobackground.png'
import { PACKAGE } from '../../package'
import { exportUtilityModel } from '../../systems/utilityModelExporter'
import { createAction } from '../../util/moddingTools'
import { translate } from '../../util/translation'

export const EXPORT_UTILITY_MODEL_AS_ACTION = createAction(`${PACKAGE.name}:exportUtilityModel`, {
	name: translate('action.export_utility_model_as.label'),
	icon: Icon,
	condition() {
		return UTILITY_MODEL_FORMAT.isCurrentFormat()
	},
	click() {
		exportUtilityModel()
	},
})

export const EXPORT_UTILITY_MODEL_ACTION = createAction(`${PACKAGE.name}:exportUtilityModel`, {
	name: translate('action.export_utility_model.label'),
	icon: Icon,
	condition() {
		return UTILITY_MODEL_FORMAT.isCurrentFormat()
	},
	click() {
		exportUtilityModel(Project!.export_path)
	},
})

MenuBar.addAction(EXPORT_UTILITY_MODEL_ACTION, 'file.export.0')
MenuBar.addAction(EXPORT_UTILITY_MODEL_AS_ACTION, 'file.export.1')
