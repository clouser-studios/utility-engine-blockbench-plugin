<script lang="ts">
	import NumberSlider from '@utility/svelte-components/numberSlider.svelte'

	interface Props {
		value: number
		min?: number
		max?: number
		step?: number
		enforceMinMax?: boolean
		/**
		 * A valid CSS color string
		 */
		thumbColor?: string
		numberSliderStep?: number
		onchangeFinished?: (value: number) => void
	}

	let {
		value = $bindable(0),
		min = undefined,
		max = undefined,
		step = 1,
		enforceMinMax = true,
		thumbColor = 'var(--color-axis-x)',
		numberSliderStep = step,
		onchangeFinished = undefined,
	}: Props = $props()
</script>

<div class="bar slider_input_combo" title="X">
	<input
		style={`--color-thumb: ${thumbColor};`}
		class="tool disp_range"
		{max}
		{min}
		{step}
		type="range"
		onchange={() => onchangeFinished?.(value)}
		bind:value
	/>
	<NumberSlider
		{enforceMinMax}
		extraClasses="tool disp_text"
		{max}
		{min}
		precision={1 / numberSliderStep}
		step={numberSliderStep}
		{onchangeFinished}
		bind:value
	/>
</div>
