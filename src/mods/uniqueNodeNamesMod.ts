import { currentFormatIsUtilityModelProject } from '@utility/formats/utility-model-project/index.ts'
import {
	nextFreeName,
	requiresUniqueName,
	uniquelyNamedNodes,
} from '@utility/util/uniqueNodeNames.ts'
import { registerPatch, registerPropertyOverridePatch } from 'blockbench-patch-manager'

/** Turns on Blockbench's rename/paste/create uniqueness handling for every type but cubes and meshes. */
registerPatch({
	id: `utility_engine:unique-node-names/behavior`,
	apply: () => {
		const types = [Group, ...Object.values(OutlinerElement.types)].filter(
			type => type !== Cube && type !== Mesh
		) as Array<typeof OutlinerNode>
		const overrides = types.map(type =>
			type.addBehaviorOverride({
				condition: () => currentFormatIsUtilityModelProject(),
				behavior: { unique_name: true },
			})
		)
		return { overrides }
	},
	revert: ({ overrides }) => {
		for (const override of overrides) override.delete()
	},
})

/** Blockbench only compares names within a node's own type; compare across all of them instead. */
registerPropertyOverridePatch({
	id: `utility_engine:unique-node-names/create-unique-name`,
	target: OutlinerNode.prototype,
	key: 'createUniqueName',

	condition: () => currentFormatIsUtilityModelProject(),

	get: original => {
		return function (this: OutlinerNode, additional?: OutlinerNode[]) {
			if (!requiresUniqueName(this)) return original.call(this, additional)

			const others = uniquelyNamedNodes().filter(
				node => node !== this && node.scope === this.scope
			)
			others.push(...(additional ?? []).filter(node => node !== this))
			const taken = new Set(others.map(node => node.name.toLowerCase()))

			this.name = nextFreeName(this.name, name => taken.has(name.toLowerCase()))
			return this.name
		}
	},
})

/**
 * "Add Bounding Box" is the only add action that never calls `createUniqueName`. Rename the new
 * box right before the action's own `Undo.finishEdit`, so the rename is part of the same undo step.
 */
registerPropertyOverridePatch({
	id: `utility_engine:unique-node-names/add-bounding-box`,
	target: BarItems.add_bounding_box as Action,
	key: 'click',

	condition: () => currentFormatIsUtilityModelProject(),

	get: original => {
		return function (this: Action, event?: Event) {
			const existing = new Set(BoundingBox.all)
			const finishEdit = Undo.finishEdit
			Undo.finishEdit = function (this: typeof Undo, ...finishArgs: any[]) {
				Undo.finishEdit = finishEdit
				for (const box of BoundingBox.all) {
					if (!existing.has(box)) box.createUniqueName()
				}
				return finishEdit.apply(this, finishArgs as Parameters<typeof finishEdit>)
			}
			try {
				return original!.call(this, event)
			} finally {
				Undo.finishEdit = finishEdit
			}
		}
	},
})
