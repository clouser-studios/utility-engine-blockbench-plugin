export namespace v0_0_1 {
	export interface IUtilityModelJSON {}
}

export default {
	upgrade(model: any): v0_0_1.IUtilityModelJSON {
		console.groupCollapsed('Updating utility model to 0.0.5')

		// As this is the first version the DFU knows of, there is nothing to upgrade.
		// However, we should make sure the format version is correct.
		model.meta.format_version = '0.0.5'

		console.groupEnd()
		return model as v0_0_1.IUtilityModelJSON
	},
}
