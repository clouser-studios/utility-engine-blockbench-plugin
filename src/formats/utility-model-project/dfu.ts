import PACKAGE from '@package' with { type: 'json' }
import { compareLongVersions } from '@utility/util/compareVersion.ts'
import { log } from '@utility/util/log.ts'
import { type UtilityModelProject } from '../utility-model-project/versions/latest.ts'
import v0_0_5 from './versions/0.0.5.ts'
import v0_0_7 from './versions/0.0.7.ts'
import v0_0_8 from './versions/0.0.8.ts'
import v0_0_9 from './versions/0.0.9.ts'

/**
 * Takes a utility model and returns a new utility model that has been upgraded to the latest version of the utility model format.
 */
export function updateUtilityProject(model: any): UtilityModelProject.Json {
	let newModel = JSON.parse(JSON.stringify(model))
	const modelVersion = model.meta.format_version

	// If the current plugin version is greater than the model version, upgrade the model
	if (compareLongVersions(PACKAGE.version, modelVersion)) {
		// Sequentially update the model to the latest version taking advantage of switch fallthrough
		switch (true) {
			case compareLongVersions('0.0.5.0', modelVersion):
				newModel = v0_0_5.upgrade(newModel)
			case compareLongVersions('0.0.7.0', modelVersion):
				newModel = v0_0_7.upgrade(newModel)
			case compareLongVersions('0.0.8.0', modelVersion):
				newModel = v0_0_8.upgrade(newModel)
			case compareLongVersions('0.0.9.0', modelVersion):
				newModel = v0_0_9.upgrade(newModel)
		}
	}

	log.info('Updated model to latest version:', newModel)

	return newModel
}
