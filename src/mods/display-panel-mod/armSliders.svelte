<script lang="ts">
	import DisplaySectionToolbar from '@components/panel-items/displaySectionToolbar.svelte'
	import Slider from '@components/panel-items/slider.svelte'
	import { type UtilityModelProject } from '@utility/formats/utility-model-project/versions/latest'

	interface Props {
		displaySettingsKey: keyof UtilityModelProject.UtilityDisplaySettings
		label: string
		onchange: (
			key: keyof UtilityModelProject.UtilityDisplaySettings,
			overwrite: boolean,
			rotation: ArrayVector3 | undefined
		) => void
	}

	const { displaySettingsKey, label, onchange }: Props = $props()

	let overwriteRotation = $state(false)
	let rotationX = $state(0)
	let rotationY = $state(0)
	let rotationZ = $state(0)
	let rotation = $derived<ArrayVector3 | undefined>(
		overwriteRotation ? [rotationX, rotationY, rotationZ] : undefined
	)

	const settings = Project!.utility_display_settings[display_slot] ?? {}

	if (settings[displaySettingsKey] != undefined) {
		overwriteRotation = true
		rotationX = settings[displaySettingsKey][0]
		rotationY = settings[displaySettingsKey][1]
		rotationZ = settings[displaySettingsKey][2]
	}

	$effect(() => {
		onchange(displaySettingsKey, overwriteRotation, rotation)
	})

	const onreset = () => {
		rotationX = 0
		rotationY = 0
		rotationZ = 0
	}
</script>

<DisplaySectionToolbar {label} {onreset}>
	<input type="checkbox" bind:checked={overwriteRotation} />
</DisplaySectionToolbar>

{#if overwriteRotation}
	<Slider
		max={180}
		min={-180}
		numberSliderStep={0.5}
		step={1}
		thumbColor={'var(--color-axis-x)'}
		bind:value={rotationX}
	/>

	<Slider
		max={180}
		min={-180}
		numberSliderStep={0.5}
		step={1}
		thumbColor={'var(--color-axis-y)'}
		bind:value={rotationY}
	/>

	<Slider
		max={180}
		min={-180}
		numberSliderStep={0.5}
		step={1}
		thumbColor={'var(--color-axis-z)'}
		bind:value={rotationZ}
	/>
{/if}
