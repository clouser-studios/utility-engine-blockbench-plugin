import UtilityIcon from '@assets/icons/icon.png'
import { registerBarMenu } from '@blockbench-tools'
import { OPEN_PROJECT_SETTINGS_ACTION } from '@utility/formats/utility-model-project/settings.ts'
import {
	EXPORT_UTILITY_MODEL_ACTION,
	EXPORT_UTILITY_MODEL_AS_ACTION,
} from '@utility/formats/utility-model/export.ts'
import { IMPORT_UTILITY_MODEL_ACTION } from '@utility/formats/utility-model/import.ts'
import { pollUntilResult } from '@utility/util/promises.ts'

export const TITLE_BAR_MENU = registerBarMenu(
	{ id: 'utility-engine:bar-menu/title-bar-menu' },
	[],
	{}
)

TITLE_BAR_MENU.onCreated(menubar => {
	function createIconImg() {
		const img = document.createElement('img')
		Object.assign(img, {
			src: UtilityIcon,
			width: 16,
			height: 16,
		})
		Object.assign(img.style, {
			position: 'relative',
			top: '2px',
			borderRadius: '2px',
			marginRight: '6px',
			boxShadow: '1px 1px 1px #000000aa',
		})
		return img
	}
	const blockbenchMenuBar = document.querySelector('#menu_bar')!
	menubar.label.style.display = 'inline-block'
	menubar.label.innerHTML = 'Utility'
	menubar.label.prepend(createIconImg())
	blockbenchMenuBar.appendChild(menubar.label)

	void pollUntilResult(
		() => {
			const items = [
				OPEN_PROJECT_SETTINGS_ACTION.get(),
				IMPORT_UTILITY_MODEL_ACTION.get(),
				EXPORT_UTILITY_MODEL_ACTION.get(),
				EXPORT_UTILITY_MODEL_AS_ACTION.get(),
			]
			if (items.every(action => action !== undefined)) {
				return items as Action[]
			}
		},
		() => !TITLE_BAR_MENU.get(),
		100
	).then(items => {
		for (const action of items) {
			MenuBar.addAction(action, menubar.id)
		}
	})
})
