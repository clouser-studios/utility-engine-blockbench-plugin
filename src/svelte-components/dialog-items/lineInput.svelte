<script lang="ts">
	import { type Syncable } from '@utility/util/stores'
	import DialogItem from './dialogItem.svelte'

	interface Props extends DialogItemProps<string> {
		value: Syncable<string>
		defaultValue: string
	}

	const { label, tooltip = '', value, defaultValue, disabled = false, validate }: Props = $props()

	let actualValue: string = $state(value.get())
	let statusMessage = $state<StatusMessage | undefined>()

	function onValueChange() {
		statusMessage = validate?.(actualValue)
		value.set(actualValue)
		actualValue = value.get()
	}

	function onreset() {
		actualValue = defaultValue
		onValueChange()
	}

	onValueChange()
</script>

<DialogItem {label} {tooltip} {onreset} {statusMessage}>
	{#snippet children(id)}
		<div class="dialog_bar form_bar">
			<label class="name_space_left" for={id}>{label}</label>
			<input
				type="text"
				class="dark_bordered half focusable_input"
				{id}
				bind:value={actualValue}
				onchange={onValueChange}
				{disabled}
				style={disabled ? 'color: var(--color-subtle_text);' : ''}
			/>
		</div>
	{/snippet}
</DialogItem>

<style>
	input {
		font-family: var(--font-code);
	}
</style>
