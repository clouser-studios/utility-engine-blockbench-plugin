import EVENTS from '@events'
import PACKAGE from '@package'
import { SkinTexture } from '@utility/textures/skin-texture'
import { localize } from '@utility/util/lang'
import { log } from '@utility/util/log'
import { resetAllConsoleGroups } from '@utility/util/misc'
import { registerCodec } from '@utility/util/moddingTools'
import { UTILITY_MODEL_PROJECT_FORMAT, UTILITY_MODEL_PROJECT_FORMAT_ID } from '.'
import { updateUtilityProject } from './dfu'
import { type UtilityModelProject } from './versions/latest'

export function addProjectToRecentProjects(file: FileResult) {
	if (!Project || !file.path) return
	const name = pathToName(file.path, true)
	if (file.path && isApp && !file.no_file) {
		const project = Project
		Project.save_path = file.path
		Project.name = pathToName(name, false)
		addRecentProject({
			name,
			path: file.path,
			icon: UTILITY_MODEL_PROJECT_FORMAT.get()?.icon,
		})
		setTimeout(() => {
			if (Project === project) void updateRecentProjectThumbnail()
		}, 200)
	}
}

export const UTILITY_MODEL_PROJECT_CODEC = registerCodec(
	`utility-engine:codec/utility-model-project`,
	{
		name: 'Utility Model Project',
		extension: 'utilityproject',
		remember: true,
		load_filter: {
			extensions: ['utilityproject'],
			type: 'json',
		},

		// region load
		load(model: UtilityModelProject.Json, file) {
			console.log(`Loading Utility Model from '${file.name}'...`)
			try {
				model = updateUtilityProject(model)
			} catch (e: any) {
				resetAllConsoleGroups()
				log.error('Failed to upgrade Utility Model:', e)
				Blockbench.showMessageBox({
					title: localize('error.utility_model_format.failed_to_upgrade_project.title'),
					message: localize(
						'error.utility-model-format.failed-to-upgrade-project.description',
						e.message as string
					),
				})
			}
			setupProject(UTILITY_MODEL_PROJECT_FORMAT.get()!, model.meta.uuid)
			if (!Project) {
				throw new Error('Failed to load Utility Model')
			}
			addProjectToRecentProjects(file)
			this.parse!(model, file.path)
			console.log(
				`Successfully loaded Utility Model\n\tProject: ${Project.name}\n\t${Project.uuid}`
			)
		},

		// region parse
		// Takes the model file and injects it's data into the global Project
		parse(model: UtilityModelProject.Json, path) {
			console.log(`Parsing Utility Model from '${path}'...`)
			if (!Project) throw new Error('No project to parse into')

			Project.save_path = path
			Project.export_path = model.meta.export_path ?? ''

			if (model.meta.box_uv !== undefined) {
				Project.box_uv = model.meta.box_uv
			}

			if (model.resolution !== undefined) {
				Project.texture_width = model.resolution.width
				Project.texture_height = model.resolution.height
			}

			// Misc Project Properties
			for (const key in ModelProject.properties) {
				ModelProject.properties[key].merge(Project, model)
			}

			if (model.options) {
				Project.utility_model = { ...Project.utility_model, ...model.options }
			}

			if (model.texture_groups) {
				model.texture_groups.forEach(texGroup => {
					new TextureGroup(texGroup, texGroup.uuid).add()
				})
			}

			if (model.textures) {
				for (const texture of model.textures) {
					let newTexture: Texture
					if (texture.isSkinTexture) {
						newTexture = new SkinTexture(texture, texture.uuid).add(false)
					} else {
						newTexture = new Texture(texture, texture.uuid).add(false)
					}
					if (texture.relative_path && Project.save_path) {
						const resolvedPath = PathModule.resolve(
							Project.save_path,
							texture.relative_path
						)
						if (fs.existsSync(resolvedPath)) {
							newTexture.fromPath(resolvedPath)
							continue
						}
					}
					if (texture.path && fs.existsSync(texture.path) && !model.meta.backup) {
						newTexture.fromPath(texture.path)
					} else if (texture.source?.startsWith('data:')) {
						newTexture.fromDataURL(texture.source)
					}
				}
			}

			if (model.elements) {
				const defaultTexture = Texture.getDefault()
				for (const element of model.elements) {
					const newElement = OutlinerElement.fromSave(element, true)
					switch (true) {
						case newElement instanceof Cube: {
							for (const face in newElement.faces) {
								if (element.faces) {
									const texture =
										element.faces[face].texture !== undefined &&
										Texture.all[element.faces[face].texture]
									if (texture) {
										newElement.faces[face].texture = texture.uuid
									}
								} else if (
									defaultTexture &&
									newElement.faces?.[face].texture !== undefined
								) {
									newElement.faces[face].texture = defaultTexture.uuid
								}
							}
							break
						}
					}
				}
			}

			if (model.outliner) {
				parseGroups(model.outliner)
			}

			if (model.animations) {
				for (const animation of model.animations) {
					const newAnimation = new Blockbench.Animation()
					newAnimation.uuid = animation.uuid ?? guid()
					newAnimation.extend(animation).add()
				}
			}

			if (model.animation_controllers) {
				for (const controller of model.animation_controllers) {
					const newController = new Blockbench.AnimationController()
					newController.uuid = controller.uuid ?? guid()
					newController.extend(controller).add()
				}
			}

			if (model.animation_variable_placeholders) {
				// @ts-expect-error
				Interface.Panels.variable_placeholders.inside_vue._data.text =
					model.animation_variable_placeholders
			}

			if (model.front_gui_light) {
				Project.front_gui_light = model.front_gui_light
				// @ts-expect-error - Missing type
				DisplayMode.updateGUILight()
			}

			if (model.display_settings) {
				// @ts-expect-error
				DisplayMode.loadJSON(model.display_settings)
			}

			if (model.utility_display_settings) {
				Project.utility_display_settings = model.utility_display_settings
			}

			if (model.backgrounds) {
				for (const key in model.backgrounds) {
					if (Object.hasOwn(Project.backgrounds, key)) {
						const store = model.backgrounds[key]
						const real = Project.backgrounds[key]

						if (store.image !== undefined) {
							real.image = store.image
						}
						if (store.size !== undefined) {
							real.size = store.size
						}
						if (store.x !== undefined) {
							real.x = store.x
						}
						if (store.y !== undefined) {
							real.y = store.y
						}
						if (store.lock !== undefined) {
							real.lock = store.lock
						}
					}
				}
				Preview.all.forEach(p => {
					if (p.canvas.isConnected) {
						p.loadBackground()
					}
				})
			}

			Canvas.updateAll()
			Validator.validate()
			this.dispatchEvent!('parsed', { model })
		},

		// region compile
		compile(options) {
			if (!options) options = {}
			console.log(`Compiling Utility Model from ${Project!.name}...`)
			if (!Project) throw new Error('No project to compile.')

			const model = {
				meta: {
					format: UTILITY_MODEL_PROJECT_FORMAT_ID,
					format_version: PACKAGE.version,
					uuid: Project.uuid,
					project_save_path: Project.save_path,
					export_path: Project!.export_path,
				},
				options: Project.utility_model,
				resolution: {
					width: Project.texture_width || 16,
					height: Project.texture_height || 16,
				},
			} as UtilityModelProject.Json

			for (const key in ModelProject.properties) {
				if (ModelProject.properties[key].export)
					ModelProject.properties[key].copy(Project, model)
			}

			let allCollectionChildren: any[] = []
			if (options.collection_only) {
				allCollectionChildren = options.collection_only.getAllChildren()
			}

			model.elements = []
			for (const element of elements) {
				if (options.collection_only && !allCollectionChildren.includes(element)) return
				if (element instanceof Mesh) {
					model.elements.push(element.getSaveCopy?.())
				} else {
					model.elements.push(element.getSaveCopy?.(model.meta))
				}
			}

			model.outliner = compileGroups(true)
			if (options.collection_only) {
				const filterList = (list: any[]) => {
					list.forEachReverse(item => {
						if (typeof item == 'string') {
							if (!allCollectionChildren.find(node => node.uuid == item)) {
								list.remove(item)
							}
						} else {
							if (item.children instanceof Array) {
								filterList(item.children as any[])
							}
							if (
								item.uuid &&
								!allCollectionChildren.find(node => node.uuid == item.uuid)
							) {
								if (!item.children || item.children.length == 0) {
									list.remove(item)
								}
							}
						}
					})
				}
				filterList(model.outliner)
			}

			model.textures = []
			for (const texture of Texture.all) {
				const save = texture.getUndoCopy() as Texture
				delete save.selected
				if (Project.save_path && texture.path) {
					const relative = PathModule.relative(Project.save_path, texture.path)
					texture.relative_path = relative.replace(/\\/g, '/')
				}
				save.source = 'data:image/png;base64,' + texture.getBase64()
				save.internal = true
				if (options.absolute_paths === false) delete save.path
				model.textures.push(save)
			}

			for (const textureGroup of TextureGroup.all) {
				if (!model.texture_groups) model.texture_groups = []
				model.texture_groups.push(textureGroup.getSaveCopy())
			}

			const collections: any = []
			for (const collection of Collection.all) {
				collections.push(collection.getSaveCopy())
			}
			if (collections.length) model.collections = collections

			model.animations = [] as any
			const animationOptions = { bone_names: true, absolute_paths: options.absolute_paths }
			for (const animation of Blockbench.Animation.all) {
				if (!animation.getUndoCopy) continue
				model.animations.push(animation.getUndoCopy(animationOptions, true))
			}

			model.animation_controllers = []
			for (const controller of Blockbench.AnimationController.all) {
				if (!controller.getUndoCopy) continue
				model.animation_controllers.push(controller.getUndoCopy(animationOptions, true))
			}

			// @ts-expect-error
			if (Interface.Panels.variable_placeholders.inside_vue._data.text) {
				model.animation_variable_placeholders =
					// @ts-expect-error
					Interface.Panels.variable_placeholders.inside_vue._data.text
			}

			if (Project.front_gui_light) {
				model.front_gui_light = Project.front_gui_light
			}

			if (Object.keys(Project.display_settings).length > 0) {
				model.display_settings = Project.display_settings
			}

			if (Object.keys(Project.utility_display_settings).length > 0) {
				model.utility_display_settings = Project.utility_display_settings
			}

			if (!options.backup) {
				const backgrounds: Record<string, any> = {}
				for (const key in Project.backgrounds) {
					const scene = Project.backgrounds[key]
					if (scene.image) {
						backgrounds[key] = scene.getSaveCopy()
					}
				}
				if (Object.keys(backgrounds).length) {
					model.backgrounds = backgrounds
				}
			}

			return options.raw ? model : compileJSON(model)
		},

		// region export
		export() {
			console.log(`Exporting Utility Model for ${Project!.name}...`)
			if (!Project) throw new Error('No project to export.')
			Blockbench.export({
				resource_id: 'utility_model.export',
				name: (Project.name || 'unnamed') + '.utilityproject',
				startpath: Project.save_path,
				type: 'json',
				extensions: [this.extension],
				content: this.compile!(),
				// eslint-disable-next-line @typescript-eslint/naming-convention
				custom_writer: (content, path) => {
					if (fs.existsSync(PathModule.dirname(path))) {
						Project!.save_path = path
						this.write!(content, path)
					} else {
						log.error(
							`Failed to export Utility Model, file location '${path}' does not exist!`
						)
						Blockbench.showMessageBox({
							title: localize(
								'error.utility-model-format.failed-to-export-project.title'
							),
							message: localize(
								'error.utility-model-format.failed-to-export-project.description',
								localize('error.utility_model_format.invalid_export_path')
							),
						})
					}
				},
			})
		},

		// region afterSave
		afterSave(path) {
			const name = pathToName(path, true)
			Settings.updateSettingsInProfiles()
			if (this.remember) {
				addRecentProject({
					name,
					path: path,
					icon: UTILITY_MODEL_PROJECT_FORMAT.get()!.icon,
				})
				void updateRecentProjectThumbnail()
			}
			Project!.saved = true
			Blockbench.showQuickMessage(tl('message.save_file', [name]))
		},

		// region filename
		fileName() {
			if (!Project?.name) return 'unnamed_project.utilityproject'
			return `${Project.name}.utilityproject'`
		},
	}
)

EVENTS.UPDATE_PROJECT_SETTINGS.subscribe(formResult => {
	console.log('Updating project settings:', formResult)
	Canvas.updateAll()
})
