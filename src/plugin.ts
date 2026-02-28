import Title from '@assets/title.png'
import PACKAGE from '@package' with { type: 'json' }
import { log } from '@utility/util/log.ts'

const PLUGIN = BBPlugin.register(PACKAGE.name, {
	title: PACKAGE.title,
	author: PACKAGE.author.name,
	description: PACKAGE.description,
	icon: 'icon.png',
	variant: 'desktop',
	version: PACKAGE.version,
	min_version: PACKAGE.min_blockbench_version,
	tags: PACKAGE.tags as [string, string, string],
	onload() {
		// Wait until plugin system is done loading this plugin.
		requestAnimationFrame(() => {
			void log.img(
				{ url: Title, height: 44 },
				'\n\n Utility Engine v' + PACKAGE.version,
				'\n Created by',
				PACKAGE.author.name
			)
			Blockbench.dispatchEvent('loaded_plugin', { plugin: PLUGIN })
		})
	},
})
