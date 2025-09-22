import Title from '@assets/title.png'
import EVENTS from '@events'
import PACKAGE from '@package'
import { log } from './util/log'

EVENTS.FINISHED_LOADING.subscribe(() => {
	log.img(
		{ url: Title, height: 44 },
		'\n\n Utility Engine v' + PACKAGE.version,
		'\n Created by',
		PACKAGE.author.name
	)
})

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
		EVENTS.LOAD.publish()
	},
	onunload() {
		EVENTS.UNLOAD.publish()
	},
	oninstall() {
		EVENTS.INSTALL.publish()
	},
	onuninstall() {
		EVENTS.UNINSTALL.publish()
	},
})
