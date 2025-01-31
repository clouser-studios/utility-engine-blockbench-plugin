/**
 * Takes a utility model and returns a new utility model that has been upgraded to the latest version of the utility model format.
 */
export function updateUtilityModel(model: any): any {
	const newModel = JSON.parse(JSON.stringify(model))
	return newModel
}
