<script lang="ts">
	import { onMount } from 'svelte'
	import { type Observable } from 'svelte-observable-store'
	import BaseDialogItem from './dialogItem.svelte'

	interface Props extends DialogItemProps<string> {
		options: Record<string, string>
		defaultOption: string
		value: Observable<string>
	}

	const { label, tooltip = '', options, defaultOption, value }: Props = $props()

	let container: HTMLDivElement
	let selectInput: Interface.CustomElements.SelectInput<typeof options>

	function onreset() {
		$value = defaultOption
		if (selectInput.node) {
			selectInput.set(defaultOption)
		}
	}

	onMount(() => {
		if ($value === undefined || options[$value] === undefined) {
			$value = defaultOption
		}

		selectInput = new Interface.CustomElements.SelectInput('dialog-select', {
			get options() {
				return options
			},
			value: $value,
			onChange() {
				const v = selectInput.node.getAttribute('value') ?? ''
				$value = v
			},
		})

		container.appendChild(selectInput.node)
	})
</script>

<BaseDialogItem {label} {tooltip} {onreset}>
	{#snippet children(id)}
		<div bind:this={container} class="dialog_bar form_bar">
			<label class="name_space_left" for={id}>{label}</label>
		</div>
	{/snippet}
</BaseDialogItem>
