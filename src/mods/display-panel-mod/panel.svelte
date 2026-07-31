<script lang="ts" module>
	import EVENTS from '@events'
	import { currentFormatIsUtilityModelProject } from '@utility/formats/utility-model-project/index.ts'
	import { createScopedTranslator } from '@utility/util/lang.ts'
	import { log } from '@utility/util/log.ts'
	import type { PickValues } from '@utility/util/objUtils.ts'
	import { onMount } from 'svelte'
	import ArmSliders from './armSliders.svelte'

	const getDefaultArmRotation = (
		side: 'left' | 'right',
		primaryHand: 'left' | 'right'
	): ArrayVector3 => {
		const defaultX =
			displayReferenceObjects.refmodels.player.pose_angles[DisplayMode.display_slot] ?? 22.5
		if (side === 'left') {
			return primaryHand === 'left' ? [defaultX, 0, 0] : [0, 0, 0]
		} else {
			return primaryHand === 'right' ? [defaultX, 0, 0] : [0, 0, 0]
		}
	}

	const localize = createScopedTranslator('panel.arm_rotation')
</script>

<script lang="ts">
	let openProjectIsUtilityModelProject = $state(!!Project)
	let isDisplayModeActive = $state(false)
	let isPlayerRefModel = $state(false)
	let displaySlot = $state<DisplaySlot | undefined>(undefined)
	let isThirdPersonSlot = $derived(
		displaySlot?.slot_id === 'thirdperson_righthand' ||
			displaySlot?.slot_id === 'thirdperson_lefthand'
	)
	let previewOffhand = $state(false)

	const setArmRotation = (side: 'left' | 'right', rotation: ArrayVector3) => {
		const refModel = displayReferenceObjects.active
		if (!refModel) return

		const armName = side === 'left' ? 'left_arm' : 'right_arm'
		const armLayerName = side === 'left' ? 'left_arm_layer' : 'right_arm_layer'

		const objects = refModel.model.children.filter(
			obj => obj.name === armName || obj.name === armLayerName
		)

		objects.forEach(object => {
			object.rotation.order = "ZYX"
			object.rotation.set(
				(rotation[0] * Math.PI) / 180,
				(rotation[1] * Math.PI) / 180,
				(rotation[2] * Math.PI) / 180
			)
			object.matrixWorldNeedsUpdate = true
		})
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
		if (!(model && model.id === 'player')) {
			log.warn('No player ref model to reset display area of')
			return
		}

		model.updateBasePosition()
		const primaryHand = displaySlot?.slot_id === 'thirdperson_lefthand' ? 'left' : 'right'
		setArmRotation('left', getDefaultArmRotation('left', primaryHand))
		setArmRotation('right', getDefaultArmRotation('right', primaryHand))
	}

	const updatePreviewContainer = () => {
		resetReferenceModel()

		const model = displayReferenceObjects.active
		if (!(model && model.id === 'player')) {
			log.warn('No player ref model to attach display area to')
			return
		}

		// Only arm objects are marked with r_model
		const arms = model.model.children.filter(o => o.r_model === model.variant)

		const leftArm = arms.find(arm => arm.name === 'left_arm')
		const rightArm = arms.find(arm => arm.name === 'right_arm')

		if (displaySlot?.slot_id === 'thirdperson_lefthand' && leftArm) {
			DisplayMode.display_area.removeFromParent()
			const x = model.variant === 'alex' ? -1.5 : -2
			DisplayMode.setBase(x, -10, -2, -90, 0, 0, 1, 1, 1)
			leftArm.add(DisplayMode.display_area)
		} else if (displaySlot?.slot_id === 'thirdperson_righthand' && rightArm) {
			DisplayMode.display_area.removeFromParent()
			const x = model.variant === 'alex' ? 1.5 : 2
			DisplayMode.setBase(x, -10, -2, -90, 0, 0, 1, 1, 1)
			rightArm.add(DisplayMode.display_area)
		}

		return model
	}

	const updatePreview = () => {
		const model = updatePreviewContainer()
		if (!model) {
			log.warn('No ref model to update preview with')
			return
		}

		if (!displaySlot) {
			log.warn('No display slot data to update preview with')
			return
		}

		let leftArmRotation: ArrayVector3 | undefined
		let rightArmRotation: ArrayVector3 | undefined

		if (previewOffhand) {
			leftArmRotation = displaySlot.left_arm_rotation_when_offhand_occupied
			rightArmRotation = displaySlot.right_arm_rotation_when_offhand_occupied
		} else {
			leftArmRotation = displaySlot.left_arm_rotation
			rightArmRotation = displaySlot.right_arm_rotation
		}

		if (leftArmRotation) setArmRotation('left', leftArmRotation)
		if (rightArmRotation) setArmRotation('right', rightArmRotation)

		updateCanvas()
		requestAnimationFrame(updateCanvas)
	}

	const onpreviewChange = (
		channel: keyof PickValues<DisplaySlot, ArrayVector3 | undefined>,
		rotation: ArrayVector3 | undefined
	) => {
		if (channel.endsWith('occupied') && !previewOffhand) return
		if (channel.startsWith('left')) {
			if (rotation) setArmRotation('left', rotation)
			else setArmRotation('left', getDefaultArmRotation('left', 'right'))
		} else if (channel.startsWith('right')) {
			if (rotation) setArmRotation('right', rotation)
			else setArmRotation('right', getDefaultArmRotation('right', 'right'))
		}

		updateCanvas()
		requestAnimationFrame(updateCanvas)
	}

	const togglePreviewingOffhand = () => {
		previewOffhand = !previewOffhand
		updatePreview()
	}

	onMount(() => {
		const unsubs = [
			EVENTS.DISPLAY_SETTINGS_UPDATED.subscribe(slot => {
				console.log('DISPLAY_SETTINGS_UPDATED', slot.slot_id, displaySlot?.slot_id, slot)
				if (!currentFormatIsUtilityModelProject()) return
				if (slot !== displaySlot) return
				updatePreview()
			}),

			EVENTS.REF_MODEL_CHANGED.subscribe(({ refModel }) => {
				if (!currentFormatIsUtilityModelProject()) return
				isPlayerRefModel = !!(
					refModel && refModel.id === displayReferenceObjects.refmodels.player.id
				)
				updatePreview()
				requestAnimationFrame(() => {
					updatePreview()
				})
			}),

			EVENTS.DISPLAY_SLOT_CHANGED.subscribe(({ slot }) => {
				displaySlot = Project?.display_settings[slot]
				if (!currentFormatIsUtilityModelProject()) {
					resetReferenceModel()
					return
				}
				updatePreview()
				requestAnimationFrame(() => {
					updatePreview()
				})
			}),

			EVENTS.SELECT_MODE.subscribe(({ mode }) => {
				if (!currentFormatIsUtilityModelProject()) return
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
			style={visible ? 'color: var(--color-text);' : 'color: var(--color-subtle_text);'}
		>
			{#if visible}
				visibility
			{:else}
				visibility_off
			{/if}
		</i>
	</div>
{/snippet}

{#if openProjectIsUtilityModelProject && isDisplayModeActive}
	{#if isThirdPersonSlot}
		<p class="bar display_slot_section_bar title" title={localize('description')}>
			{localize('title')}
			{@render visibilityButton(!previewOffhand)}
		</p>

		{#if !isPlayerRefModel}
			<p class="warning">
				{@html localize('warning.non_player_ref_model')}
			</p>
		{/if}

		{#key displaySlot}
			<ArmSliders
				displaySlotChannel="left_arm_rotation"
				label={localize('left_arm.label')}
				{onpreviewChange}
			/>
			<ArmSliders
				displaySlotChannel="right_arm_rotation"
				label={localize('right_arm.label')}
				{onpreviewChange}
			/>

			<p
				class="bar display_slot_section_bar title"
				title={localize('when_offhand_occupied.description')}
			>
				{localize('when_offhand_occupied.title')}
				{@render visibilityButton(previewOffhand)}
			</p>

			<ArmSliders
				displaySlotChannel="left_arm_rotation_when_offhand_occupied"
				label={localize('left_arm.label')}
				{onpreviewChange}
			/>
			<ArmSliders
				displaySlotChannel="right_arm_rotation_when_offhand_occupied"
				label={localize('right_arm.label')}
				{onpreviewChange}
			/>
		{/key}
	{/if}
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
