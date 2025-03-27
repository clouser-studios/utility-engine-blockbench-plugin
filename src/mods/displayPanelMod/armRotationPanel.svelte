<script lang="ts">
	import { Syncable, SyncableArrayVector } from '../../util/stores'
	import { translate } from '../../util/translation'
	import DisplaySectionToolbar from './displaySectionToolbar.svelte'
	import Slider from './slider.svelte'

	const OVERWRITE_ARM_ROTATION = new Syncable(false)
	const LEFT_ROTATION = new SyncableArrayVector([0, 0, 0])
	const RIGHT_ROTATION = new SyncableArrayVector([0, 0, 0])

	function isPlayerRef() {
		return !!(
			displayReferenceObjects.active?.name === displayReferenceObjects.refmodels.player.name
		)
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

		if (!$OVERWRITE_ARM_ROTATION) {
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

	OVERWRITE_ARM_ROTATION.subscribe(() => {
		updateModel()
	})

	LEFT_ROTATION.subscribe(() => {
		updateModel()
	})

	RIGHT_ROTATION.subscribe(() => {
		updateModel()
	})

	Blockbench.on<EventName>('select_mode', ({ mode }: { mode: Mode }) => {
		if (mode.id === Modes.options.display.id) {
			requestAnimationFrame(() => {
				updateModel()
			})
		}
	})

	addEventListener('input', event => {
		if (event.target instanceof HTMLInputElement && event.target?.name === 'display') {
			updateModel()
		}
	})

	function resetLeftRotation() {
		LEFT_ROTATION.set([0, 0, 0])
	}

	function resetRightRotation() {
		RIGHT_ROTATION.set([0, 0, 0])
	}
</script>

<div class="bar checkbox-bar">
	<input
		type="checkbox"
		class="focusable_input"
		id="overwrite_arm_rotation"
		bind:checked={$OVERWRITE_ARM_ROTATION}
	/>
	<label for="overwrite_arm_rotation"
		>{translate('panel.arm_rotation.overwrite_arm_rotation.label')}</label
	>
</div>

<DisplaySectionToolbar
	label={translate('panel.arm_rotation.right_rotation.label')}
	onReset={resetRightRotation}
/>
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

<DisplaySectionToolbar
	label={translate('panel.arm_rotation.left_rotation.label')}
	onReset={resetLeftRotation}
/>
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
