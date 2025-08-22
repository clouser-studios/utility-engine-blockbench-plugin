import { PACKAGE } from '@package'
import { UTILITY_MODEL_FORMAT } from '@utility/formats/utility-model-project'
import { type latest as UtilityProject } from '@utility/formats/utility-model-project/versions/latest'
import { translate } from '@utility/util/translation'
import { updateUtilityModel } from './dfu'
import { type latest as UtilityModel } from './versions/latest'

export class ImportError extends Error {
	constructor(key: string, ...args: string[]) {
		super(translate(key, ...args))
		this.name = 'ExportError'
	}
}

export function convertUtilityModelToProject(
	model: UtilityModel.IUtilityModelJSON,
	path?: string
): UtilityProject.IUtilityProjectJSON {
	model = updateUtilityModel(model)

	const project = {
		meta: {
			format: UTILITY_MODEL_FORMAT.id as any,
			format_version: PACKAGE.version as any,
			uuid: guid(),
			export_path: path,
		},
		options: {
			model_identifier: PathModule.basename(path ?? ''),
		},
		resolution: {
			width: model.texture_size[0] ?? 16,
			height: model.texture_size[1] ?? 16,
		},
	} as UtilityProject.IUtilityProjectJSON

	if (model.textures) {
		for (const [id, resourceLocation] of Object.entries(model.textures)) {
			console.log(`Importing texture: ${id} -> ${resourceLocation}`)
		}
	}

	return project
}

export function importUtilityModel() {
	Blockbench.import(
		{
			type: 'Utility Model',
			extensions: ['utility.json'],
		},
		files => {
			const file = files.at(0)
			if (!file) return

			const project = convertUtilityModelToProject(
				JSON.parse(file.content.toString()),
				file.path
			)
			console.log('Importing Utility Model:', project)
		}
	)
}
