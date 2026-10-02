import { currentFormatIsUtilityModelProject } from '@utility/formats/utility-model-project/index.ts'
import { BB } from '@utility/util/blockbenchCompat.ts'
import { registerPatch } from 'blockbench-patch-manager'

registerPatch({
	id: 'utility_engine:animation/disable-cross-group-drag',

	apply() {
		const vue = Panels.animations.vue as any
		const original = vue.dragAnimation as (e: MouseEvent | TouchEvent) => void

		vue.dragAnimation = function (this: any, e1: MouseEvent | TouchEvent) {
			if (!currentFormatIsUtilityModelProject()) {
				return original.call(this, e1)
			}

			// Resolve the dragged animation (same attribute the panel template uses)
			const target = (e1 as MouseEvent).target as HTMLElement | null
			const row = target?.closest?.('.animation') as HTMLElement | null
			const uuid = row?.getAttribute('anim_id')
			const anim = uuid ? BB.Animation.all.find(a => a.uuid === uuid) : undefined

			// Group header drag (reorder folders) — block if you don't want that either
			if (!anim) {
				return // or: return original.call(this, e1) to still allow group reorder
			}

			const sourceGroup = anim.group_name

			// Stock code calls Undo.finishEdit on mouseup; snap group back if it changed
			const originalFinishEdit = Undo.finishEdit
			let armed = true

			Undo.finishEdit = function (this: typeof Undo, ...args) {
				if (armed) {
					armed = false
					Undo.finishEdit = originalFinishEdit
					if (anim.group_name !== sourceGroup) {
						// Reject cross-group move: restore folder, keep list order change only if same group
						anim.group_name = sourceGroup
					}
				}
				return originalFinishEdit.apply(this, args)
			}

			try {
				return original.call(this, e1)
			} catch (err) {
				armed = false
				Undo.finishEdit = originalFinishEdit
				throw err
			}
		}

		return { original, vue }
	},

	revert({ original, vue }) {
		vue.dragAnimation = original
	},
})
