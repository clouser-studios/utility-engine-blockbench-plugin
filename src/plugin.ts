import Title from '@assets/title.png'
import PACKAGE from '@package' with { type: 'json' }
import { LEGACY_UTILITY_MODEL_PROJECT_FORMAT_ID } from '@utility/formats/utility-model-project/dfu.ts'
import { UTILITY_MODEL_PROJECT_FORMAT_ID } from '@utility/formats/utility-model-project/index.ts'
import { log } from '@utility/util/log.ts'

// Every field here must match this plugin's entry in the blockbench-plugins `plugins.json`.
BBPlugin.register(PACKAGE.name, {
	title: PACKAGE.title,
	author: PACKAGE.author.name,
	description: PACKAGE.description,
	icon: PACKAGE.icon,
	variant: 'desktop',
	version: PACKAGE.version,
	min_version: PACKAGE.min_blockbench_version,
	tags: PACKAGE.tags as [string, string, string],
	await_loading: true,
	has_changelog: true,
	creation_date: '2026-09-30',
	website: PACKAGE.homepage,
	repository: PACKAGE.repository.url,
	bug_tracker: PACKAGE.bugs.url,
	contributes: {
		formats: [UTILITY_MODEL_PROJECT_FORMAT_ID, LEGACY_UTILITY_MODEL_PROJECT_FORMAT_ID],
		open_extensions: ['utilityproject'],
	},
	onload() {
		void log.img(
			{ url: Title, height: 44 },
			'\n\n Utility Engine v' + PACKAGE.version,
			'\n Created by',
			PACKAGE.author.name
		)
	},
})
