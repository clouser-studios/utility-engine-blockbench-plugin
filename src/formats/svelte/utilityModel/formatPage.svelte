<script lang="ts">
	import Icon from '../../../assets/icons/icon.png'
	import { UTILITY_MODEL_FORMAT } from '../../utilityModel'

	function createModel() {
		newProject(UTILITY_MODEL_FORMAT)
		requestAnimationFrame(() => {
			Project!.openSettings()
		})
	}
</script>

<h2>
	<img src={Icon} alt="" />
	Utility Model
</h2>

<p class="format_description">The basic model format for Utility.</p>

<p class="format_target">
	<b>Target</b>:
	<span>Minecraft: Java Edition</span>
</p>

<h3 class="markdown">
	<p class="markdown">Getting Started</p>
</h3>

<p>
	<a href="URL-GOES-HERE">Check out the Docs</a> to learn how to use Utility Models.
</p>

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
