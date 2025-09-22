import { registerModelFormat } from '@blockbench-tools'
import { injectComponent } from '@utility/svelte/injectComponent'
import { createScopedTranslator } from '@utility/util/lang'
import { UTILITY_MODEL_PROJECT_CODEC } from './codec'
import FormatPage from './formatPage.svelte'
export { UTILITY_MODEL_PROJECT_CODEC as UTILITY_MODEL_CODEC } from './codec'

const localize = createScopedTranslator('model_format.utility_model')

import './icon'
import './settings'

export const UTILITY_MODEL_PROJECT_FORMAT_ID = 'utility-engine:format/utility-model-project'

export const currentFormatIsUtilityModelProject = () => {
	return Format === UTILITY_MODEL_PROJECT_FORMAT.get()
}

export function saveUtilityModelProject() {
	if (!Project || currentFormatIsUtilityModelProject()) return
	Animator.exportAnimationFile('')
	const codec = UTILITY_MODEL_PROJECT_CODEC.get()
	if (!codec) {
		throw new Error(
			'Tried to save as Utility Model project, but the Utility Model Project codec was not found!'
		)
	}
	codec.write(codec.compile(), Project.save_path)
}

export const UTILITY_MODEL_PROJECT_FORMAT = registerModelFormat(UTILITY_MODEL_PROJECT_FORMAT_ID, {
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
				// Hide the default format page title
				const hideTitleInterval = setInterval(() => {
					const title = $(
						`div[id="format_page_${UTILITY_MODEL_PROJECT_FORMAT_ID}"] h2`
					)[0]
					if (!title) return
					title.style.display = 'none'
					clearInterval(hideTitleInterval)
				})

				const unmountCallback = injectComponent({
					elementSelector() {
						return document.querySelector(
							`div[id="${UTILITY_MODEL_PROJECT_FORMAT_ID}/format_page_mount"]`
						)! as HTMLElement
					},
					component: FormatPage,
				})
				UTILITY_MODEL_PROJECT_FORMAT.onDeleted(() => {
					void unmountCallback()
					clearInterval(hideTitleInterval)
				})
			},
			template: `<div id="${UTILITY_MODEL_PROJECT_FORMAT_ID}/format_page_mount" style="display: flex; flex-direction: column; flex-grow: 1;"></div>`,
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

UTILITY_MODEL_PROJECT_FORMAT.onCreated(format => {
	const codec = UTILITY_MODEL_PROJECT_CODEC.get()
	if (!codec) {
		throw new Error(
			'Tried to associate Utility Model Project format with the Utility Model Project codec, but the codec was not found!'
		)
	}
	format.codec = codec
	codec.format = format
})

UTILITY_MODEL_PROJECT_FORMAT.onDeleted(() => {
	// @ts-expect-error
	UTILITY_MODEL_PROJECT_CODEC.format = undefined
})
