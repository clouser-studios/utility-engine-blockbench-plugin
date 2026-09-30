<script lang="ts" module>
	import { createScopedTranslator } from '@utility/util/lang.ts'

	const localize = createScopedTranslator('panel.function_keyframe')

	/** Undo is handled by Blockbench's focus/blur listeners on `.keyframe_input` elements. */
	const setOnSelected = (key: 'commands' | 'condition', value: string) => {
		for (const keyframe of Timeline.selected) {
			const point = keyframe.data_points[0]
			if (point) point[key] = value
		}
	}
</script>

<script lang="ts">
	// The panel is remounted whenever the keyframe selection changes.
	const point = Timeline.selected.at(0)?.data_points[0]
	let commands = $state(point?.commands ?? '')
	let condition = $state(point?.condition ?? '')
</script>

<div class="bar flex function-keyframe-field">
	<label for="function_keyframe_commands" title={localize('commands.description')}>
		{localize('commands.label')}
	</label>
	<textarea
		id="function_keyframe_commands"
		class="dark_bordered code keyframe_input tab_target"
		rows="4"
		spellcheck="false"
		placeholder="say Hello, World!"
		bind:value={commands}
		oninput={() => setOnSelected('commands', commands)}></textarea>
</div>

<div class="bar flex function-keyframe-field">
	<label for="function_keyframe_condition" title={localize('condition.description')}>
		{localize('condition.label')}
	</label>
	<input
		id="function_keyframe_condition"
		type="text"
		class="dark_bordered code keyframe_input tab_target"
		spellcheck="false"
		placeholder="if score @s x matches 1.."
		bind:value={condition}
		oninput={() => setOnSelected('condition', condition)}
	/>
</div>

<style>
	.function-keyframe-field {
		flex-direction: column;
		align-items: stretch;
	}
	textarea {
		resize: vertical;
		min-height: 4em;
		font-family: var(--font-code);
	}
</style>
