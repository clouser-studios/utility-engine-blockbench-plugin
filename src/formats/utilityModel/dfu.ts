import v0_0_5 from './versions/0.0.5'

/**
 * Takes a utility model and returns a new utility model that has been upgraded to the latest version of the utility model format.
 */
export function updateUtilityModel(model: any): any {
	const newModel = JSON.parse(JSON.stringify(model))
	const modelVersion = model.meta.format_version

	// Finds the version of the model and sequentially updates it through each version until latest.
	switch (true) {
		case compareVersions('0.0.5', modelVersion):
			v0_0_5.upgrade(newModel)
		// case compareVersions('0.0.6', modelVersion):
		// 	v0_0_6.updateTo(newModel)
	}

	return newModel
}
