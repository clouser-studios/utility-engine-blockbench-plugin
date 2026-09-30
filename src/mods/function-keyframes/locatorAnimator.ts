import { currentFormatIsUtilityModelProject } from '@utility/formats/utility-model-project/index.ts'
import { BB } from '@utility/util/blockbenchCompat.ts'
import { localize } from '@utility/util/lang.ts'
import { registerPropertyOverridePatch } from 'blockbench-patch-manager'
import { COMMANDS_CHANNEL } from './channel.ts'

/** Gives locators a timeline row that only holds function keyframes. Ported from Animated Java. */
export class LocatorAnimator extends BoneAnimator {
	element: Locator | undefined

	getElement() {
		this.element = OutlinerNode.uuids[this.uuid] as Locator | undefined
		return this.element
	}

	select() {
		this.getElement()
		if (!this.element) {
			unselectAllElements()
			return this
		}
		if (this.element.locked) return this

		if (!this.element.selected) this.element.select()
		GeneralAnimator.prototype.select.call(this)

		if (this.element.parent && this.element.parent !== 'root') {
			this.element.parent.openUp()
		}
		return this
	}

	doRender() {
		return !!this.getElement()?.mesh
	}

	displayPosition() {
		return this
	}

	interpolate(): ArrayVector3 {
		return [0, 0, 0]
	}

	/** Function keyframes don't move anything, so there's nothing to preview. */
	displayFrame() {
		return
	}

	showMotionTrail() {
		return
	}
}
LocatorAnimator.prototype.type = 'locator'
LocatorAnimator.prototype.channels = {
	[COMMANDS_CHANNEL]: {
		name: localize('timeline.commands'),
		mutable: true,
		transform: false,
		max_data_points: 1,
	},
}

registerPropertyOverridePatch({
	id: `utility-engine:locator/animator`,
	target: Locator,
	key: 'animator',

	condition: () => currentFormatIsUtilityModelProject(),

	get: () => LocatorAnimator as unknown as BoneAnimator,
})

/** Selecting a locator in Animate mode shows its row in the timeline, like a group. */
registerPropertyOverridePatch({
	id: `utility-engine:locator/select`,
	target: Locator.prototype,
	key: 'select',

	condition: () => currentFormatIsUtilityModelProject(),

	get: original => {
		return function (this: Locator, event?: Event, isOutlinerClick?: boolean) {
			const result = original.call(this, event, isOutlinerClick)
			if (Animator.open) BB.Animation.selected?.getBoneAnimator(this)?.select()
			return result
		}
	},
})

/** Mirrors how `Animator.showMotionTrail` picks its target when called without one. */
function defaultMotionTrailTarget(): OutlinerNode | undefined {
	const locked = Project?.motion_trail_lock && OutlinerNode.uuids[Project.motion_trail_lock]
	return locked || Group.first_selected || Outliner.selected.at(0)
}

/** Locators have no position keyframes to trace, whether passed in or picked from the selection. */
registerPropertyOverridePatch({
	id: `utility-engine:animator/show-motion-trail`,
	target: Animator,
	key: 'showMotionTrail',

	condition: () => currentFormatIsUtilityModelProject(),

	get: original => {
		// The typings omit `fast`, but Blockbench passes it.
		const showMotionTrail = original as (target?: Group, fast?: boolean) => void
		return function (target?: Group, fast?: boolean) {
			if ((target ?? defaultMotionTrailTarget()) instanceof Locator) return
			return showMotionTrail(target, fast)
		}
	},
})
