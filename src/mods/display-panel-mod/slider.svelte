<script lang="ts">
	import NumberSlider from '@utility/svelte/numberSlider.svelte'
	import { Syncable } from '@utility/util/stores'

	export let value: Syncable<number>
	export let min: number | undefined = undefined
	export let max: number | undefined = undefined
	export let step = 1
	export let enforceMinMax = true
	/**
	 * A valid CSS color string
	 */
	export let thumbColor = 'var(--color-axis-x)'
	export let numberSliderStep: number = step
</script>

<div class="bar slider_input_combo" title="X">
	<input
		style={`--color-thumb: ${thumbColor};`}
		class="tool disp_range"
		{max}
		{min}
		{step}
		type="range"
		bind:value={$value}
	/>
	<NumberSlider
		{enforceMinMax}
		extraClasses="tool disp_text"
		{max}
		{min}
		precision={1 / numberSliderStep}
		step={numberSliderStep}
		{value}
	/>
</div>
