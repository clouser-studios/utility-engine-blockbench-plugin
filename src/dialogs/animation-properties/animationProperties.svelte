<script lang="ts" module>
	import { ANIMATION_TYPES } from '@utility/mods/utilityModelAnimationMod.ts'
	import LineInput from '@utility/svelte-components/dialog-items/lineInput.svelte'
	import NumberSlider from '@utility/svelte-components/dialog-items/numberSlider.svelte'
	import Select from '@utility/svelte-components/dialog-items/select.svelte'
	import { BB } from '@utility/util/blockbenchCompat.ts'
	import { createScopedTranslator } from '@utility/util/lang.ts'
	import { onMount } from 'svelte'
	import { type Observable } from 'svelte-observable-store'

	const localize = createScopedTranslator('dialog.animation_properties')
</script>

<script lang="ts">
	interface Props {
		animationName: Observable<string>
		animationGroup: Observable<string>
		animationType: Observable<string>
		loopMode: Observable<string>
		loopDelay: Observable<number>
	}

	const { animationName, animationGroup, animationType, loopMode, loopDelay }: Props = $props()

	const USED_TYPES = BB.Animation.all.reduce((acc: string[], anim) => {
		if (animationName.get() === anim.name) return acc
		if (anim.group_name === 'utility') acc.push(anim.name)
		return acc
	}, [])

	const ANIMATION_TYPES_OPTIONS = Object.keys(ANIMATION_TYPES).reduce(
		(acc: Record<string, string>, type) => {
			if (type !== 'custom' && USED_TYPES.includes(type) && type !== animationType.get()) {
				return acc
			}
			acc[type] = localize(`animation_type.options.${type}`)
			return acc
		},
		{}
	)

	onMount(() => {
		animationType.subscribe(type => {
			if (type === 'custom') {
				$animationGroup = 'custom'
			} else if (Object.keys(ANIMATION_TYPES).includes(type)) {
				$animationName = type
				$animationGroup = 'utility'
			}
		})
	})
</script>

<div>
	{#key $animationType}
		<Select
			label={localize('animation_type.label')}
			tooltip={localize('animation_type.description')}
			options={ANIMATION_TYPES_OPTIONS}
			defaultOption={'custom'}
			value={animationType}
		/>
	{/key}

	{#key $animationName}
		<LineInput
			label={localize('animation_name.label')}
			tooltip={localize('animation_name.description')}
			value={animationName}
			defaultValue={'new_animation'}
			disabled={$animationType !== 'custom'}
		/>
	{/key}

	{#if $animationType === 'custom'}
		<Select
			label={localize('loop_mode.label')}
			tooltip={localize('loop_mode.description')}
			options={{
				once: localize('loop_mode.options.once'),
				hold: localize('loop_mode.options.hold'),
				loop: localize('loop_mode.options.loop'),
			}}
			defaultOption={'once'}
			value={loopMode}
		/>
	{/if}

	<NumberSlider
		label={localize('loop_delay.label')}
		tooltip={localize('loop_delay.description')}
		min={0}
		value={loopDelay}
		defaultValue={0}
	/>
</div>

<style>
</style>
