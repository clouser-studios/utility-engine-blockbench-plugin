import EVENTS from '@events'
import { registerPatch } from 'blockbench-patch-manager'
import { injectComponent } from 'svelte-patching-tools'
import DisplayModeButtons from './displayModeButtons.svelte'

let unmountCallback: (() => Promise<void>) | null = null

function mountDisplayModeButtons() {
	if (unmountCallback) return
	unmountCallback = injectComponent({
		prepend: true,
		component: DisplayModeButtons,
		elementSelector() {
			return document.querySelector<HTMLDivElement>('#preview')
		},
	})
}

async function unmountDisplayModeButtons() {
	if (!unmountCallback) return
	await unmountCallback()
	unmountCallback = null
}

registerPatch({
	id: 'utility-engine:display-mode-rotation-lock',
	apply: () => {
		const unsubscribe = EVENTS.SELECT_MODE.subscribe(({ mode }) => {
			if (mode.id === 'display') {
				mountDisplayModeButtons()
			} else {
				void unmountDisplayModeButtons()
			}
		})
		return { unsubscribe }
	},
	revert: async ({ unsubscribe }) => {
		unsubscribe()
		await unmountDisplayModeButtons()
	},
})
