<script lang="ts">
	import { Syncable } from '../../util/stores'
	import { translate } from '../../util/translation'
	import DisplaySectionToolbar from './displaySectionToolbar.svelte'
	import Slider from './slider.svelte'

	const LEFT_ROTATION_X = new Syncable(0)
	const LEFT_ROTATION_Y = new Syncable(0)
	const LEFT_ROTATION_Z = new Syncable(0)

	const RIGHT_ROTATION_X = new Syncable(0)
	const RIGHT_ROTATION_Y = new Syncable(0)
	const RIGHT_ROTATION_Z = new Syncable(0)

	LEFT_ROTATION_X.subscribe(value => {
		console.log('LEFT_ROTATION_X', value)
	})

	function resetLeftRotation() {
		LEFT_ROTATION_X.set(0)
		LEFT_ROTATION_Y.set(0)
		LEFT_ROTATION_Z.set(0)
	}

	function resetRightRotation() {
		RIGHT_ROTATION_X.set(0)
		RIGHT_ROTATION_Y.set(0)
		RIGHT_ROTATION_Z.set(0)
	}
</script>

<DisplaySectionToolbar
	label={translate('panel.arm_rotation.left_rotation.label')}
	onReset={resetLeftRotation}
/>
<Slider
	max={180}
	min={-180}
	numberSliderStep={0.5}
	step={1}
	thumbColor={'var(--color-axis-x)'}
	value={LEFT_ROTATION_X}
/>
<Slider
	max={180}
	min={-180}
	numberSliderStep={0.5}
	step={1}
	thumbColor={'var(--color-axis-y)'}
	value={LEFT_ROTATION_Y}
/>
<Slider
	max={180}
	min={-180}
	numberSliderStep={0.5}
	step={1}
	thumbColor={'var(--color-axis-z)'}
	value={LEFT_ROTATION_Z}
/>

<DisplaySectionToolbar
	label={translate('panel.arm_rotation.right_rotation.label')}
	onReset={resetRightRotation}
/>
<Slider
	max={180}
	min={-180}
	numberSliderStep={0.5}
	step={1}
	thumbColor={'var(--color-axis-x)'}
	value={RIGHT_ROTATION_X}
/>
<Slider
	max={180}
	min={-180}
	numberSliderStep={0.5}
	step={1}
	thumbColor={'var(--color-axis-y)'}
	value={RIGHT_ROTATION_Y}
/>
<Slider
	max={180}
	min={-180}
	numberSliderStep={0.5}
	step={1}
	thumbColor={'var(--color-axis-z)'}
	value={RIGHT_ROTATION_Z}
/>

<style>
	:global(#panel_display .panel_vue_wrapper #display_sliders) {
		display: none !important;
	}
</style>
