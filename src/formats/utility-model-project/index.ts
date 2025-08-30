import { type ContextProperty, createBlockbenchMod } from '@blockbench-tools'
import { PACKAGE } from '@package'
import {
	injectSvelteCompomponent,
	injectSvelteCompomponentMod,
} from '@utility/util/injectSvelteComponent'
import { translate } from '@utility/util/translation'
import { UTILITY_MODEL_PROJECT_CODEC } from './codec'
import FormatPage from './svelte/formatPage.svelte'
import Icon from './svelte/icon.svelte'
export { UTILITY_MODEL_PROJECT_CODEC as UTILITY_MODEL_CODEC } from './codec'

import './settings'

// Hide the default format page title
const INTERVAL = setInterval(() => {
	const title = $('#format_page_utility_model h2')[0]
	if (!title) return
	title.style.display = 'none'
	clearInterval(INTERVAL)
})

// Format Category Icon
injectSvelteCompomponentMod({
	component: Icon,
	props: {},
	elementSelector() {
		$('[format=utility_model] span')[0]?.remove()
		return $('[format=utility_model]')[0]
	},
	prepend: true,
})

export function saveUtilityModelProject() {
	if (!Project || UTILITY_MODEL_PROJECT_FORMAT.isCurrentFormat()) return
	Animator.exportAnimationFile('')
	UTILITY_MODEL_PROJECT_CODEC.write(UTILITY_MODEL_PROJECT_CODEC.compile(), Project.save_path)
}

// region > Format
export const UTILITY_MODEL_PROJECT_FORMAT = new Blockbench.ModelFormat({
	id: `${PACKAGE.name}:utility_model`,
	name: translate('model_format.utility_model.name'),
	icon: 'fa-gear',
	category: 'utility',
	target: 'Minecraft: Java Edition',
	confidential: false,
	convertTo() {
		console.log('Converting to Utility Model format')
		console.log(Blockbench.Animation)
	},
	condition: () => true,
	show_on_start_screen: true,
	format_page: {
		component: {
			methods: {},
			created() {
				void injectSvelteCompomponent({
					elementSelector: () => $(`#format_page_${PACKAGE.name}_mount`)[0],
					component: FormatPage,
					props: {},
				})
			},
			template: `<div id="format_page_${PACKAGE.name}_mount" style="display: flex; flex-direction: column; flex-grow: 1;"></div>`,
		},
	},

	onSetup(_project, _newModel) {
		console.log('Utility Model format setup')
	},

	onActivation() {
		console.log('Utility Model format activated')
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

createBlockbenchMod(
	`${PACKAGE.name}:utility_model_model_format_properties`,
	{
		modelIdentifierProperty: undefined as ContextProperty<'string'>,
		defaultBackfaceCullingModeProperty: undefined as ContextProperty<'string'>,
	},
	context => {
		context.modelIdentifierProperty = new Property(ModelProject, 'string', 'model_identifier', {
			label: translate('model_format.utility_model.project_settings.model_identifier'),
			condition: {
				formats: [UTILITY_MODEL_PROJECT_FORMAT.id],
			},
		})
		context.defaultBackfaceCullingModeProperty = new Property(
			ModelProject,
			'string',
			'default_backface_culling_mode',
			{
				label: translate(
					'model_format.utility_model.project_settings.default_backface_culling_mode.title'
				),
				condition: {
					formats: [UTILITY_MODEL_PROJECT_FORMAT.id],
				},
				options: {
					no_culling: translate(
						'model_format.utility_model.project_settings.default_backface_culling_mode.options.no_culling'
					),
					cull_backfaces: translate(
						'model_format.utility_model.project_settings.default_backface_culling_mode.options.cull_backfaces'
					),
				},
				default: false,
			}
		)
		return context
	},
	context => {
		context.modelIdentifierProperty?.delete()
		context.defaultBackfaceCullingModeProperty?.delete()
	}
)
