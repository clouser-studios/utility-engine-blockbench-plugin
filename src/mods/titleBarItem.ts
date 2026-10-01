import UtilityIcon from '@assets/icons/icon.png'
import { OPEN_PROJECT_SETTINGS_ACTION } from '@utility/formats/utility-model-project/settings.ts'
import {
	EXPORT_UTILITY_MODEL_ACTION,
	EXPORT_UTILITY_MODEL_AS_ACTION,
} from '@utility/formats/utility-model/export.ts'
import { IMPORT_UTILITY_MODEL_ACTION } from '@utility/formats/utility-model/import.ts'
import { registerDeletableHandlerPatch } from 'blockbench-patch-manager'

export const TITLE_BAR_MENU = registerDeletableHandlerPatch({
	id: 'utility_engine:bar-menu/title-bar-menu',
	dependencies: [
		`utility_engine:action/open-utility-model-settings`,
		`utility_engine:action/import-utility-model`,
		`utility_engine:action/export-utility-model`,
		`utility_engine:action/export-utility-model-as`,
	],
	create() {
		const menu = new BarMenu('utility_engine:bar-menu/title-bar-menu', [], {})

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
		menu.label.style.display = 'inline-block'
		menu.label.innerHTML = 'Utility'
		menu.label.prepend(createIconImg())
		blockbenchMenuBar.appendChild(menu.label)

		MenuBar.addAction(OPEN_PROJECT_SETTINGS_ACTION.get(), menu.id)
		MenuBar.addAction(IMPORT_UTILITY_MODEL_ACTION.get(), menu.id)
		MenuBar.addAction(EXPORT_UTILITY_MODEL_ACTION.get(), menu.id)
		MenuBar.addAction(EXPORT_UTILITY_MODEL_AS_ACTION.get(), menu.id)

		return menu
	},
})
