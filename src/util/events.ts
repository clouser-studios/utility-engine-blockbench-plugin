import PACKAGE from '@package'
import { subscribable } from './subscribable'

// Plugin Events
const EVENTS = {
	LOAD: subscribable<void>(),
	UNLOAD: subscribable<void>(),
	INSTALL: subscribable<void>(),
	UNINSTALL: subscribable<void>(),

	INSTALL_MODS: subscribable<void>(),
	UNINSTALL_MODS: subscribable<void>(),

	SELECT_PROJECT: subscribable<ModelProject>(),
	UNSELECT_PROJECT: subscribable<ModelProject>(),

	UPDATE_PROJECT_SETTINGS: subscribable<Record<string, any>>(),

	SELECT_MODE: subscribable<{ mode: Mode }>(),

	DISPLAY_SLOT_CHANGED: subscribable<{ slot: DisplaySlotName; previous: DisplaySlotName }>(),
}
export default EVENTS

function injectionHandler() {
	console.groupCollapsed(`Injecting BlockbenchMods added by '${PACKAGE.name}'`)
	EVENTS.INSTALL_MODS.publish()
	console.groupEnd()
}

function extractionHandler() {
	console.groupCollapsed(`Extracting BlockbenchMods added by '${PACKAGE.name}'`)
	EVENTS.UNINSTALL_MODS.publish()
	console.groupEnd()
}

EVENTS.LOAD.subscribe(injectionHandler)
EVENTS.UNLOAD.subscribe(extractionHandler)
EVENTS.INSTALL.subscribe(injectionHandler)
EVENTS.UNINSTALL.subscribe(extractionHandler)

Blockbench.on<EventName>('select_project', ({ project }: { project: ModelProject }) => {
	EVENTS.SELECT_PROJECT.publish(project)
})
Blockbench.on<EventName>('unselect_project', ({ project }: { project: ModelProject }) => {
	EVENTS.UNSELECT_PROJECT.publish(project)
})
Blockbench.on<EventName>('update_project_settings', formResult => {
	EVENTS.UPDATE_PROJECT_SETTINGS.publish(formResult)
})
Blockbench.on<EventName>('select_mode', ({ mode }: { mode: Mode }) => {
	EVENTS.SELECT_MODE.publish({ mode })
})
