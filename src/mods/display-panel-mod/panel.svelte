<script lang="ts" module>
	import EVENTS from '@events'
	import { currentFormatIsUtilityModelProject } from '@utility/formats/utility-model-project/index.ts'
	import { createScopedTranslator } from '@utility/util/lang.ts'
	import { log } from '@utility/util/log.ts'
	import { onMount } from 'svelte'
	import ArmSliders, { type ArmChannel } from './armSliders.svelte'

	/** Default rotation for an arm: the slot's pose angle on the primary hand, flat otherwise. */
	const getDefaultArmRotation = (
		side: 'left' | 'right',
		primaryHand: 'left' | 'right'
	): ArrayVector3 => {
		const poseAngle =
			displayReferenceObjects.refmodels.player.pose_angles[DisplayMode.display_slot] ?? 22.5
		return side === primaryHand ? [poseAngle, 0, 0] : [0, 0, 0]
	}

	const localize = createScopedTranslator('panel.arm_rotation')
</script>

<script lang="ts">
	let openProjectIsUtilityModelProject = $state(!!Project)
	let isDisplayModeActive = $state(false)
	let isPlayerRefModel = $state(false)
	let displaySlot = $state<DisplaySlot | undefined>(undefined)
	let previewOffhand = $state(false)
	let overrideActive = $state(false)

	let isThirdPersonSlot = $derived(
		displaySlot?.slot_id === 'thirdperson_righthand' ||
			displaySlot?.slot_id === 'thirdperson_lefthand'
	)

	const setArmRotation = (side: 'left' | 'right', rotation: ArrayVector3) => {
		const refModel = displayReferenceObjects.active
		if (!refModel) return

		const names = [`${side}_arm`, `${side}_arm_layer`]
		const [x, y, z] = rotation.map(deg => (deg * Math.PI) / 180)

		for (const object of refModel.model.children) {
			if (!names.includes(object.name)) continue
			object.rotation.order = 'ZYX'
			object.rotation.set(x, y, z)
			object.matrixWorldNeedsUpdate = true
		}
	}

	const updateCanvas = () => {
		Canvas.updateAllPositions()
		Canvas.updateView({ elements: Outliner.elements })
	}

	const resetReferenceModel = () => {
		DisplayMode.display_area.removeFromParent()
		scene.add(DisplayMode.display_area)
		updateCanvas()

		const model = displayReferenceObjects.active
		if (model?.id !== 'player') {
			log.warn('No player ref model to reset display area of')
			return
		}

		model.updateBasePosition()
		const primaryHand = displaySlot?.slot_id === 'thirdperson_lefthand' ? 'left' : 'right'
		setArmRotation('left', getDefaultArmRotation('left', primaryHand))
		setArmRotation('right', getDefaultArmRotation('right', primaryHand))
	}

	const attachDisplayAreaToArm = () => {
		resetReferenceModel()

		const model = displayReferenceObjects.active
		if (model?.id !== 'player') {
			log.warn('No player ref model to attach display area to')
			return
		}

		// Only arm objects are tagged with the current model variant.
		const arms = model.model.children.filter(o => o.r_model === model.variant)
		const side = displaySlot?.slot_id === 'thirdperson_lefthand' ? 'left' : 'right'
		const arm = arms.find(a => a.name === `${side}_arm`)

		if (displaySlot?.slot_id === `thirdperson_${side}hand` && arm) {
			DisplayMode.display_area.removeFromParent()
			const x = (side === 'left' ? -1 : 1) * (model.variant === 'alex' ? 1.5 : 2)
			DisplayMode.setBase(x, -10, -2, -90, 0, 0, 1, 1, 1)
			arm.add(DisplayMode.display_area)
		}

		return model
	}

	const updatePreview = () => {
		const model = attachDisplayAreaToArm()
		if (!model) return log.warn('No ref model to update preview with')
		if (!displaySlot) return log.warn('No display slot data to update preview with')

		const suffix = previewOffhand ? '_when_offhand_occupied' : ''
		const left = displaySlot[`left_arm_rotation${suffix}`]
		const right = displaySlot[`right_arm_rotation${suffix}`]
		if (left) setArmRotation('left', left)
		if (right) setArmRotation('right', right)

		updateCanvas()
		requestAnimationFrame(updateCanvas)
	}

	/** Runs from a Svelte `$effect`, so the canvas update must stay deferred (avoids an effect loop). */
	const onpreviewChange = (channel: ArmChannel, rotation: ArrayVector3 | undefined) => {
		if (channel.endsWith('occupied') && !previewOffhand) return
		const side = channel.startsWith('left') ? 'left' : 'right'
		setArmRotation(side, rotation ?? getDefaultArmRotation(side, 'right'))
		requestAnimationFrame(updateCanvas)
	}

	const togglePreviewingOffhand = () => {
		previewOffhand = !previewOffhand
		updatePreview()
	}

	onMount(() => {
		const refreshPreview = () => {
			updatePreview()
			requestAnimationFrame(updatePreview)
		}

		const unsubs = [
			EVENTS.DISPLAY_SETTINGS_UPDATED.subscribe(slot => {
				if (currentFormatIsUtilityModelProject() && slot === displaySlot) updatePreview()
			}),

			EVENTS.REF_MODEL_CHANGED.subscribe(({ refModel }) => {
				if (!currentFormatIsUtilityModelProject()) return
				isPlayerRefModel = refModel?.id === displayReferenceObjects.refmodels.player.id
				refreshPreview()
			}),

			EVENTS.DISPLAY_SLOT_CHANGED.subscribe(({ slot }) => {
				displaySlot = Project?.display_settings[slot]
				overrideActive = !!displaySlot?.overrides
				if (!currentFormatIsUtilityModelProject()) resetReferenceModel()
				else refreshPreview()
			}),

			EVENTS.DISPLAY_OVERRIDE_CHANGED.subscribe(active => {
				overrideActive = active
			}),

			EVENTS.SELECT_MODE.subscribe(({ mode }) => {
				if (currentFormatIsUtilityModelProject())
					isDisplayModeActive = mode?.id === 'display'
			}),

			EVENTS.SELECT_PROJECT.subscribe(project => {
				openProjectIsUtilityModelProject = !!project && currentFormatIsUtilityModelProject()
				resetReferenceModel()
			}),

			EVENTS.UNSELECT_PROJECT.subscribe(() => {
				openProjectIsUtilityModelProject = false
				isDisplayModeActive = false
				isPlayerRefModel = false
				previewOffhand = false
				overrideActive = false
			}),
		]

		return () => {
			unsubs.forEach(unsub => unsub())
			resetReferenceModel()
		}
	})
</script>

{#snippet visibilityButton(visible: boolean)}
	<div class="tool head_right">
		<i
			class="material-icons"
			onclick={togglePreviewingOffhand}
			style:color={visible ? 'var(--color-text)' : 'var(--color-subtle_text)'}
		>
			{visible ? 'visibility' : 'visibility_off'}
		</i>
	</div>
{/snippet}

{#snippet armPair(slot: DisplaySlot, channelSuffix: '' | '_when_offhand_occupied')}
	<ArmSliders
		displaySlot={slot}
		channel={`left_arm_rotation${channelSuffix}`}
		label={localize('left_arm.label')}
		{onpreviewChange}
	/>
	<ArmSliders
		displaySlot={slot}
		channel={`right_arm_rotation${channelSuffix}`}
		label={localize('right_arm.label')}
		{onpreviewChange}
	/>
{/snippet}

{#if openProjectIsUtilityModelProject && isDisplayModeActive && isThirdPersonSlot && displaySlot && !overrideActive}
	<p class="bar display_slot_section_bar title" title={localize('description')}>
		{localize('title')}
		{@render visibilityButton(!previewOffhand)}
	</p>

	{#if !isPlayerRefModel}
		<p class="warning">
			{@html localize('warning.non_player_ref_model')}
		</p>
	{/if}

	{@render armPair(displaySlot, '')}

	<p
		class="bar display_slot_section_bar title"
		title={localize('when_offhand_occupied.description')}
	>
		{localize('when_offhand_occupied.title')}
		{@render visibilityButton(previewOffhand)}
	</p>

	{@render armPair(displaySlot, '_when_offhand_occupied')}
{/if}

<style>
	.title {
		display: flex;
		justify-content: space-between;
		font-size: 1.1em;
		color: var(--color-subtle_text);
		text-transform: uppercase;
		margin-top: 16px;
	}
	.warning {
		font-size: 0.9em;
		color: var(--color-warning);
	}
</style>
