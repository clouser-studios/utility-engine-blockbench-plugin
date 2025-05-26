import v0_0_1, { type v0_0_1 as UtilityModel } from './versions/0.0.1'

/**
 * Takes a utility model and returns a new utility model that has been upgraded to the latest version of the utility model format.
 */
export function updateUtilityModel(model: any): UtilityModel.IUtilityModelJSON {
	const newModel = JSON.parse(JSON.stringify(model))
	const modelVersion = model.format_version

	// Finds the version of the model and sequentially updates it through each version until latest.
	switch (true) {
		case compareVersions('0.0.1', modelVersion):
			v0_0_1.upgrade(newModel)
		// case compareVersions('0.0.2', modelVersion):
		// 	v0_0_2.updateTo(newModel)
	}

	return newModel
}
