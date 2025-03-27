<script lang="ts">
	import LineInput from '../../svelte/dialogItems/lineInput.svelte'
	import NumberSlider from '../../svelte/dialogItems/numberSlider.svelte'
	import Select from '../../svelte/dialogItems/select.svelte'
	import { Syncable } from '../../util/stores'
	import { translate } from '../../util/translation'

	const UTILITY_PREFIX = 'utility.'

	export let animationName: Syncable<string>
	export let loopMode: Syncable<string>
	export let loopDelay: Syncable<number>

	const ANIMATION_TYPES: Record<string, string> = {
		custom: 'loop',

		main_loop: 'loop',

		selected_reset: 'once',

		held_reset: 'once',
		held_loop: 'loop',
		held_stop: 'once',

		not_held_loop: 'loop',

		left_click: 'once',
		right_click: 'once',

		used: 'once',

		charging_reset: 'once',
		charging_loop: 'loop',

		consume_reset: 'once',
		consume_loop: 'loop',
		consume_cancel: 'once',

		swimming_reset: 'once',
		swimming_loop: 'loop',
		swimming_stop: 'once',

		picked_up: 'once',

		being_worn_reset: 'once',
		being_worn_loop: 'loop',

		placed_reset: 'once',
		placed_loop: 'loop',

		placed_use_reset: 'once',
		placed_use_loop: 'loop',
		placed_use_stop: 'once',

		placed_falling_reset: 'once',
		placed_falling: 'loop',

		placed_breaking_reset: 'once',
		placed_breaking_loop: 'loop',
		placed_breaking_stop: 'once',
		placed_broken: 'once',

		placed_walked_on_reset: 'once',
		placed_walked_on_loop: 'loop',
	}

	function getAnimationTypeFromName(name: string) {
		if (name.startsWith(UTILITY_PREFIX)) {
			const type = Object.keys(ANIMATION_TYPES).find(v => name === UTILITY_PREFIX + v)
			if (type) return type
		}
		return 'custom'
	}

	function getAnimationNameFromType(type: string) {
		if (type === 'custom') return undefined
		return UTILITY_PREFIX + type
	}

	let animationType = new Syncable<string>(getAnimationTypeFromName($animationName))

	$: {
		console.log('animationName', $animationName)
		if ($animationName.startsWith(UTILITY_PREFIX)) {
			const type = Object.keys(ANIMATION_TYPES).find(
				v => $animationName === UTILITY_PREFIX + v
			)
			if (type) {
				$animationType = type
				$loopMode = ANIMATION_TYPES[type]
			}
		}
	}

	let isCustomAnimationType = false

	animationType.subscribe(v => {
		if (v === 'custom') {
			isCustomAnimationType = true
			$animationName =
				getAnimationNameFromType(v) ?? $animationName.replace(UTILITY_PREFIX, '')
			return
		}
		isCustomAnimationType = false
		$animationName = UTILITY_PREFIX + v
	})

	const ANIMATION_TYPE_OPTIONS = Object.keys(ANIMATION_TYPES).reduce(
		(acc: Record<string, string>, type) => {
			if (
				Blockbench.Animation.all.some(
					v => v.name !== 'custom' && v.name === type && animationName.get() !== type
				)
			)
				return acc
			acc[type] = translate(`dialog.animation_properties.animation_type.options.${type}`)
			return acc
		},
		{}
	)

	if (animationType.get() === undefined) {
		animationType.set(Object.keys(ANIMATION_TYPE_OPTIONS)[0])
	}
</script>

<div>
	{#key $animationType}
		<Select
			label={translate('dialog.animation_properties.animation_type.label')}
			tooltip={translate('dialog.animation_properties.animation_type.description')}
			options={ANIMATION_TYPE_OPTIONS}
			defaultOption={'once'}
			bind:value={animationType}
		/>
	{/key}

	{#key $animationName}
		<LineInput
			label={translate('dialog.animation_properties.animation_name.label')}
			tooltip={translate('dialog.animation_properties.animation_name.description')}
			bind:value={animationName}
			defaultValue={'new'}
			disabled={!isCustomAnimationType}
		/>
	{/key}

	{#if isCustomAnimationType}
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
