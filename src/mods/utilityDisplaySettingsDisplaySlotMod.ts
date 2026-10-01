import { currentFormatIsUtilityModelProject } from '@utility/formats/utility-model-project/index.ts'
import { registerPatch } from 'blockbench-patch-manager'

declare global {
	interface DisplaySlot {
		left_arm_rotation?: ArrayVector3
		left_arm_rotation_when_offhand_occupied?: ArrayVector3
		right_arm_rotation?: ArrayVector3
		right_arm_rotation_when_offhand_occupied?: ArrayVector3
		/** Custom string referencing another model to use for this slot. */
		overrides?: string
	}
}

const VECTOR_KEYS = [
	'left_arm_rotation',
	'left_arm_rotation_when_offhand_occupied',
	'right_arm_rotation',
	'right_arm_rotation_when_offhand_occupied',
] as const

const STRING_KEYS = ['overrides'] as const

const cloneVec = (vec: ArrayVector3 | undefined): ArrayVector3 | undefined =>
	vec ? [vec[0], vec[1], vec[2]] : undefined

/** Where the untouched native methods are stashed, so a botched hot-reload can't nest wrappers. */
const ORIGINALS = Symbol('utility_engine:display-slot-custom-field-originals')

type PatchedMethods = Pick<DisplaySlot, 'copy' | 'extend' | 'export' | 'default'>

/**
 * Blockbench's `DisplaySlot` knows nothing about the custom per-slot fields the utility
 * format adds (per-hand arm rotations, and an `overrides` model reference). Patch the
 * prototype so `copy`, `extend`, `export` and `default` carry those fields.
 *
 * Prototype patching (rather than subclassing + swapping the global) is deliberate:
 * Blockbench constructs slots from a closure-scoped `DisplaySlot` reference a plugin
 * can't reach, so a subclass swap only ever applied to slots the plugin itself built.
 *
 * With this, the fields survive undo/redo (Blockbench snapshots the `display_slots`
 * aspect via `copy()` and restores it via `extend()`) and `.utilityproject` save/load.
 */
registerPatch({
	id: 'utility_engine:display-slot-custom-fields',
	apply: () => {
		const proto = DisplaySlot.prototype as DisplaySlot & { [ORIGINALS]?: PatchedMethods }

		const original: PatchedMethods = proto[ORIGINALS] ?? {
			copy: proto.copy,
			extend: proto.extend,
			export: proto.export,
			default: proto.default,
		}
		proto[ORIGINALS] = original

		proto.copy = function (this: DisplaySlot) {
			const base = original.copy.call(this) as Record<string, unknown>
			if (currentFormatIsUtilityModelProject()) {
				// Keep the key even when unset so `extend()` can clear it on undo.
				for (const key of VECTOR_KEYS) base[key] = cloneVec(this[key])
				for (const key of STRING_KEYS) base[key] = this[key]
			}
			return base as ReturnType<DisplaySlot['copy']>
		}

		proto.extend = function (this: DisplaySlot, data?: DisplaySlotOptions) {
			// Native `extend` no-ops on a nullish argument; the `!` only quiets the lint.
			original.extend.call(this, data!)
			if (currentFormatIsUtilityModelProject() && data) {
				const source = data as Record<string, unknown>
				for (const key of VECTOR_KEYS) {
					if (key in source) this[key] = cloneVec(source[key] as ArrayVector3 | undefined)
				}
				for (const key of STRING_KEYS) {
					if (key in source) this[key] = source[key] as string | undefined
				}
			}
			return this
		}

		proto.export = function (this: DisplaySlot) {
			const base = original.export.call(this)
			if (!currentFormatIsUtilityModelProject()) return base
			const build = (base ?? {}) as Record<string, unknown>
			for (const key of VECTOR_KEYS) {
				const value = cloneVec(this[key])
				if (value) build[key] = value
			}
			for (const key of STRING_KEYS) {
				if (this[key]) build[key] = this[key]
			}
			return (Object.keys(build).length ? build : undefined) as ReturnType<
				DisplaySlot['export']
			>
		}

		proto.default = function (this: DisplaySlot) {
			original.default.call(this)
			if (currentFormatIsUtilityModelProject()) {
				for (const key of [...VECTOR_KEYS, ...STRING_KEYS]) this[key] = undefined
			}
			return this
		}

		return { proto, original }
	},

	revert: ({ proto, original }) => {
		Object.assign(proto, original)
		delete (proto as DisplaySlot & { [ORIGINALS]?: PatchedMethods })[ORIGINALS]
	},
})
