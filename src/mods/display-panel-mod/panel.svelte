<script lang="ts" module>
	import { currentFormatIsUtilityModelProject } from '@utility/formats/utility-model-project'
	import { type UtilityModelProject } from '@utility/formats/utility-model-project/versions/latest'
	import EVENTS from '@utility/util/events'
	import { createScopedTranslator } from '@utility/util/lang'
	import { onMount } from 'svelte'
	import ArmSliders from './armSliders.svelte'

	const getDefaultArmRotation = (
		side: 'left' | 'right',
		primaryHand: 'left' | 'right'
	): ArrayVector3 => {
		if (side === 'left') {
			return primaryHand === 'left' ? [22.5, 0, 0] : [0, 0, 0]
		} else {
			return primaryHand === 'right' ? [22.5, 0, 0] : [0, 0, 0]
		}
	}

	const localize = createScopedTranslator('panel.arm_rotation')
</script>

<script lang="ts">
	let hasOpenUtilityModelProject = $state(!!Project)
	let isPlayerRefModel = $state(false)
	let displaySlot = $state<DisplaySlotName>(display_slot ?? 'thirdperson_righthand')
	let isThirdPersonSlot = $derived(
		displaySlot === 'thirdperson_righthand' || displaySlot === 'thirdperson_lefthand'
	)
	let previewingOffhand = $state(false)

	const setArmRotation = (side: 'left' | 'right', rotation: ArrayVector3) => {
		const refModel = displayReferenceObjects.active
		if (!refModel) return

		const armName = side === 'left' ? 'left_arm' : 'right_arm'
		const armLayerName = side === 'left' ? 'left_arm_layer' : 'right_arm_layer'

		const objects = refModel.model.children.filter(
			obj => obj.name === armName || obj.name === armLayerName
		)

		objects.forEach(object => {
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

	const resetRefModel = (
		refModel: typeof displayReferenceObjects.active,
		visualUpdate = false
	): refModel is '' => {
		display_area.removeFromParent()
		scene.add(display_area)

		if (!isPlayerRefModel) return true
		if (!refModel) return true

		refModel.updateBasePosition()
		const primaryHand = displaySlot === 'thirdperson_lefthand' ? 'left' : 'right'
		setArmRotation('left', getDefaultArmRotation('left', primaryHand))
		setArmRotation('right', getDefaultArmRotation('right', primaryHand))
		if (visualUpdate) updateCanvas()
		return false
	}

	const updateRefModel = () => {
		const refModel = displayReferenceObjects.active
		if (resetRefModel(refModel)) return

		// Only arm objects are marked with r_model
		const arms = refModel.model.children.filter(o => o.r_model === refModel.variant)

		const leftArm = arms.find(arm => arm.name === 'left_arm')
		const rightArm = arms.find(arm => arm.name === 'right_arm')

		if (displaySlot === 'thirdperson_lefthand' && leftArm) {
			display_area.removeFromParent()
			const x = refModel.variant === 'alex' ? -1.5 : -2
			DisplayMode.setBase(x, -10, -2, -90, 0, 0, 1, 1, 1)
			leftArm.add(display_area)
		} else if (displaySlot === 'thirdperson_righthand' && rightArm) {
			display_area.removeFromParent()
			const x = refModel.variant === 'alex' ? 1.5 : 2
			DisplayMode.setBase(x, -10, -2, -90, 0, 0, 1, 1, 1)
			rightArm.add(display_area)
		}

		const settings = Project!.utility_display_settings[displaySlot]

		let leftArmRotation: ArrayVector3 | undefined
		let rightArmRotation: ArrayVector3 | undefined

		if (previewingOffhand) {
			leftArmRotation = settings?.left_arm_rotation_when_offhand_occupied
			rightArmRotation = settings?.right_arm_rotation_when_offhand_occupied
		} else {
			leftArmRotation = settings?.left_arm_rotation
			rightArmRotation = settings?.right_arm_rotation
		}

		if (leftArmRotation) {
			setArmRotation('left', leftArmRotation)
		}

		if (rightArmRotation) {
			setArmRotation('right', rightArmRotation)
		}

		updateCanvas()
		requestAnimationFrame(updateCanvas)
	}

	const onchange = (
		key: keyof UtilityModelProject.UtilityDisplaySettings,
		overwrite: boolean,
		rotation: ArrayVector3 | undefined
	) => {
		const settings = (Project!.utility_display_settings[displaySlot] ??= {})

		if (overwrite) {
			settings[key] = rotation
		} else {
			delete settings[key]
			if (Object.keys(settings).length === 0) {
				delete Project!.utility_display_settings[displaySlot]
			}
		}

		// This was supposed to automatically toggle offhand previewing when editing arm rotations,
		// but it appears to cause a recursive effect loop...
		// previewingOffhand = !(key === 'left_arm_rotation' || key === 'right_arm_rotation')

		updateRefModel()
	}

	const togglePreviewingOffhand = () => {
		previewingOffhand = !previewingOffhand
	}

	onMount(() => {
		const unsubs = [
			EVENTS.REF_MODEL_CHANGED.subscribe(({ refModel }) => {
				if (!currentFormatIsUtilityModelProject()) return
				isPlayerRefModel = !!(
					refModel && refModel.id === displayReferenceObjects.refmodels.player.id
				)
				updateRefModel()
			}),

			EVENTS.DISPLAY_SLOT_CHANGED.subscribe(({ slot }) => {
				if (!currentFormatIsUtilityModelProject()) return
				displaySlot = slot
			}),

			EVENTS.SELECT_MODE.subscribe(({ mode }) => {
				if (!currentFormatIsUtilityModelProject()) return
				if (mode?.id !== 'display') return
				requestAnimationFrame(() => {
					updateRefModel()
				})
			}),

			EVENTS.SELECT_PROJECT.subscribe(project => {
				hasOpenUtilityModelProject = !!project && currentFormatIsUtilityModelProject()
				resetRefModel(displayReferenceObjects.active, true)
			}),

			EVENTS.UNSELECT_PROJECT.subscribe(() => {
				hasOpenUtilityModelProject = false
				resetRefModel(displayReferenceObjects.active, true)
			}),
		]

		return () => {
			unsubs.forEach(unsub => unsub())
			resetRefModel(displayReferenceObjects.active, true)
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

{#if hasOpenUtilityModelProject}
	{#if isThirdPersonSlot}
		<p class="bar display_slot_section_bar title" title={localize('description')}>
			{localize('title')}
			{@render visibilityButton(!previewingOffhand)}
		</p>

		{#if !isPlayerRefModel}
			<p class="warning">
				{@html localize('warning.non_player_ref_model')}
			</p>
		{/if}

		{#key displaySlot}
			<ArmSliders
				displaySettingsKey="left_arm_rotation"
				label={localize('left_arm.label')}
				{onchange}
			/>
			<ArmSliders
				displaySettingsKey="right_arm_rotation"
				label={localize('right_arm.label')}
				{onchange}
			/>

			<p
				class="bar display_slot_section_bar title"
				title={localize('when_offhand_occupied.description')}
			>
				{localize('when_offhand_occupied.title')}
				{@render visibilityButton(previewingOffhand)}
			</p>

			<ArmSliders
				displaySettingsKey="left_arm_rotation_when_offhand_occupied"
				label={localize('left_arm.label')}
				{onchange}
			/>
			<ArmSliders
				displaySettingsKey="right_arm_rotation_when_offhand_occupied"
				label={localize('right_arm.label')}
				{onchange}
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
