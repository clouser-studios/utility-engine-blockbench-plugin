import PACKAGE from '@package' with { type: 'json' }
import { subscribable } from 'simple-subpub'

// Plugin Events
const EVENTS = {
	THIS_PLUGIN_LOADED: subscribable<void>(),
	THIS_PLUGIN_UNLOADED: subscribable<void>(),

	THIS_PLUGIN_INSTALLED: subscribable<void>(),
	THIS_PLUGIN_UNINSTALLED: subscribable<void>(),

	EXTERNAL_PLUGIN_LOAD: subscribable<BBPlugin>(),
	EXTERNAL_PLUGIN_UNLOAD: subscribable<BBPlugin>(),

	PRE_SELECT_PROJECT: subscribable<ModelProject>(),
	POST_SELECT_PROJECT: subscribable<ModelProject>(),
	SELECT_PROJECT: subscribable<ModelProject>(),
	UNSELECT_PROJECT: subscribable<ModelProject>(),
	CLOSE_PROJECT: subscribable<ModelProject>(),

	UPDATE_PROJECT_SETTINGS: subscribable<Record<string, any>>(),

	SELECT_MODE: subscribable<{ mode: Mode }>(),

	DISPLAY_SLOT_CHANGED: subscribable<{ slot: DisplaySlotName; previous: DisplaySlotName }>(),
	REF_MODEL_CHANGED: subscribable<{
		refModel: refModel<keyof typeof displayReferenceObjects.refmodels>
	}>(),
	DISPLAY_SETTINGS_UPDATED: subscribable<DisplaySlot>(),

	UNDO: subscribable<UndoEntry>(),
	REDO: subscribable<UndoEntry>(),
}
export default EVENTS

Blockbench.on('loaded_plugin', ({ plugin }) => {
	if (plugin.id === PACKAGE.name) {
		EVENTS.THIS_PLUGIN_LOADED.publish()
	} else {
		EVENTS.EXTERNAL_PLUGIN_LOAD.publish(plugin)
	}
})
Blockbench.on('unloaded_plugin', ({ plugin }) => {
	if (plugin.id === PACKAGE.name) {
		EVENTS.THIS_PLUGIN_UNLOADED.publish()
	} else {
		EVENTS.EXTERNAL_PLUGIN_UNLOAD.publish(plugin)
	}
})
Blockbench.on('select_project', ({ project }: { project: ModelProject }) => {
	EVENTS.SELECT_PROJECT.publish(project)
})
Blockbench.on('unselect_project', ({ project }: { project: ModelProject }) => {
	EVENTS.UNSELECT_PROJECT.publish(project)
})
Blockbench.on('update_project_settings', formResult => {
	EVENTS.UPDATE_PROJECT_SETTINGS.publish(formResult)
})
Blockbench.on('select_mode', ({ mode }: { mode: Mode }) => {
	EVENTS.SELECT_MODE.publish({ mode })
})
Blockbench.on('undo', ({ entry }: { entry: UndoEntry }) => {
	EVENTS.UNDO.publish(entry)
})
Blockbench.on('redo', ({ entry }: { entry: UndoEntry }) => {
	EVENTS.REDO.publish(entry)
})
