<script lang="ts">
	import EVENTS from '@events'
	import { Syncable, SyncableArrayVector } from '@utility/util/stores'
	import { translate } from '@utility/util/translation'
	import DisplaySectionToolbar from './displaySectionToolbar.svelte'
	import Slider from './slider.svelte'

	const CUSTOM_LEFT_ARM_ROTATION = new Syncable(false)
	const CUSTOM_RIGHT_ARM_ROTATION = new Syncable(false)
	const LEFT_ROTATION = new SyncableArrayVector([0, 0, 0])
	const RIGHT_ROTATION = new SyncableArrayVector([0, 0, 0])

	function isPlayerRef() {
		return !!(
			typeof displayReferenceObjects.active !== 'string' && // refModel isn't globally available, so we have to check for a string instead
			displayReferenceObjects.active.name === displayReferenceObjects.refmodels.player.name
		)
	}

	function switchDisplayMode() {
		if (!display_mode) return
		const leftArmRotation = Project!.utility_display_settings[display_slot].left_arm_rotation
		if (leftArmRotation != undefined) {
			$CUSTOM_LEFT_ARM_ROTATION = true
			LEFT_ROTATION.fromGenericArray(leftArmRotation)
		} else {
			$CUSTOM_LEFT_ARM_ROTATION = false
			LEFT_ROTATION.fromGenericArray([0, 0, 0])
		}
		const rightArmRotation = Project!.utility_display_settings[display_slot].right_arm_rotation
		if (rightArmRotation != undefined) {
			$CUSTOM_RIGHT_ARM_ROTATION = true
			RIGHT_ROTATION.fromGenericArray(rightArmRotation)
		} else {
			$CUSTOM_RIGHT_ARM_ROTATION = false
			RIGHT_ROTATION.fromGenericArray([0, 0, 0])
		}
	}

	function updateModel() {
		if (!isPlayerRef()) {
			display_area.removeFromParent()
			scene.add(display_area)
			return
		}

		const refModel = displayReferenceObjects.active
		if (!refModel) return
		display_area.removeFromParent()

		if (!$CUSTOM_LEFT_ARM_ROTATION) {
			refModel.updateBasePosition()
			scene.add(display_area)
			return
		}

		const leftArm = refModel.model.getObjectByName('left_arm')
		const rightArm = refModel.model.getObjectByName('right_arm')

		switch (display_slot) {
			case 'thirdperson_righthand': {
				const x = refModel.variant === 'alex' ? 1.5 : 2
				DisplayMode.setBase(x, -10, -2, -90, 0, 0, 1, 1, 1)
				if (rightArm) {
					rightArm.add(display_area)
				}
				break
			}
			case 'thirdperson_lefthand': {
				const x = refModel.variant === 'alex' ? -1.5 : -2
				DisplayMode.setBase(x, -10, -2, -90, 0, 0, 1, 1, 1)
				if (leftArm) {
					leftArm.add(display_area)
				}
				break
			}
		}

		if (rightArm) {
			rightArm.rotation.set(
				Math.degToRad(RIGHT_ROTATION.x),
				Math.degToRad(RIGHT_ROTATION.y),
				Math.degToRad(RIGHT_ROTATION.z!)
			)
		}
		const rightArmLayer = refModel.model.getObjectByName('right_arm_layer')
		if (rightArmLayer) {
			rightArmLayer.rotation.set(
				Math.degToRad(RIGHT_ROTATION.x),
				Math.degToRad(RIGHT_ROTATION.y),
				Math.degToRad(RIGHT_ROTATION.z!)
			)
		}

		if (leftArm) {
			leftArm.rotation.set(
				Math.degToRad(LEFT_ROTATION.x),
				Math.degToRad(LEFT_ROTATION.y),
				Math.degToRad(LEFT_ROTATION.z!)
			)
		}
		const leftArmLayer = refModel.model.getObjectByName('left_arm_layer')
		if (leftArmLayer) {
			leftArmLayer.rotation.set(
				Math.degToRad(LEFT_ROTATION.x),
				Math.degToRad(LEFT_ROTATION.y),
				Math.degToRad(LEFT_ROTATION.z!)
			)
		}
	}

	function updateProject() {
		if (!display_mode) return
		// Update the project with the new arm rotation values
		if ($CUSTOM_LEFT_ARM_ROTATION) {
			console.log('Custom left arm rotation', LEFT_ROTATION.toArrayVector())
			Project!.utility_display_settings[display_slot].left_arm_rotation =
				LEFT_ROTATION.toArrayVector()
		} else {
			delete Project!.utility_display_settings[display_slot].left_arm_rotation
		}

		if ($CUSTOM_RIGHT_ARM_ROTATION) {
			console.log('Custom right arm rotation', RIGHT_ROTATION.toArrayVector())
			Project!.utility_display_settings[display_slot].right_arm_rotation =
				RIGHT_ROTATION.toArrayVector()
		} else {
			delete Project!.utility_display_settings[display_slot].right_arm_rotation
		}
	}

	CUSTOM_LEFT_ARM_ROTATION.subscribe(() => {
		updateProject()
		updateModel()
	})
	CUSTOM_RIGHT_ARM_ROTATION.subscribe(() => {
		updateProject()
		updateModel()
	})
	LEFT_ROTATION.subscribe(() => {
		updateProject()
		updateModel()
	})
	RIGHT_ROTATION.subscribe(() => {
		updateProject()
		updateModel()
	})

	EVENTS.SELECT_MODE.subscribe(({ mode }: { mode: Mode }) => {
		if (mode.id === Modes.options.display.id) {
			requestAnimationFrame(() => {
				updateModel()
			})
		}
	})

	addEventListener('input', event => {
		if (event.target instanceof HTMLInputElement && event.target?.name === 'display') {
			requestAnimationFrame(() => {
				switchDisplayMode()
				updateModel()
			})
		}
	})

	function resetLeftRotation() {
		LEFT_ROTATION.set([0, 0, 0])
	}

	function resetRightRotation() {
		RIGHT_ROTATION.set([0, 0, 0])
	}
</script>

<DisplaySectionToolbar
	label={translate('panel.arm_rotation.left_rotation.label')}
	onReset={resetRightRotation}
/>

<div class="bar checkbox-bar">
	<input
		type="checkbox"
		class="focusable_input"
		id="custom_left_arm_rotation"
		bind:checked={$CUSTOM_LEFT_ARM_ROTATION}
	/>
	<label for="custom_left_arm_rotation"
		>{translate('panel.arm_rotation.custom_left_arm_rotation.label')}</label
	>
</div>

{#if $CUSTOM_LEFT_ARM_ROTATION}
	<Slider
		max={180}
		min={-180}
		numberSliderStep={0.5}
		step={1}
		thumbColor={'var(--color-axis-x)'}
		value={RIGHT_ROTATION.getXSyncable()}
	/>
	<Slider
		max={180}
		min={-180}
		numberSliderStep={0.5}
		step={1}
		thumbColor={'var(--color-axis-y)'}
		value={RIGHT_ROTATION.getYSyncable()}
	/>
	<Slider
		max={180}
		min={-180}
		numberSliderStep={0.5}
		step={1}
		thumbColor={'var(--color-axis-z)'}
		value={RIGHT_ROTATION.getZSyncable()}
	/>
{/if}

<DisplaySectionToolbar
	label={translate('panel.arm_rotation.right_rotation.label')}
	onReset={resetLeftRotation}
/>
<div class="bar checkbox-bar">
	<input
		type="checkbox"
		class="focusable_input"
		id="custom_right_arm_rotation"
		bind:checked={$CUSTOM_RIGHT_ARM_ROTATION}
	/>
	<label for="custom_right_arm_rotation"
		>{translate('panel.arm_rotation.custom_right_arm_rotation.label')}</label
	>
</div>
{#if $CUSTOM_RIGHT_ARM_ROTATION}
	<Slider
		max={180}
		min={-180}
		numberSliderStep={0.5}
		step={1}
		thumbColor={'var(--color-axis-x)'}
		value={LEFT_ROTATION.getXSyncable()}
	/>
	<Slider
		max={180}
		min={-180}
		numberSliderStep={0.5}
		step={1}
		thumbColor={'var(--color-axis-y)'}
		value={LEFT_ROTATION.getYSyncable()}
	/>
	<Slider
		max={180}
		min={-180}
		numberSliderStep={0.5}
		step={1}
		thumbColor={'var(--color-axis-z)'}
		value={LEFT_ROTATION.getZSyncable()}
	/>
{/if}

<style>
	:global(#panel_display .panel_vue_wrapper #display_sliders :nth-child(n + 13)) {
		display: none !important;
	}
	.checkbox-bar {
		display: flex;
		align-items: center;
		justify-content: flex-start;
	}
</style>
