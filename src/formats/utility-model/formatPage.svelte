<script lang="ts" module>
	import Icon from '@utility/assets/icons/icon.png'
	import { createScopedTranslator } from '@utility/util/lang.ts'
	import { UTILITY_JSON_LOADER } from './index.ts'

	const localize = createScopedTranslator('model_loader.utility_model_json_loader')
</script>

<h2>
	<img src={Icon} alt="" />
	{localize('name')}
</h2>

<p class="model_format_description">
	{localize('description')}
</p>

<p class="format_target">
	<b>Target</b>:
	<span>Minecraft: Java Edition</span>
</p>

{@html localize('format_page')}

<div class="button_bar">
	<button onclick={() => UTILITY_JSON_LOADER.get()!.onStart()}>
		<i class="material-icons">arrow_forward</i>
		{localize('format_page_start_button')}
	</button>
</div>

<style>
	h2 {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: flex-start;
		margin-bottom: 16px;
	}
	img {
		width: 48px;
		height: 48px;
		border-radius: 8px;
		margin-right: 16px;
	}

	button {
		width: 100%;
		height: 40px;
	}
</style>
