<script lang="ts" module>
	import { createScopedTranslator } from '@utility/util/lang'
	import { type Syncable } from '@utility/util/stores'

	const localize = createScopedTranslator('dialog.username_prompt')
</script>

<script lang="ts">
	interface Props {
		username: Syncable<string>
	}
	let { username }: Props = $props()
</script>

<div class="dialog_bar form_bar">
	<label class="name_space_left" for="username">
		{localize('username.label')}
	</label>
	<input
		type="text"
		class="dark_bordered half focusable_input"
		id="username"
		bind:value={$username}
		placeholder={localize('username.placeholder')}
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
