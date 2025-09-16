import UtilityIcon from '@assets/icons/icon.png'
import { createBarMenu } from '@blockbench-tools'
import { UTILITY_MODEL_PROJECT_FORMAT } from '@utility/formats/utility-model-project'
import { OPEN_UTILITY_MODEL_SETTINGS_ACTION } from '@utility/formats/utility-model-project/settings'
import {
	EXPORT_UTILITY_MODEL_ACTION,
	EXPORT_UTILITY_MODEL_AS_ACTION,
} from '@utility/formats/utility-model/export'
import { IMPORT_UTILITY_MODEL_ACTION } from '@utility/formats/utility-model/import'

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
const MENU_ID = `utility-engine:menu`
const BLOCKBENCH_MENU_BAR = document.querySelector('#menu_bar')!
export const MENU = createBarMenu(
	MENU_ID,
	[],
	() => Format === UTILITY_MODEL_PROJECT_FORMAT
) as BarMenu & {
	label: HTMLDivElement
}
MENU.label.style.display = 'inline-block'
MENU.label.innerHTML = 'Utility'
MENU.label.prepend(createIconImg())
BLOCKBENCH_MENU_BAR.appendChild(MENU.label)

MenuBar.addAction(OPEN_UTILITY_MODEL_SETTINGS_ACTION, MENU.id)
MenuBar.addAction(IMPORT_UTILITY_MODEL_ACTION, MENU.id)
MenuBar.addAction(EXPORT_UTILITY_MODEL_ACTION, MENU.id)
MenuBar.addAction(EXPORT_UTILITY_MODEL_AS_ACTION, MENU.id)
