<script lang="ts" module>
	import { createScopedTranslator } from '@utility/util/lang.ts'
	import { type Observable } from 'svelte-observable-store'

	const localize = createScopedTranslator('dialog.username_prompt')
</script>

<script lang="ts">
	interface Props {
		username: Observable<string>
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
