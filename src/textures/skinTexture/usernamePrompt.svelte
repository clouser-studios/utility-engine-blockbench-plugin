<script lang="ts">
	import { type Valuable } from '../../util/stores'
	import { translate } from '../../util/translation'

	export let username: Valuable<string | undefined>
</script>

<div class="dialog_bar form_bar">
	<label class="name_space_left" for="username"
		>{translate('dialog.username_prompt.username.label')}</label
	>
	<input
		type="text"
		class="dark_bordered half focusable_input"
		id="username"
		bind:value={$username}
		placeholder={translate('dialog.username_prompt.username.placeholder')}
	/>
</div>

<style>
	div {
		align-items: center;
	}
	input {
		font-family: var(--font-code);
	}
</style>
