import '@blockbench-tools'
import EVENTS from '@events'
import { PACKAGE } from '@package'

//-------------------------------
// Import your source files here
//-------------------------------

// Formats
// TODO - Replace this with a recursive import once the utility-model format is functional.
import './formats/utility-model-project'

// Mods
import './mods//'

// Misc
import './textures//'

// Provide a global object for other plugins to interact with
// @ts-expect-error
window.UtilityEngine = {
	events: EVENTS,
}
declare global {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	const UtilityEngine: {
		events: typeof EVENTS
	}
}

BBPlugin.register(PACKAGE.name, {
	title: PACKAGE.title,
	author: PACKAGE.author.name,
	description: PACKAGE.description,
	icon: 'icon.png',
	variant: 'desktop',
	version: PACKAGE.version,
	min_version: PACKAGE.min_blockbench_version,
	tags: PACKAGE.tags as [string, string, string],
	onload() {
		EVENTS.LOAD.dispatch()
	},
	onunload() {
		EVENTS.UNLOAD.dispatch()
	},
	oninstall() {
		EVENTS.INSTALL.dispatch()
	},
	onuninstall() {
		EVENTS.UNINSTALL.dispatch()
	},
})
