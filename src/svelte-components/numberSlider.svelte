<script lang="ts">
	interface Props {
		value: number
		id?: string
		min?: number
		max?: number
		step?: number
		enforceMinMax?: boolean
		precision?: number
		extraClasses?: string
		onchangeFinished?: (value: number) => void
	}

	let {
		value = $bindable(0),
		id = undefined,
		min = undefined,
		max = undefined,
		step = 1,
		enforceMinMax = false,
		precision = 2,
		extraClasses = '',
		onchangeFinished = undefined,
	}: Props = $props()

	let input: HTMLInputElement
	let slider: HTMLElement

	function reduceDecimals(num: number) {
		return parseFloat(num.toFixed(precision))
	}

	requestAnimationFrame(() => {
		addEventListeners(slider, 'mousedown touchstart', (e1: any) => {
			convertTouchEvent(e1)
			let lastDifference = 0
			function move(e2: any) {
				convertTouchEvent(e2)
				const difference = Math.trunc((e2.clientX - e1.clientX) / 10) * (step ?? 1)
				if (difference != lastDifference) {
					let v = value + (difference - lastDifference)
					if (enforceMinMax) {
						v = Math.clamp(v, min ?? -Infinity, max ?? Infinity)
					}
					value = reduceDecimals(v ?? 0)
					lastDifference = difference
				}
			}
			function stop() {
				removeEventListeners(document, 'mousemove touchmove', move)
				removeEventListeners(document, 'mouseup touchend', stop)
				if (onchangeFinished) onchangeFinished(value)
			}
			addEventListeners(document, 'mousemove touchmove', move)
			addEventListeners(document, 'mouseup touchend', stop)
		})

		addEventListeners(input, 'focusout dblclick', () => {
			let v = NumSlider.MolangParser.parse(value)
			if (enforceMinMax) {
				v = Math.clamp(v, min ?? -Infinity, max ?? Infinity)
			}
			value = reduceDecimals(v ?? 0)
		})
	})
</script>

<div class={'numeric_input ' + extraClasses}>
	<input
		bind:this={input}
		{id}
		class="dark_bordered focusable_input"
		inputmode="decimal"
		onchange={() => onchangeFinished?.(value)}
		bind:value
	/>
	<div bind:this={slider} class="tool numeric_input_slider">
		<i class="material-icons icon">code</i>
	</div>
</div>
