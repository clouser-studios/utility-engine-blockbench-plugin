<script lang="ts">
	import { onDestroy } from 'svelte'
	import { type Observable } from 'svelte-observable-store'
	import BaseDialogItem from './dialogItem.svelte'

	interface Props extends DialogItemProps<string> {
		value: Observable<string>
		defaultValue?: string
	}

	const { label, tooltip = '', value, defaultValue = '#ffffff' }: Props = $props()

	const COLOR_PICKER = new ColorPicker(`utility_engine:${label}-color_picker`, {
		onChange() {
			const color = COLOR_PICKER.get() as tinycolor.Instance
			value.set(color.toHexString())
		},
	})
	let colorPickerMount: HTMLDivElement

	function onLoad(el: HTMLDivElement) {
		COLOR_PICKER.toElement(el)
		COLOR_PICKER.set(value.get())
	}

	function onreset() {
		value.set(defaultValue)
	}

	onDestroy(() => {
		COLOR_PICKER.delete()
	})
</script>

<BaseDialogItem {label} {tooltip} {onreset}>
	{#snippet children(id)}
		<div class="dialog_bar form_bar">
			<label class="name_space_left" for={id}>{label}</label>
			<div bind:this={colorPickerMount} use:onLoad></div>
		</div>
	{/snippet}
</BaseDialogItem>
