<script lang="ts" module>
	import EVENTS from '@events'
	import { currentFormatIsUtilityModelProject } from '@utility/formats/utility-model-project/index.ts'
	import { createScopedTranslator } from '@utility/util/lang.ts'
	import { parsePackPath } from '@utility/util/minecraftUtil.ts'
	import { onMount } from 'svelte'

	const localize = createScopedTranslator('panel.overrides')

	const activeSlot = (): DisplaySlot | undefined => {
		if (!Modes.display || !currentFormatIsUtilityModelProject()) return undefined
		return Project?.display_settings[DisplayMode.display_slot]
	}

	/** The slot's transforms don't apply while it's overridden, so hide the native sliders. */
	const setNativeSlidersHidden = (hidden: boolean) => {
		const el = document.querySelector<HTMLElement>('#panel_display #display_sliders')
		if (el) el.style.display = hidden ? 'none' : ''
	}
</script>

<script lang="ts">
	let slot = $state<DisplaySlot | undefined>(activeSlot())
	let enabled = $state(false)
	let value = $state('')

	const applyEnabledState = () => {
		setNativeSlidersHidden(enabled)
		EVENTS.DISPLAY_OVERRIDE_CHANGED.publish(enabled)
	}

	const refresh = () => {
		slot = activeSlot()
		enabled = !!slot?.overrides
		value = slot?.overrides ?? ''
		applyEnabledState()
	}

	const commit = () => {
		if (!slot) return
		Undo.initEdit({ display_slots: [slot.slot_id] })
		slot.overrides = enabled && value ? value : undefined
		Undo.finishEdit('Set display override')
		applyEnabledState()
	}

	const pickModelFile = () => {
		Blockbench.import(
			{
				resource_id: 'model',
				type: 'Model',
				extensions: ['json'],
				readtype: 'none',
				title: localize('pick_file'),
			},
			(files: Filesystem.FileResult[]) => {
				const file = files.at(0)
				if (!file) return
				const parsed = parsePackPath('assets', file.path, true)
				if (!parsed) {
					Blockbench.showQuickMessage(localize('not_in_resource_pack'), 3000)
					return
				}
				value = parsed.resourceLocation
				enabled = true
				commit()
			}
		)
	}

	onMount(() => {
		refresh()
		const onHistory = (entry: UndoEntry) => {
			if (entry.before?.display_slots || entry.post?.display_slots) refresh()
		}
		const unsubs = [
			EVENTS.DISPLAY_SLOT_CHANGED.subscribe(refresh),
			EVENTS.SELECT_MODE.subscribe(refresh),
			EVENTS.SELECT_PROJECT.subscribe(refresh),
			EVENTS.UNSELECT_PROJECT.subscribe(refresh),
			EVENTS.UNDO.subscribe(onHistory),
			EVENTS.REDO.subscribe(onHistory),
		]
		return () => {
			unsubs.forEach(unsub => unsub())
			setNativeSlidersHidden(false)
		}
	})
</script>

{#if slot}
	<div class="bar display_slot_section_bar" title={localize('description')}>
		<p class="panel_toolbar_label">{localize('label')}</p>
	</div>
	<div class="bar override_input_bar">
		<input type="checkbox" bind:checked={enabled} onchange={commit} />
		<input
			type="text"
			class="dark_bordered focusable_input"
			placeholder={localize('placeholder')}
			disabled={!enabled}
			bind:value
			onchange={commit}
		/>
		<div class="tool" title={localize('pick_file')} onclick={pickModelFile}>
			<i class="material-icons">insert_drive_file</i>
		</div>
	</div>
{/if}

<style>
	.override_input_bar {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 0 8px 4px;
	}
	.override_input_bar input[type='text'] {
		flex-grow: 1;
	}
</style>
