<script lang="ts">
	import { type Syncable } from '@utility/util/stores'
	import BaseDialogItem from './dialogItem.svelte'

	interface Props extends DialogItemProps<string> {
		options: Record<string, string>
		defaultOption: string
		value: Syncable<string>
	}

	const { label, tooltip = '', options, defaultOption, value }: Props = $props()

	let container: HTMLDivElement

	if (value.get() === undefined || options[value.get()] === undefined) {
		value.set(defaultOption)
	}

	const SELECT_INPUT = new Interface.CustomElements.SelectInput('dialog-select', {
		options,
		value: value.get(),
		onChange() {
			const v = SELECT_INPUT.node.getAttribute('value') ?? ''
			value.set(v)
		},
	})

	function onreset() {
		value.set(defaultOption)
		if (SELECT_INPUT.node) {
			SELECT_INPUT.set(defaultOption)
		}
	}

	requestAnimationFrame(() => {
		container.appendChild(SELECT_INPUT.node)
	})
</script>

<BaseDialogItem {label} {tooltip} {onreset}>
	{#snippet children(id)}
		<div bind:this={container} class="dialog_bar form_bar">
			<label class="name_space_left" for={id}>{label}</label>
		</div>
	{/snippet}
</BaseDialogItem>
