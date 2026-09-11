<script lang="ts">
	import type { FileFilter } from 'electron'
	import { type Observable } from 'svelte-observable-store'
	import BaseDialogItem from './dialogItem.svelte'

	interface Props extends DialogItemProps<string> {
		value: Observable<string>
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
		fileSelectMessage = 'Select Folder',
		validate,
	}: Props = $props()

	let _value = $state(value.get())
	let statusMessage = $state<StatusMessage | undefined>()

	value.subscribe(() => {
		statusMessage = validate?.(value.get())
	})

	function onchange() {
		value.set(_value)
		_value = value.get()
	}

	function selectFile() {
		void Promise.any([
			// @ts-ignore
			electron.dialog.showOpenDialog({
				properties: ['openDirectory'],
				filters,
				message: fileSelectMessage,
			}),
		]).then(result => {
			if (!result.canceled) {
				_value = result.filePaths[0]
				onchange()
			}
		})
	}

	function onreset() {
		_value = defaultValue
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
				bind:value={_value}
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
