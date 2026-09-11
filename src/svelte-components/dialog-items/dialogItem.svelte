<script lang="ts">
	import { localize } from '@utility/util/lang.ts'
	import type { Snippet } from 'svelte'

	export interface Props extends Omit<DialogItemProps<any>, 'validate'> {
		onreset?: () => void
		statusMessage?: StatusMessage
		children: Snippet<[string]>
	}

	const {
		tooltip = '',
		onreset,
		statusMessage = $bindable(undefined),
		children,
	}: Props = $props()

	const ID = guid()

	function onQuestionMarkClick() {
		Blockbench.showQuickMessage(tooltip, 50 * tooltip.length)
	}
</script>

<div>
	<div class="base_dialog_item" title={tooltip}>
		<div class="slot_container" style={tooltip ? 'margin-right: 4px' : ''}>
			{@render children(ID)}
		</div>
		{#if tooltip}
			<i
				class="fa fa-question dialog_form_description dialog-form-description"
				onclick={onQuestionMarkClick}
			></i>
		{:else}
			<i
				class="fa fa-question dialog_form_description dialog-form-description"
				style="visibility: hidden"
			></i>
		{/if}
		<i
			onclick={onreset}
			class="fa fa-trash-can dialog_form_description dialog-form-description reset-button"
			title={localize('dialog.reset')}
		>
		</i>
	</div>
	<div class="base_dialog_item">
		{#if statusMessage?.type === 'error'}
			<div class="error_text">
				<i class="fa fa-exclamation-circle dialog_form_error text_icon"></i>
				<div class="error_lines">
					{#each statusMessage.message.split('\n') as text}
						<div>{text}</div>
					{/each}
				</div>
			</div>
		{:else if statusMessage?.type === 'warning'}
			<div class="warning_text">
				<i class="fa fa-exclamation-triangle dialog_form_warning text_icon"></i>
				<div class="warning_lines">
					{#each statusMessage.message.split('\n') as text}
						<div>{text}</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.base_dialog_item {
		display: flex;
		flex-direction: row;
		/* align-items: center; */
		justify-content: space-between;
	}
	.slot_container {
		flex-grow: 1;
	}
	.warning_text {
		display: flex;
		align-items: center;
		color: var(--color-warning);
		font-family: var(--font-code);
		font-size: 0.8em;
	}
	.warning_lines {
		display: flex;
		flex-direction: column;
	}
	.error_text {
		display: flex;
		align-items: center;
		color: var(--color-error);
		font-family: var(--font-code);
		font-size: 0.8em;
	}
	.error_lines {
		display: flex;
		flex-direction: column;
	}
	.text_icon {
		margin-right: 8px;
	}
	.dialog-form-description {
		padding-top: 12px;
	}
	.reset-button {
		padding-top: 12px;
		margin-left: 4px;
	}
	.reset-button:hover {
		color: var(--color-error);
		transition: unset;
	}
</style>
