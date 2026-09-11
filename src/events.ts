declare global {
	interface BlockbenchEventMap {
		'utility-engine:loaded': void
		'utility-engine:unloaded': void

		'utility-engine:installed': void
		'utility-engine:uninstalled': void

		'utility-engine:other_plugin_loaded': BBPlugin
		'utility-engine:other_plugin_unloaded': BBPlugin
	}
}
