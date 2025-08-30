<script lang="ts">
	import Icon from '@utility/assets/icons/icon.png'
	import { translate } from '@utility/util/translation'
	import { UTILITY_MODEL_PROJECT_FORMAT } from '..'

	function createModel() {
		newProject(UTILITY_MODEL_PROJECT_FORMAT)
		requestAnimationFrame(() => {
			Project!.openSettings()
		})
	}
</script>

<h2>
	<img src={Icon} alt="" />
	{translate('model_format.utility_model.name')}
</h2>

<p class="model_format_description">
	{translate('model_format.utility_model.description')}
</p>

<p class="format_target">
	<b>Target</b>:
	<span>Minecraft: Java Edition</span>
</p>

<!-- svelte-ignore missing-declaration -->
{@html pureMarked(translate('model_format.utility_model.format_page'))}

<div class="button_bar">
	<button on:click={() => createModel()}>
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
