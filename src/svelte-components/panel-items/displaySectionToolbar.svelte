<script lang="ts">
	import type { Snippet } from 'svelte'

	interface Props {
		label: string
		onreset?: () => void
		children?: Snippet
	}
	let { label, onreset = undefined, children }: Props = $props()
</script>

<div class="bar display_slot_section_bar">
	<p class="panel_toolbar_label">{label}</p>
	{@render children?.()}
	<div class="tool head_right" onclick={onreset}>
		<i class="material-icons">replay</i>
	</div>
</div>
