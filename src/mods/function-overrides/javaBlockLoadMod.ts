import { importUtilityModelFile } from '@utility/formats/utility-model/import.ts'
import { registerPropertyOverridePatch } from 'blockbench-patch-manager'

/**
 * Blockbench's module-scoped `loadModelFile` (drag-drop, collection "Open file") never passes the
 * file to `load_filter.condition`, so our codec can't claim `.utility.json` files there and
 * `java_block` loads them instead. Redirect those files to the Utility Model importer.
 */
registerPropertyOverridePatch({
	id: `utility-engine:java-block-codec/load`,
	target: Codecs.java_block,
	key: 'load',

	get: original => {
		return function (this: Codec, model: any, file: Filesystem.FileResult, args?: any) {
			if (file?.path?.endsWith('.utility.json')) {
				return importUtilityModelFile(file)
			}
			return original!.call(this, model, file, args)
		}
	},
})
