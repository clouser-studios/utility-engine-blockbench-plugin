<script lang="ts">
	import { type Syncable } from '@utility/util/stores'
	import BaseDialogItem from './dialogItem.svelte'

	interface Props extends DialogItemProps<ArrayVector3> {
		valueX: Syncable<number>
		defaultValueX: number
		minX?: number
		maxX?: number

		valueY: Syncable<number>
		defaultValueY: number
		minY?: number
		maxY?: number

		valueZ: Syncable<number>
		defaultValueZ: number
		minZ?: number
		maxZ?: number

		step?: number
	}

	const {
		label,
		tooltip = '',

		valueX,
		defaultValueX,
		minX = undefined,
		maxX = undefined,

		valueY,
		defaultValueY,
		minY = undefined,
		maxY = undefined,

		valueZ,
		defaultValueZ,
		minZ = undefined,
		maxZ = undefined,

		step = undefined,

		validate = undefined,
	}: Props = $props()

	let statusMessage = $state<StatusMessage | undefined>()
	if (validate) {
		const validateArrayVector3 = () => {
			statusMessage = validate([valueX.get(), valueY.get(), valueZ.get()])
		}
		valueX.subscribe(validateArrayVector3)
		valueY.subscribe(validateArrayVector3)
		valueZ.subscribe(validateArrayVector3)
	}

	const MOLANG_PARSER = new Molang()

	let inputX: HTMLInputElement
	let sliderX: HTMLElement

	let inputY: HTMLInputElement
	let sliderY: HTMLElement

	let inputZ: HTMLInputElement
	let sliderZ: HTMLElement

	function eventListenerFactory(
		targetInput: HTMLInputElement,
		targetSlider: HTMLElement,
		value: Syncable<number>,
		min?: number,
		max?: number
	) {
		addEventListeners(targetSlider, 'mousedown touchstart', (e1: any) => {
			convertTouchEvent(e1)
			let lastDifference = 0
			function move(e2: any) {
				convertTouchEvent(e2)
				const difference = Math.trunc((e2.clientX - e1.clientX) / 10) * (step ?? 1)
				if (difference != lastDifference) {
					value.set(
						Math.clamp(
							value.get() + (difference - lastDifference),
							min ?? -Infinity,
							max ?? Infinity
						)
					)
					lastDifference = difference
				}
			}
			function stop() {
				removeEventListeners(document, 'mousemove touchmove', move)
				removeEventListeners(document, 'mouseup touchend', stop)
			}
			addEventListeners(document, 'mousemove touchmove', move)
			addEventListeners(document, 'mouseup touchend', stop)
		})

		addEventListeners(targetInput, 'focusout dblclick', () => {
			value.set(
				Math.clamp(MOLANG_PARSER.parse(value.get()), min ?? -Infinity, max ?? Infinity)
			)
		})
	}

	function onreset() {
		valueX.set(defaultValueX)
		valueY.set(defaultValueY)
		valueZ.set(defaultValueZ)
	}

	requestAnimationFrame(() => {
		eventListenerFactory(inputX, sliderX, valueX, minX, maxX)
		eventListenerFactory(inputY, sliderY, valueY, minY, maxY)
		eventListenerFactory(inputZ, sliderZ, valueZ, minZ, maxZ)
	})
</script>

<BaseDialogItem {label} {tooltip} {onreset} {statusMessage}>
	{#snippet children(id)}
		<div class="dialog_bar form_bar">
			<label class="name_space_left" for={id}>{label}</label>
			<div class="dialog_vector_group half">
				<div class="numeric_input">
					<input
						bind:this={inputX}
						{id}
						class="dark_bordered focusable_input"
						bind:value={$valueX}
						inputmode="decimal"
					/>
					<div bind:this={sliderX} class="tool numaric_input_slider">
						<i class="material-icons icon">code</i>
					</div>
				</div>
				<div class="numeric_input">
					<input
						bind:this={inputY}
						{id}
						class="dark_bordered focusable_input"
						bind:value={$valueY}
						inputmode="decimal"
					/>
					<div bind:this={sliderY} class="tool numaric_input_slider">
						<i class="material-icons icon">code</i>
					</div>
				</div>
				<div class="numeric_input">
					<input
						bind:this={inputZ}
						{id}
						class="dark_bordered focusable_input"
						bind:value={$valueZ}
						inputmode="decimal"
					/>
					<div bind:this={sliderZ} class="tool numaric_input_slider">
						<i class="material-icons icon">code</i>
					</div>
				</div>
			</div>
		</div>
	{/snippet}
</BaseDialogItem>
