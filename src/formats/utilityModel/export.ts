import { UTILITY_MODEL_FORMAT } from '.'
import { PACKAGE } from '../../package'
import { exportUtilityModel } from '../../systems/utilityModelExporter'
import { createAction } from '../../util/moddingTools'
import { translate } from '../../util/translation'

export const EXPORT_UTILITY_MODEL_ACTION = createAction(`${PACKAGE.name}:exportUtilityModel`, {
	name: translate('action.export_utility_model.label'),
	icon: 'insert_drive_file',
	condition() {
		return UTILITY_MODEL_FORMAT.isCurrentFormat()
	},
	click() {
		console.log('Exporting utility model...')
		exportUtilityModel()
	},
})

MenuBar.addAction(EXPORT_UTILITY_MODEL_ACTION, 'file.export.0')
