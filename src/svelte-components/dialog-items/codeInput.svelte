<script lang="ts">
	import { type Syncable } from '@utility/util/stores'
	import BaseDialogItem from './dialogItem.svelte'

	interface Props extends DialogItemProps<string> {
		value: Syncable<string>
		defaultValue: string
		disabled?: boolean
	}

	const { label, tooltip = '', value, defaultValue, disabled = false, validate }: Props = $props()

	let actualValue = $state(value.get())
	let statusMessage = $state<StatusMessage | undefined>()

	function onchange() {
		statusMessage = validate?.(actualValue)
		value.set(actualValue)
		actualValue = value.get()
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
			<textarea
				class="dark_bordered half focusable_input"
				{id}
				bind:value={actualValue}
				{onchange}
				{disabled}
				style={disabled ? 'color: var(--color-subtle_text);' : ''}
			></textarea>
		</div>
	{/snippet}
</BaseDialogItem>

<style>
	textarea {
		resize: vertical;
		text-wrap: nowrap;
		min-height: 60px;
		font-family: var(--font-code);
	}
</style>
