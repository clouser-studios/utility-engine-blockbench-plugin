import { BB } from '@utility/util/blockbenchCompat.ts'
import { localize } from '@utility/util/lang.ts'
import { log } from '@utility/util/log.ts'
import { registerPropertyOverridePatch } from 'blockbench-patch-manager'
import { UTILITY_MODEL_PROJECT_CODEC } from './codec.ts'
import { updateUtilityProject } from './dfu.ts'
import { currentFormatIsUtilityModelProject, UTILITY_MODEL_PROJECT_FORMAT_ID } from './index.ts'

/**
 * Turns the current project into an unsaved Utility Model Project, so the next save prompts for
 * a `.utilityproject` path instead of writing to the file it came from.
 */
export function adoptAsUtilityProject(notify = true) {
	if (!Project) return
	Project.save_path = ''
	Project.name = Project.name.replace(/\.utility$/, '')
	Project.saved = false
	if (notify) {
		Blockbench.showQuickMessage(localize('message.converted_to_utility_project'), 3000)
	}
}

/** Timed backups and autosave pass `backup`; edit sessions also do, but always with `bitmaps`. */
function isBackupCompile(options: any): boolean {
	return !!options?.backup && !options.bitmaps
}

/** Removes everything a failed parse may have added, so another parser can start clean. */
function clearProjectContent() {
	for (const controller of [...BB.AnimationController.all]) controller.remove(false, false)
	for (const animation of [...BB.Animation.all]) animation.remove(false, false)
	for (const element of [...Outliner.elements]) element.remove()
	for (const group of [...Group.all]) group.remove(false)
	for (const texture of [...Texture.all]) texture.remove(true)
	for (const textureGroup of [...TextureGroup.all]) textureGroup.remove()
	for (const collection of [...Collection.all]) Collection.all.remove(collection)
}

/** File > Convert Project. Blockbench ignores a `convertTo` passed in the format's options. */
registerPropertyOverridePatch({
	id: `utility-engine:model-format/convert-to`,
	target: ModelFormat.prototype,
	key: 'convertTo',

	get: original => {
		return function (this: ModelFormat) {
			const result = original!.call(this)
			if (this.id === UTILITY_MODEL_PROJECT_FORMAT_ID) adoptAsUtilityProject()
			return result
		}
	},
})

/**
 * Blockbench writes timed backups and autosaves with the `.bbmodel` codec. For Utility projects,
 * write `.utilityproject` data instead, tagged with `model_format` so Blockbench's backup loaders
 * still pick the Utility format.
 */
registerPropertyOverridePatch({
	id: `utility-engine:bbmodel-codec/compile`,
	target: Codecs.project,
	key: 'compile',

	get: original => {
		return function (this: Codec, options?: any) {
			if (!isBackupCompile(options) || !currentFormatIsUtilityModelProject()) {
				return original!.call(this, options)
			}

			const model = UTILITY_MODEL_PROJECT_CODEC.get()!.compile!({ ...options, raw: true })
			model.meta.model_format = UTILITY_MODEL_PROJECT_FORMAT_ID

			if (options.raw) return model
			// `compressed` is ignored: Blockbench doesn't expose LZUTF8, and its loaders read plain JSON too.
			return compileJSON(model, { small: true })
		}
	},
})

/**
 * Utility-format data reaching `Codecs.project.parse`: a project saved as `.bbmodel`, or a timed
 * backup or autosave (which hold `.utilityproject` data, see above). Parse it with the Utility
 * codec, fall back to the `.bbmodel` parser, and warn if both fail.
 */
registerPropertyOverridePatch({
	id: `utility-engine:bbmodel-codec/parse`,
	target: Codecs.project,
	key: 'parse',

	get: original => {
		return function (this: Codec, model: any, path: string, args?: any) {
			if (model?.meta?.model_format !== UTILITY_MODEL_PROJECT_FORMAT_ID) {
				return original!.call(this, model, path, args)
			}

			const isUtilityProjectData = model.meta.format === UTILITY_MODEL_PROJECT_FORMAT_ID
			try {
				if (isUtilityProjectData) model = updateUtilityProject(model)
				UTILITY_MODEL_PROJECT_CODEC.get()!.parse!(model, path)
			} catch (utilityError: any) {
				log.warn('Failed to parse .bbmodel as a Utility Model Project:', utilityError)
				clearProjectContent()
				try {
					original!.call(this, model, path, args)
				} catch (bbmodelError: any) {
					log.error('Failed to parse .bbmodel with the .bbmodel codec:', bbmodelError)
					Blockbench.showMessageBox({
						title: localize(
							'error.utility_model_format.failed_to_convert_bbmodel.title'
						),
						message: localize(
							'error.utility_model_format.failed_to_convert_bbmodel.description',
							String(utilityError?.message),
							String(bbmodelError?.message)
						),
						icon: 'warning',
					})
					return
				}
			}
			adoptAsUtilityProject(!isUtilityProjectData)
		}
	},
})
