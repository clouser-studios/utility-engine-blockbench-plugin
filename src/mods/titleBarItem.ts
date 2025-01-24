import * as PACKAGE from '../../package.json'
import UtilityIcon from '../assets/icons/icon.png'
import { UTILITY_MODEL_FORMAT } from '../formats/utilityModel'
import { EXPORT_UTILITY_MODEL_ACTION } from '../formats/utilityModel/export'
import { createBarMenu, type NamespacedString } from '../util/moddingTools'

function createIconImg() {
	const IMG = document.createElement('img')
	Object.assign(IMG, {
		src: UtilityIcon,
		width: 16,
		height: 16,
	})
	Object.assign(IMG.style, {
		position: 'relative',
		top: '2px',
		borderRadius: '2px',
		marginRight: '6px',
		boxShadow: '1px 1px 1px #000000aa',
	})
	return IMG
}
const MENU_ID = `${PACKAGE.name}:menu` as NamespacedString
const BLOCKBENCH_MENU_BAR = document.querySelector('#menu_bar') as HTMLDivElement
export const MENU = createBarMenu(MENU_ID, [], () => Format === UTILITY_MODEL_FORMAT) as BarMenu & {
	label: HTMLDivElement
}
MENU.label.style.display = 'inline-block'
MENU.label.innerHTML = 'Utility'
MENU.label.prepend(createIconImg())
BLOCKBENCH_MENU_BAR.appendChild(MENU.label)

MenuBar.addAction(EXPORT_UTILITY_MODEL_ACTION, MENU.id)
