import { log } from '@utility/util/log.ts'
import v0_0_1 from './versions/0.0.1.ts'
import v0_0_2 from './versions/0.0.2.ts'
import v0_0_3 from './versions/0.0.3.ts'
import { type UtilityModel } from './versions/latest.ts'

/**
 * Takes a utility model and returns a new utility model that has been upgraded to the latest version of the utility model format.
 */
export function updateUtilityModel(model: any): UtilityModel.Json {
	let newModel = JSON.parse(JSON.stringify(model))
	const modelVersion = model.format_version

	// Finds the version of the model and sequentially updates it through each version until latest.
	switch (true) {
		case compareVersions('0.0.1', modelVersion):
			newModel = v0_0_1.upgrade(newModel)
		case compareVersions('0.0.2', modelVersion):
			newModel = v0_0_2.upgrade(newModel)
		case compareVersions('0.0.3', modelVersion):
			newModel = v0_0_3.upgrade(newModel)
	}

	log.info('Updated model to latest version:', newModel)

	return newModel
}
