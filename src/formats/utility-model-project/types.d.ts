import { type latest as UtilityProject } from './versions/latest'

declare global {
	interface ModelProject {
		utility_model: UtilityProject.UtilityProjectSettings
		default_backface_culling_mode?: 'no_culling' | 'cull_backfaces'
		utility_display_settings: Record<DisplaySlotName, UtilityProject.UtilityDisplaySettings>
	}
}
