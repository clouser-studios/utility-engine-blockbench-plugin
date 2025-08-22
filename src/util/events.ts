import { PACKAGE } from '@package'
import { Subscribable } from './subscribable'

export class PluginEvent<EventData = void> extends Subscribable<EventData> {
	protected static events: Record<string, PluginEvent<any>> = {}
	constructor(public name: string) {
		super()
		PluginEvent.events[name] = this
	}
}

// Plugin Events
const EVENTS = {
	LOAD: new PluginEvent('load'),
	UNLOAD: new PluginEvent('unload'),
	INSTALL: new PluginEvent('install'),
	UNINSTALL: new PluginEvent('uninstall'),

	INJECT_MODS: new PluginEvent('injectMods'),
	EXTRACT_MODS: new PluginEvent('extractMods'),

	SELECT_PROJECT: new PluginEvent<ModelProject>('selectProject'),
	UNSELECT_PROJECT: new PluginEvent<ModelProject>('deselectProject'),

	UPDATE_PROJECT_SETTINGS: new PluginEvent<Record<string, any>>('updateProjectSettings'),

	SELECT_MODE: new PluginEvent<{ mode: Mode }>('selectMode'),
}
export default EVENTS

function injectionHandler() {
	console.groupCollapsed(`Injecting BlockbenchMods added by '${PACKAGE.name}'`)
	EVENTS.INJECT_MODS.dispatch()
	console.groupEnd()
}

function extractionHandler() {
	console.groupCollapsed(`Extracting BlockbenchMods added by '${PACKAGE.name}'`)
	EVENTS.EXTRACT_MODS.dispatch()
	console.groupEnd()
}

EVENTS.LOAD.subscribe(injectionHandler)
EVENTS.UNLOAD.subscribe(extractionHandler)
EVENTS.INSTALL.subscribe(injectionHandler)
EVENTS.UNINSTALL.subscribe(extractionHandler)

Blockbench.on<EventName>('select_project', ({ project }: { project: ModelProject }) => {
	EVENTS.SELECT_PROJECT.dispatch(project)
})
Blockbench.on<EventName>('unselect_project', ({ project }: { project: ModelProject }) => {
	EVENTS.UNSELECT_PROJECT.dispatch(project)
})
Blockbench.on<EventName>('update_project_settings', formResult => {
	EVENTS.UPDATE_PROJECT_SETTINGS.dispatch(formResult)
})
Blockbench.on<EventName>('select_mode', ({ mode }: { mode: Mode }) => {
	EVENTS.SELECT_MODE.dispatch({ mode })
})
