import {
	injectSvelteCompomponent,
	injectSvelteCompomponentMod,
} from '../../util/injectSvelteComponent'
import PACKAGE from '../../../package.json'
import FormatPage from './svelte/formatPage.svelte'
import Icon from './svelte/icon.svelte'
import { translate } from '../../util/translation'
import { ContextProperty, createBlockbenchMod } from '../../util/moddingTools'

// Delete default format page title
const INTERVAL = setInterval(() => {
	const title = $('#format_page_utility_model h2')[0]
	if (!title) return
	title.remove()
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

// region > Format
export const UTILITY_MODEL_FORMAT = new Blockbench.ModelFormat({
	id: 'utility_model',
	name: translate('model_format.utility_model.name'),
	icon: 'fa-gear',
	category: 'utility',
	target: 'Minecraft: Java Edition',
	confidential: false,
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

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	onSetup(project, newModel) {
		console.log('Utility Model format setup')
	},

	onActivation() {
		console.log('Utility Model format activated')
	},

	codec: Codecs.project,

	animated_textures: false,
	animation_controllers: false,
	animation_files: false,
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
	meshes: false,
	model_identifier: false,
	optional_box_uv: false,
	paint_mode: true,
	parent_model_id: false,
	pose_mode: false,
	render_sides: 'front',
	rotate_cubes: true,
	rotation_limit: false,
	select_texture_for_particles: false,
	single_texture: false,
	texture_folder: false,
	texture_meshes: false,
	uv_rotation: true,
	vertex_color_ambient_occlusion: true,
})

createBlockbenchMod(
	`${PACKAGE.name}:utility_model_model_format_properties`,
	{
		modelIdentifierProperty: undefined as ContextProperty<'string'>,
	},
	context => {
		context.modelIdentifierProperty = new Property(ModelProject, 'string', 'model_identifier', {
			label: translate('model_format.utility_model.project_settings.model_identifier'),
			condition: {
				formats: [UTILITY_MODEL_FORMAT.id],
			},
		})
		return context
	},
	context => {
		context.modelIdentifierProperty?.delete()
	}
)
