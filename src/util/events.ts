import { subscribable } from './subscribable'

// Plugin Events
const EVENTS = {
	PLUGIN_LOAD: subscribable<void>(),
	PLUGIN_FINISHED_LOADING: subscribable<void>(),

	PLUGIN_UNLOAD: subscribable<void>(),
	PLUGIN_FINISHED_UNLOADING: subscribable<void>(),

	INSTALL: subscribable<void>(),
	UNINSTALL: subscribable<void>(),

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
Blockbench.on<EventName>('undo', ({ entry }: { entry: UndoEntry }) => {
	EVENTS.UNDO.publish(entry)
})
Blockbench.on<EventName>('redo', ({ entry }: { entry: UndoEntry }) => {
	EVENTS.REDO.publish(entry)
})
