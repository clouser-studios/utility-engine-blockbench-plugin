import { createScopedTranslator } from '@utility/util/lang.ts'
import { registerDeletableHandlerPatch } from 'blockbench-patch-manager'
import { mount, unmount } from 'svelte'
import { UTILITY_MODEL_PROJECT_CODEC } from './codec.ts'
import './conversion.ts'
import FormatPage from './formatPage.svelte'
import './icon.ts'
import './settings.ts'
export { UTILITY_MODEL_PROJECT_CODEC } from './codec.ts'

const localize = createScopedTranslator('model_format.utility_model')

export const UTILITY_MODEL_PROJECT_FORMAT_ID = 'utility_engine:format/utility-model-project'

export const currentFormatIsUtilityModelProject = () => {
	// Compare by id, not instance: blockbench-patch-manager can re-create the
	// format (a new `ModelFormat`) when patches re-apply, leaving an already-open
	// project pointing at the previous instance.
	return Format?.id === UTILITY_MODEL_PROJECT_FORMAT_ID
}

export function saveUtilityModelProject() {
	if (!Project || !currentFormatIsUtilityModelProject()) return
	Animator.exportAnimationFile('')
	const codec = UTILITY_MODEL_PROJECT_CODEC.get()
	if (!codec) {
		throw new Error(
			'Tried to save as Utility Model project, but the Utility Model Project codec was not found!'
		)
	}
	if (Project.save_path) {
		codec.write(codec.compile(), Project.save_path)
	} else {
		codec.export()
	}
}

export const UTILITY_MODEL_PROJECT_FORMAT = registerDeletableHandlerPatch({
	id: UTILITY_MODEL_PROJECT_FORMAT_ID,
	dependencies: [`utility_engine:codec/utility-model-project`],
	create: () => {
		let mountedComponent: ReturnType<typeof mount> | null = null
		let titleElement: HTMLElement | null = null

		const format = new ModelFormat(UTILITY_MODEL_PROJECT_FORMAT_ID, {
			name: localize('name'),
			icon: 'fa-gear',
			category: 'utility-engine',
			target: 'Minecraft: Java Edition',
			confidential: false,
			condition: () => true,
			show_on_start_screen: true,
			format_page: {
				component: {
					mounted(this: Vue) {
						const target = this.$el.parentElement!
						titleElement = target.querySelector('h2')
						if (titleElement) titleElement.hidden = true
						mountedComponent = mount(FormatPage, { target })
					},
					destroyed(this: Vue) {
						if (titleElement) titleElement.hidden = false
						if (mountedComponent) {
							void unmount(mountedComponent)
							mountedComponent = null
						}
					},
				},
			},

			onSetup() {
				console.log('Utility Model format setup')
			},

			onActivation() {
				console.log('Utility Model format activated')
			},

			animated_textures: true,
			animation_controllers: false,
			animation_files: false,
			animation_grouping: 'custom',
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
			locators: true,
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
			billboards: true,
			cullfaces: true,
			armature_rig: true,
			bounding_boxes: true,
			vertex_color_ambient_occlusion: true,
		})

		const codec = UTILITY_MODEL_PROJECT_CODEC.get()
		if (!codec) {
			throw new Error(
				'Tried to associate Utility Model Project format with the Utility Model Project codec, but the codec was not found!'
			)
		}
		format.codec = codec
		codec.format = format

		return format
	},
})
