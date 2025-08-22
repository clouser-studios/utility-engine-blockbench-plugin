import { PACKAGE } from '@package'
import v0_0_5 from './versions/0.0.5'
import v0_0_7 from './versions/0.0.7'

/**
 * Takes a utility model and returns a new utility model that has been upgraded to the latest version of the utility model format.
 */
export function updateUtilityProject(model: any): any {
	const newModel = JSON.parse(JSON.stringify(model))
	const modelVersion = model.meta.format_version

	// If the current plugin version is greater than the model version, upgrade the model
	if (compareVersions(PACKAGE.version, modelVersion)) {
		// Sequentially update the model to the latest version taking advantage of switch fallthrough
		switch (true) {
			case compareVersions('0.0.5', modelVersion):
				v0_0_5.upgrade(newModel)
			case compareVersions('0.0.7', modelVersion):
				v0_0_7.upgrade(newModel)
		}
	}

	return newModel
}
