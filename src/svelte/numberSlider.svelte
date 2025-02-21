<script lang="ts">
	import { Valuable } from '../util/stores'

	export let id = ''
	export let value: Valuable<number>
	export let min: number | undefined = undefined
	export let max: number | undefined = undefined
	export let step: number | undefined = undefined
	export let enforceMinMax = true
	export let precision = 2
	export let extraClasses = ''

	const MOLANG_PARSER = new Molang()

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
					let v = value.get() + (difference - lastDifference)
					if (enforceMinMax) {
						v = Math.clamp(v, min ?? -Infinity, max ?? Infinity)
					}
					value.set(reduceDecimals(v || 0))
					lastDifference = difference
				}
			}
			function stop() {
				removeEventListeners(document, 'mousemove touchmove', move, null)
				removeEventListeners(document, 'mouseup touchend', stop, null)
			}
			addEventListeners(document as unknown as any, 'mousemove touchmove', move)
			addEventListeners(document as unknown as any, 'mouseup touchend', stop)
		})

		addEventListeners(input, 'focusout dblclick', () => {
			let v = MOLANG_PARSER.parse(value.get())
			if (enforceMinMax) {
				v = Math.clamp(v, min ?? -Infinity, max ?? Infinity)
			}
			value.set(reduceDecimals(v || 0))
		})
	})

	// function onReset() {
	// 	value.set(defaultValue)
	// }
</script>

<div class={'numeric_input ' + extraClasses}>
	<input
		bind:this={input}
		{id}
		class="dark_bordered focusable_input"
		inputmode="decimal"
		bind:value={$value}
	/>
	<div bind:this={slider} class="tool numeric_input_slider">
		<i class="material-icons icon">code</i>
	</div>
</div>
