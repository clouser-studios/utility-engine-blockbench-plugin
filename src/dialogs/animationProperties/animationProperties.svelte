<script lang="ts">
	import { Valuable } from '../../util/stores'
	import { translate } from '../../util/translation'
	import LineInput from '../../svelte/dialogItems/lineInput.svelte'
	import NumberSlider from '../../svelte/dialogItems/numberSlider.svelte'
	import Select from '../../svelte/dialogItems/select.svelte'

	export let animationType: Valuable<string>
	export let animationName: Valuable<string>
	export let loopMode: Valuable<string>
	export let loopDelay: Valuable<number>

	const animationTypes = [
		'basic_loop',
		'being_broken',
		'being_used_loop',
		'left_click',
		'obtained',
		'placed_loop',
		'placed',
		'right_click',
		'stopped_being_used',
		'used',
		'custom',
	]

	let isCustomAnimationType = false

	animationType.subscribe(v => {
		if (v === 'custom') {
			isCustomAnimationType = true
			return
		}
		isCustomAnimationType = false
		console.log(v)
		animationName.set(v)
	})

	const animationTypeOptions = animationTypes.reduce((acc: Record<string, string>, type) => {
		if (
			Blockbench.Animation.all.some(
				v => v.name !== 'custom' && v.name === type && animationName.get() !== type,
			)
		)
			return acc
		acc[type] = translate(`dialog.animation_properties.animation_type.options.${type}`)
		return acc
	}, {})

	if (animationType.get() === undefined) {
		animationType.set(Object.keys(animationTypeOptions)[0])
	}
</script>

<div>
	<Select
		label={translate('dialog.animation_properties.animation_type.label')}
		tooltip={translate('dialog.animation_properties.animation_type.description')}
		options={animationTypeOptions}
		defaultOption={'once'}
		bind:value={animationType}
	/>

	<LineInput
		label={translate('dialog.animation_properties.animation_name.label')}
		tooltip={translate('dialog.animation_properties.animation_name.description')}
		bind:value={animationName}
		defaultValue={'new'}
		disabled={!isCustomAnimationType}
	/>

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
