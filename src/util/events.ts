import { subscribable } from './subscribable'

// Plugin Events
const EVENTS = {
	LOAD: subscribable<void>(),
	FINISHED_LOADING: subscribable<void>(),

	UNLOAD: subscribable<void>(),
	FINISHED_UNLOADING: subscribable<void>(),

	INSTALL: subscribable<void>(),
	UNINSTALL: subscribable<void>(),

	SELECT_PROJECT: subscribable<ModelProject>(),
	UNSELECT_PROJECT: subscribable<ModelProject>(),

	UPDATE_PROJECT_SETTINGS: subscribable<Record<string, any>>(),

	SELECT_MODE: subscribable<{ mode: Mode }>(),

	DISPLAY_SLOT_CHANGED: subscribable<{ slot: DisplaySlotName; previous: DisplaySlotName }>(),
	REF_MODEL_CHANGED: subscribable<{
		refModel: refModel<keyof typeof displayReferenceObjects.refmodels>
	}>(),
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
