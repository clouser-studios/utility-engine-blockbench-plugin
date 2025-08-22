import { PACKAGE } from '@package'
import { SveltePanel } from '@utility/util/sveltePanel'
import { translate } from '@utility/util/translation'
import ArmRotationPanel from './armRotationPanel.svelte'

export const UTILITY_MODEL_ARM_ROTATION_PANEL = new SveltePanel({
	id: `${PACKAGE.name}:armRotationPanel`,
	name: translate('panel.arm_rotation.title'),
	icon: 'fa-rotate',
	component: ArmRotationPanel,
	props: {},
	condition() {
		return !!Modes.display
	},
	default_side: 'left',
	expand_button: true,
	default_position: {
		folded: false,
		float_position: [0, 0],
		height: 400,
		slot: 'left_bar',
		float_size: [400, 400],
	},
})
