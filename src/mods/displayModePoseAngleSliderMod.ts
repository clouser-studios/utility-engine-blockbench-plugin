import { registerMod } from '@blockbench-tools'
import EVENTS from '@events'
import { currentFormatIsUtilityModelProject } from '@utility/formats/utility-model-project/index.ts'

const getPoseAngleLabel = () => {
	return $(
		`div.display_slot_section_bar:has(p.panel_toolbar_label:contains("${tl('display.pose_angle')}"))`
	)[0]
}

const getPoseAngleSlider = (element: HTMLElement) => {
	const parent = element.parentElement
	if (!parent) return
	const children = Array.from(parent.children)
	const sliderElement = children.at(children.indexOf(element) + 1)
	if (!sliderElement) return
	return sliderElement as HTMLElement
}

// Forces the pose angle label and slider to be hidden when in a Utility Model Project
registerMod({
	id: 'utility-engine:display-mode-pose-angle-slider',
	apply: () => {
		const defaultLabelDisplay = '' as string
		const defaultSliderDisplay = '' as string

		const onChange = () => {
			requestAnimationFrame(() => {
				const label = getPoseAngleLabel()
				if (!label) return
				const slider = getPoseAngleSlider(label)
				if (!slider) return

				if (currentFormatIsUtilityModelProject()) {
					label.style.display = 'none'
					slider.style.display = 'none'
				} else {
					label.style.display = defaultLabelDisplay
					slider.style.display = defaultSliderDisplay
				}
			})
		}

		const unsubs = [
			EVENTS.DISPLAY_SLOT_CHANGED.subscribe(onChange),
			EVENTS.REF_MODEL_CHANGED.subscribe(onChange),
			EVENTS.SELECT_MODE.subscribe(onChange),
		]

		return { unsubs, defaultLabelDisplay, defaultSliderDisplay }
	},

	revert: ctx => {
		ctx.unsubs.forEach(unsub => unsub())

		const label = getPoseAngleLabel()
		if (!label) return
		label.style.display = ctx.defaultLabelDisplay

		const slider = getPoseAngleSlider(label)
		if (!slider) return
		slider.style.display = ctx.defaultSliderDisplay
	},
})
