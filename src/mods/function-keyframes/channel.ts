import { currentFormatIsUtilityModelProject } from '@utility/formats/utility-model-project/index.ts'
import { localize } from '@utility/util/lang.ts'
import { registerPatch } from 'blockbench-patch-manager'

/**
 * Channel id for function keyframes. Not `function`: Animated Java adds and deletes an effects
 * channel with that id whenever a Blueprint project is selected or left.
 */
export const COMMANDS_CHANNEL = 'commands'

declare global {
	interface KeyframeDataPoint {
		/** Newline-separated commands. */
		commands?: string
		/** An `execute` subcommand chain, e.g. `if score @s x matches 1..`. */
		condition?: string
	}
}

const isCommandsPoint = (point: KeyframeDataPoint) => point.keyframe.channel === COMMANDS_CHANNEL

registerPatch({
	id: `utility-engine:function-keyframes/channel`,
	apply: () => {
		EffectAnimator.addChannel(COMMANDS_CHANNEL, {
			name: localize('timeline.commands'),
			condition: () => currentFormatIsUtilityModelProject(),
			mutable: true,
			max_data_points: 1,
		})

		// Edited in the injected keyframe panel, not Blockbench's single-line inputs.
		const properties = [
			new Property(KeyframeDataPoint, 'string', 'commands', {
				default: '',
				exposed: false,
				condition: isCommandsPoint,
			}),
			new Property(KeyframeDataPoint, 'string', 'condition', {
				default: '',
				exposed: false,
				condition: isCommandsPoint,
			}),
		]

		return { properties }
	},
	revert: ({ properties }) => {
		delete EffectAnimator.prototype.channels[COMMANDS_CHANNEL]
		for (const property of properties) property.delete()
	},
})
