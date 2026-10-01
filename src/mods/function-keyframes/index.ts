import EVENTS from '@events'
import { currentFormatIsUtilityModelProject } from '@utility/formats/utility-model-project/index.ts'
import { registerPatch } from 'blockbench-patch-manager'
import { injectComponent } from 'svelte-patching-tools'
import { COMMANDS_CHANNEL } from './channel.ts'
import FunctionKeyframePanel from './functionKeyframePanel.svelte'
import './locatorAnimator.ts'

let unmountPanel: (() => Promise<void>) | null = null
let panelKeyframe: _Keyframe | undefined
let queue = Promise.resolve()

async function updatePanel() {
	const keyframe = Timeline.selected.at(0)
	const show =
		currentFormatIsUtilityModelProject() &&
		!!keyframe &&
		Timeline.selected.every(kf => kf.channel === COMMANDS_CHANNEL)

	// Editing fires `update_keyframe_selection`; remounting then would drop the input's focus.
	const editing = Panels.keyframe?.node.contains(document.activeElement)
	if (show && keyframe === panelKeyframe && editing) return

	await unmountPanel?.()
	unmountPanel = null
	panelKeyframe = undefined
	if (!show) return

	panelKeyframe = keyframe
	unmountPanel = injectComponent({
		component: FunctionKeyframePanel,
		elementSelector: () => Panels.keyframe?.node,
	})
}

/** Serialized, since selection events can arrive while a mount is still in flight. */
const requestPanelUpdate = () => {
	queue = queue.then(updatePanel)
}

registerPatch({
	id: `utility_engine:function-keyframes/panel`,
	apply: () => {
		const unsubscribers = [
			EVENTS.UPDATE_KEYFRAME_SELECTION.subscribe(requestPanelUpdate),
			EVENTS.SELECT_PROJECT.subscribe(requestPanelUpdate),
			EVENTS.UNDO.subscribe(requestPanelUpdate),
			EVENTS.REDO.subscribe(requestPanelUpdate),
		]
		return { unsubscribers }
	},
	revert: async ({ unsubscribers }) => {
		for (const unsubscribe of unsubscribers) unsubscribe()
		await queue
		await unmountPanel?.()
		unmountPanel = null
		panelKeyframe = undefined
	},
})
