<script lang="ts">
	export let label: string
	export let onReset: (() => void) | undefined = undefined
</script>

<div class="bar display_slot_section_bar">
	<p class="panel_toolbar_label">{label}</p>
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div class="tool head_right" on:click={() => onReset?.()}>
		<i class="material-icons">replay</i>
	</div>
</div>
