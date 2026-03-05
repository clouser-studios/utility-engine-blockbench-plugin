<script lang="ts" module>
	import Icon from '@utility/assets/icons/icon.png'
	import { createScopedTranslator } from '@utility/util/lang.ts'
	import { UTILITY_MODEL_PROJECT_FORMAT } from './index.ts'

	const localize = createScopedTranslator('model_format.utility_model')
</script>

<script lang="ts">
	function createModel() {
		newProject(UTILITY_MODEL_PROJECT_FORMAT.get()!)
		requestAnimationFrame(() => {
			Project!.openSettings()
		})
	}
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
	<button onclick={() => createModel()}>
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
