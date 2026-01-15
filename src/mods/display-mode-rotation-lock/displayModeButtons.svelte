<script lang="ts" module>
	// import EVENTS from '@events'
	// import { onDestroy, onMount } from 'svelte'
	// import { writable } from 'svelte/store'
</script>

<script lang="ts">
	// let selectedMode = writable<string | null>(null)

	// onMount(() => {
	// 	const unsub = EVENTS.SELECT_MODE.subscribe(({ mode }) => {
	// 		$selectedMode = mode ? mode.id : null
	// 	})

	// 	onDestroy(unsub)
	// })
</script>

<div class="container">
	<input type="checkbox" id="lock-vertical-rotation" />
	<label for="lock-vertical-rotation">Lock Vertical Rotation</label>
	<input type="checkbox" id="lock-horizontal-rotation" />
	<label for="lock-horizontal-rotation">Lock Horizontal Rotation</label>
</div>

<style>
	.container {
		position: absolute;
		top: 0;
		left: 0;
		z-index: 10;

		display: grid;
		grid-template-columns: max-content max-content;
		padding: 4px 8px;
		align-items: center;
	}
</style>
