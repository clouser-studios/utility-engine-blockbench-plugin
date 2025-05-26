import { PACKAGE } from './package'
import EVENTS from './util/events'
import './util/moddingTools'

//-------------------------------
// Import your source files here
//-------------------------------

// Formats
import './formats/utilityProject'

// Mods
import './mods'

// Misc
import './textures/skinTexture'

// Provide a global object for other plugins to interact with
// @ts-expect-error
window.UtilityEngine = {
	events: EVENTS,
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
