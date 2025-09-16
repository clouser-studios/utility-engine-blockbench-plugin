<script lang="ts" module>
	import Icon from '@utility/assets/icons/icon.png'
	import { createScopedTranslator } from '@utility/util/lang'
	import { UTILITY_MODEL_PROJECT_FORMAT } from '.'

	const localize = createScopedTranslator('model_format.utility_model')
</script>

<script lang="ts">
	function createModel() {
		newProject(UTILITY_MODEL_PROJECT_FORMAT)
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

{@html pureMarked(localize('format_page'))}

<div class="button_bar">
	<button onclick={() => createModel()}>
		<i class="material-icons">arrow_forward</i>
		Create new Utility Model
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

	/* li {
		margin-left: 24px;
	} */
</style>
