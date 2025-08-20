<script lang="ts">
	import { ANIMATION_TYPES } from '@utility/mods/utilityModelAnimationMod'
	import LineInput from '../../svelte/dialogItems/lineInput.svelte'
	import NumberSlider from '../../svelte/dialogItems/numberSlider.svelte'
	import Select from '../../svelte/dialogItems/select.svelte'
	import { Syncable } from '../../util/stores'
	import { translate } from '../../util/translation'

	export let animationName: Syncable<string>
	export let animationPath: Syncable<string>
	export let animationType: Syncable<string>
	export let loopMode: Syncable<string>
	export let loopDelay: Syncable<number>

	animationType.subscribe(type => {
		if (type === 'custom') {
			$animationPath = 'custom'
		} else if (Object.keys(ANIMATION_TYPES).includes(type)) {
			$animationName = type
			$animationPath = 'utility'
		}
	})

	const USED_TYPES = Blockbench.Animation.all.reduce((acc: string[], anim) => {
		if (animationName.get() === anim.name) return acc // Ignore self
		if (anim.path === 'utility') {
			acc.push(anim.name)
		}
		return acc
	}, [])

	const ANIMATION_TYPES_OPTIONS = Object.keys(ANIMATION_TYPES).reduce(
		(acc: Record<string, string>, type) => {
			if (type !== 'custom' && USED_TYPES.includes(type)) return acc
			acc[type] = translate(`dialog.animation_properties.animation_type.options.${type}`)
			return acc
		},
		{}
	)
</script>

<div>
	{#key $animationType}
		<Select
			label={translate('dialog.animation_properties.animation_type.label')}
			tooltip={translate('dialog.animation_properties.animation_type.description')}
			options={ANIMATION_TYPES_OPTIONS}
			defaultOption={'once'}
			bind:value={animationType}
		/>
	{/key}

	{#key $animationName}
		<LineInput
			label={translate('dialog.animation_properties.animation_name.label')}
			tooltip={translate('dialog.animation_properties.animation_name.description')}
			bind:value={animationName}
			defaultValue={'new_animation'}
			disabled={$animationType !== 'custom'}
		/>
	{/key}

	{#if $animationType === 'custom'}
		<Select
			label={translate('dialog.animation_properties.loop_mode.label')}
			tooltip={translate('dialog.animation_properties.loop_mode.description')}
			options={{
				once: translate('dialog.animation_properties.loop_mode.options.once'),
				hold: translate('dialog.animation_properties.loop_mode.options.hold'),
				loop: translate('dialog.animation_properties.loop_mode.options.loop'),
			}}
			defaultOption={'once'}
			bind:value={loopMode}
		/>
	{/if}

	<NumberSlider
		label={translate('dialog.animation_properties.loop_delay.label')}
		tooltip={translate('dialog.animation_properties.loop_delay.description')}
		min={0}
		bind:value={loopDelay}
		defaultValue={0}
	/>
</div>

<style>
</style>
