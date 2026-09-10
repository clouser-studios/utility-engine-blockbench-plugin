<script lang="ts" module>
	import type { PickValues } from '@utility/util/objUtils.ts'

	export type ArmChannel = keyof PickValues<DisplaySlot, ArrayVector3 | undefined>

	const AXIS_COLORS = ['var(--color-axis-x)', 'var(--color-axis-y)', 'var(--color-axis-z)']
</script>

<script lang="ts">
	import DisplaySectionToolbar from '@components/panel-items/displaySectionToolbar.svelte'
	import Slider from '@components/panel-items/slider.svelte'
	import EVENTS from '@events'
	import { onMount, untrack } from 'svelte'

	interface Props {
		displaySlot: DisplaySlot
		channel: ArmChannel
		label: string
		onpreviewChange: (channel: ArmChannel, rotation: ArrayVector3 | undefined) => void
	}

	const { displaySlot, channel, label, onpreviewChange }: Props = $props()

	let enabled = $state(false)
	let rotation = $state<ArrayVector3>([0, 0, 0])

	/** Mirror the saved channel value into the local editing state. */
	const load = () => {
		const saved = displaySlot[channel]
		enabled = !!saved
		rotation = saved ? [...saved] : [0, 0, 0]
	}

	/** Write the local editing state back onto the displaySlot (outside any undo transaction). */
	const store = (value: ArrayVector3 | undefined) => {
		// @ts-expect-error - the key type isn't granular enough
		displaySlot[channel] = value?.slice()
	}

	const currentRotation = (): ArrayVector3 | undefined =>
		enabled ? (rotation.map(Number) as ArrayVector3) : undefined

	const commit = (undoLabel: string, value = currentRotation()) => {
		Undo.initEdit({ display_slots: [displaySlot.slot_id] })
		store(value)
		Undo.finishEdit(undoLabel)
	}

	// Seed the local state from the slot on mount, and re-seed whenever the active slot
	// changes (this replaces the parent's `{#key displaySlot}` remount).
	$effect(() => {
		void displaySlot
		untrack(load)
	})

	// Live-update the 3D preview as the sliders move.
	$effect(() => {
		onpreviewChange(channel, currentRotation())
	})

	onMount(() => {
		// Blockbench restores the slot's arm rotations itself (see
		// utilityDisplaySettingsDisplaySlotMod); just re-seed the sliders from it.
		const reloadIfSlotChanged = (entry: UndoEntry) => {
			if (entry.before?.display_slots || entry.post?.display_slots) load()
		}
		const unsubs = [
			EVENTS.UNDO.subscribe(reloadIfSlotChanged),
			EVENTS.REDO.subscribe(reloadIfSlotChanged),
		]
		return () => unsubs.forEach(unsub => unsub())
	})

	const onreset = () => {
		rotation = [0, 0, 0]
		commit('Reset arm rotation to default', [0, 0, 0])
	}
</script>

<DisplaySectionToolbar {label} {onreset}>
	<input type="checkbox" bind:checked={enabled} onchange={() => commit('Set arm rotation')} />
</DisplaySectionToolbar>

{#if enabled}
	{#each AXIS_COLORS as thumbColor, axis (axis)}
		<Slider
			max={180}
			min={-180}
			numberSliderStep={0.5}
			step={1}
			{thumbColor}
			onchangeFinished={() => commit('Set arm rotation')}
			bind:value={rotation[axis]}
		/>
	{/each}
{/if}
