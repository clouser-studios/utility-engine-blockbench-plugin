<script lang="ts">
	import { type Syncable } from '@utility/util/stores'
	import type { FileFilter } from 'electron'
	import BaseDialogItem from './dialogItem.svelte'

	interface Props extends DialogItemProps<string> {
		value: Syncable<string>
		defaultValue: string
		filters?: FileFilter[]
		fileSelectMessage?: string
	}

	const {
		label,
		tooltip = '',
		value,
		defaultValue,
		filters = [],
		fileSelectMessage = 'Select File',
		validate,
	}: Props = $props()

	let actualValue = $state(value.get())
	let statusMessage = $state<StatusMessage | undefined>()

	value.subscribe(() => {
		statusMessage = validate?.(value.get())
	})

	function onchange() {
		value.set(actualValue)
		actualValue = value.get()
	}

	function selectFile() {
		void Promise.any([
			// @ts-ignore
			electron.dialog.showOpenDialog({
				properties: ['openFile', 'promptToCreate'],
				filters,
				message: fileSelectMessage,
			}),
		]).then(result => {
			if (!result.canceled) {
				actualValue = result.filePaths[0]
				onchange()
			}
		})
	}

	function onreset() {
		actualValue = defaultValue
		onchange()
	}

	onchange()
</script>

<BaseDialogItem {label} {tooltip} {onreset} {statusMessage}>
	{#snippet children(id)}
		<div class="dialog_bar form_bar">
			<label class="name_space_left" for={id}>{label}</label>
			<input
				type="text"
				class="dark_bordered half focusable_input"
				{id}
				bind:value={actualValue}
				oninput={onchange}
				{onchange}
			/>
			<div class="tool animated-java-file-select-icon" onclick={() => selectFile()}>
				<i class="material-icons icon">insert_drive_file</i>
			</div>
		</div>
	{/snippet}
</BaseDialogItem>

<style>
	.animated-java-file-select-icon {
		display: flex;
		justify-content: flex-end;
	}
	i {
		font-size: 20px;
		margin-right: 4px;
		color: var(--color-subtle_text);
		cursor: pointer;
	}
	i:hover {
		color: var(--color-text);
	}
	input {
		font-family: var(--font-code);
	}
</style>
