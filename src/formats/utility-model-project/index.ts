import { type ContextProperty, createBlockbenchMod } from '@blockbench-tools'
import { injectComponent } from '@utility/svelte/injectComponent'
import { createScopedTranslator } from '@utility/util/lang'
import { UTILITY_MODEL_PROJECT_CODEC } from './codec'
import FormatPage from './formatPage.svelte'
export { UTILITY_MODEL_PROJECT_CODEC as UTILITY_MODEL_CODEC } from './codec'

const localize = createScopedTranslator('model_format.utility_model')

import './icon'
import './settings'

// Hide the default format page title
const INTERVAL = setInterval(() => {
	const title = $('div[id="format_page_utility-engine:utility_model"] h2')[0]
	if (!title) return
	title.style.display = 'none'
	clearInterval(INTERVAL)
})

export function saveUtilityModelProject() {
	if (!Project || UTILITY_MODEL_PROJECT_FORMAT.isCurrentFormat()) return
	Animator.exportAnimationFile('')
	UTILITY_MODEL_PROJECT_CODEC.write(UTILITY_MODEL_PROJECT_CODEC.compile(), Project.save_path)
}

export const UTILITY_MODEL_PROJECT_FORMAT = new Blockbench.ModelFormat({
	id: `utility-engine:utility_model`,
	name: localize('name'),
	icon: 'fa-gear',
	category: 'utility-engine',
	target: 'Minecraft: Java Edition',
	confidential: false,
	convertTo() {
		console.log('Converting to Utility Model format')
	},
	condition: () => true,
	show_on_start_screen: true,
	format_page: {
		component: {
			created() {
				void injectComponent({
					elementSelector() {
						return $(`div[id="utility-engine:utility_model/format_page_mount"]`)[0]
					},
					component: FormatPage,
				})
			},
			template: `<div id="utility-engine:utility_model/format_page_mount" style="display: flex; flex-direction: column; flex-grow: 1;"></div>`,
		},
	},

	onSetup() {
		console.log('Utility Model format setup')
	},

	onActivation() {
		console.log('Utility Model format activated')
		Project!.utility_display_settings ??= {} as any
	},

	animated_textures: false,
	animation_controllers: false,
	animation_files: true,
	texture_mcmeta: true,
	animation_mode: true,
	bone_binding_expression: false,
	bone_rig: true,
	box_uv: false,
	centered_grid: true,
	display_mode: true,
	edit_mode: true,
	integer_size: false,
	java_face_properties: true,
	locators: false,
	meshes: true,
	model_identifier: false,
	optional_box_uv: true,
	paint_mode: true,
	parent_model_id: false,
	pose_mode: false,
	render_sides: 'front',
	rotate_cubes: true,
	rotation_limit: false,
	select_texture_for_particles: true,
	single_texture: false,
	texture_folder: false,
	texture_meshes: false,
	uv_rotation: true,
	vertex_color_ambient_occlusion: true,
})

UTILITY_MODEL_PROJECT_FORMAT.codec = UTILITY_MODEL_PROJECT_CODEC
UTILITY_MODEL_PROJECT_CODEC.format = UTILITY_MODEL_PROJECT_FORMAT

createBlockbenchMod({
	id: `utility-engine:utility-model/model-format-properties`,
	collectContext: () => ({
		modelIdentifierProperty: undefined as ContextProperty<'string'>,
		defaultBackfaceCullingModeProperty: undefined as ContextProperty<'string'>,
	}),
	apply: ctx => {
		ctx.modelIdentifierProperty = new Property(ModelProject, 'string', 'model_identifier', {
			label: localize('project_settings.model_identifier'),
			condition: {
				formats: [UTILITY_MODEL_PROJECT_FORMAT.id],
			},
		})
		ctx.defaultBackfaceCullingModeProperty = new Property(
			ModelProject,
			'string',
			'default_backface_culling_mode',
			{
				label: localize('project_settings.default_backface_culling_mode.title'),
				condition: {
					formats: [UTILITY_MODEL_PROJECT_FORMAT.id],
				},
				options: {
					no_culling: localize(
						'project_settings.default_backface_culling_mode.options.no_culling'
					),
					cull_backfaces: localize(
						'project_settings.default_backface_culling_mode.options.cull_backfaces'
					),
				},
				default: false,
			}
		)
		return ctx
	},
	revert: ctx => {
		ctx.modelIdentifierProperty?.delete()
		ctx.defaultBackfaceCullingModeProperty?.delete()
	},
})
