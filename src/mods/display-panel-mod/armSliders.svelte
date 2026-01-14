<script lang="ts">
	import DisplaySectionToolbar from '@components/panel-items/displaySectionToolbar.svelte'
	import Slider from '@components/panel-items/slider.svelte'
	import EVENTS from '@utility/util/events'
	import type { PickValues } from '@utility/util/objUtils'
	import { onMount } from 'svelte'

	interface Props {
		displaySlotChannel: keyof PickValues<DisplaySlot, ArrayVector3 | undefined>
		label: string
		onpreviewChange: (
			displaySlotChannel: keyof PickValues<DisplaySlot, ArrayVector3 | undefined>,
			rotation: ArrayVector3 | undefined
		) => void
	}

	const { displaySlotChannel, label, onpreviewChange }: Props = $props()

	let enableRotation = $state(false)
	let rotationX = $state(0)
	let rotationY = $state(0)
	let rotationZ = $state(0)

	const displaySlot = Project!.display_settings[DisplayMode.display_slot]

	const loadChannelRotation = (shouldForceDisable = false) => {
		if (displaySlot[displaySlotChannel]) {
			enableRotation = true
			rotationX = displaySlot[displaySlotChannel][0]
			rotationY = displaySlot[displaySlotChannel][1]
			rotationZ = displaySlot[displaySlotChannel][2]
		} else {
			if (shouldForceDisable) enableRotation = false
			rotationX = 0
			rotationY = 0
			rotationZ = 0
		}
	}
	loadChannelRotation()

	const saveChannelRotation = (value: ArrayVector3 | undefined) => {
		// @ts-expect-error - Key type isn't granular enough
		displaySlot[displaySlotChannel] = value?.slice()
	}

	const getRotation = (): ArrayVector3 | undefined => {
		return enableRotation
			? [Number(rotationX), Number(rotationY), Number(rotationZ)]
			: undefined
	}

	const onchangeFinished = () => {
		const rotation = getRotation()

		console.log('Finished changing rotation:', rotation)
		Undo.initEdit({ display_slots: [displaySlot.slot_id] })

		console.log('%cArm rotation overwritten:', 'color: orange;', displaySlotChannel, rotation)
		saveChannelRotation(getRotation())

		Undo.finishEdit('Set arm rotation')
	}

	onMount(() => {
		const unsubs = [
			EVENTS.UNDO.subscribe(entry => {
				const undoData = entry.before?.display_slots?.[displaySlot.slot_id]
				if (!undoData) return
				console.log('UNDO affecting display slot:', displaySlot.slot_id, entry)
				saveChannelRotation(undoData[displaySlotChannel])
				loadChannelRotation(true)
			}),

			EVENTS.REDO.subscribe(entry => {
				const redoData = entry.post?.display_slots?.[displaySlot.slot_id]
				if (!redoData) return
				console.log('REDO affecting display slot:', displaySlot.slot_id, entry)
				saveChannelRotation(redoData[displaySlotChannel])
				loadChannelRotation(true)
			}),
		]

		return () => {
			unsubs.forEach(unsub => unsub())
		}
	})

	$effect(() => {
		onpreviewChange(displaySlotChannel, getRotation())
	})

	onpreviewChange(displaySlotChannel, getRotation())

	const onreset = () => {
		rotationX = 0
		rotationY = 0
		rotationZ = 0

		Undo.initEdit({ display_slots: [displaySlot.slot_id] })
		saveChannelRotation([0, 0, 0])
		Undo.finishEdit('Reset arm rotation to default')
	}
</script>

<DisplaySectionToolbar {label} {onreset}>
	<input type="checkbox" bind:checked={enableRotation} onchange={() => onchangeFinished()} />
</DisplaySectionToolbar>

{#if enableRotation}
	<Slider
		max={180}
		min={-180}
		numberSliderStep={0.5}
		step={1}
		thumbColor={'var(--color-axis-x)'}
		{onchangeFinished}
		bind:value={rotationX}
	/>

	<Slider
		max={180}
		min={-180}
		numberSliderStep={0.5}
		step={1}
		thumbColor={'var(--color-axis-y)'}
		{onchangeFinished}
		bind:value={rotationY}
	/>

	<Slider
		max={180}
		min={-180}
		numberSliderStep={0.5}
		step={1}
		thumbColor={'var(--color-axis-z)'}
		{onchangeFinished}
		bind:value={rotationZ}
	/>
{/if}
