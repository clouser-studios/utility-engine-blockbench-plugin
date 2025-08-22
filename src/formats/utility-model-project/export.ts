import Icon from '@assets/icons/nobackground.png'
import { createAction } from '@blockbench-tools'
import { PACKAGE } from '@package'
import { translate } from '@utility/util/translation'
import { UTILITY_MODEL_FORMAT } from '.'
import { exportUtilityModel } from '../utility-model/exporter'

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
