<script lang="ts" module>
	import { currentFormatIsUtilityModelProject } from '@utility/formats/utility-model-project/index.ts'
	import { createScopedTranslator } from '@utility/util/lang.ts'
	import { onMount } from 'svelte'

	const localizeRenderPasses = createScopedTranslator('element_properties.render_passes')

	const REFRESH_ON: BlockbenchEventName[] = [
		'update_selection',
		'undo',
		'redo',
		'select_project',
		'unselect_project',
	]

	function selectedElements(): Array<Cube | Mesh> {
		if (!currentFormatIsUtilityModelProject()) return []
		return Outliner.selected.filter(el => el instanceof Cube || el instanceof Mesh)
	}
</script>

<script lang="ts">
	let elements = $state<Array<Cube | Mesh>>([])
	let renderPasses = $state<string[]>([])

	function refresh() {
		elements = selectedElements()
		renderPasses = [...(elements[0]?.render_passes ?? [])]
	}

	function commitRenderPasses(label: string) {
		if (elements.length === 0) return
		Undo.initEdit({ elements })
		for (const element of elements) {
			element.render_passes = renderPasses.slice()
		}
		Undo.finishEdit(label)
	}

	function addRenderPass() {
		renderPasses.push('')
		commitRenderPasses('Add render pass')
	}

	function removeRenderPass(index: number) {
		renderPasses.splice(index, 1)
		commitRenderPasses('Remove render pass')
	}

	onMount(() => {
		refresh()
		for (const event of REFRESH_ON) Blockbench.on(event, refresh)
		return () => {
			for (const event of REFRESH_ON) Blockbench.removeListener(event, refresh)
		}
	})
</script>

{#if elements.length}
	<div class="element_properties_section" title={localizeRenderPasses('description')}>
		<span class="element_properties_section_label">{localizeRenderPasses('label')}</span>
		<div class="text_button" title={localizeRenderPasses('add')} onclick={addRenderPass}>
			<i class="fa fa-plus"></i>
		</div>
	</div>

	{#if renderPasses.length}
		<ul class="element_properties_list">
			{#each renderPasses as _pass, index (index)}
				<li class="bar flex">
					<input
						type="text"
						class="dark_bordered focusable_input"
						placeholder={localizeRenderPasses('placeholder')}
						bind:value={renderPasses[index]}
						onchange={() => commitRenderPasses('Rename render pass')}
					/>
					<div
						class="tool"
						title={localizeRenderPasses('remove')}
						onclick={() => removeRenderPass(index)}
					>
						<i class="material-icons">clear</i>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
{/if}

<style>
	.element_properties_section {
		display: flex;
		align-items: center;
		height: 30px;
		padding-right: 5px;
	}
	.element_properties_section_label {
		margin-left: 8px;
	}
	.element_properties_section > .text_button {
		margin-left: auto;
		width: 24px;
		text-align: center;
	}
	.element_properties_list {
		list-style: none;
		margin: 0 0 4px 8px;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 3px;
	}
	.element_properties_list input {
		flex-grow: 1;
	}
</style>
