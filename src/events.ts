declare global {
	interface BlockbenchEventMap {
		'utility_engine:loaded': void
		'utility_engine:unloaded': void

		'utility_engine:installed': void
		'utility_engine:uninstalled': void

		'utility_engine:other_plugin_loaded': BBPlugin
		'utility_engine:other_plugin_unloaded': BBPlugin
	}
}
