import PACKAGE from '@package'
import { pollUntilResult } from '@utility/util/promises'
import type { ResourceLocation } from '@utility/util/resourceLocation'
import { mount } from 'svelte'
import type { ComponentMountOptions, GenericComponent } from './helperTypes'

type SveltePanelOptions<ID extends string, C extends GenericComponent> = {
	id: ResourceLocation.Validate<ID>
} & Omit<PanelOptions, 'component'> &
	Omit<ComponentMountOptions<C>, 'outro'>

// FIXME - Needs to handle unmounting when the plugin is disabled
export class SveltePanel<ID extends string, C extends GenericComponent> extends Panel {
	instance?: ReturnType<typeof mount> | undefined

	constructor(options: SveltePanelOptions<ID, C>) {
		const mountId = `${PACKAGE.name}-svelte-panel-` + guid()

		super(options.id, {
			...options,
			component: {
				name: options.id,
				template: `<div id="${mountId}"></div>`,
			},
		})

		void pollUntilResult(
			() => {
				return document.querySelector(`#${mountId}`)
			},
			// FIXME - this will never stop polling if the panel is never added to the DOM
			() => true
		).then(el => {
			this.instance = mount(options.component, {
				target: el!,
				props: options.props,
				intro: options.intro,
				context: options.context,
			})
		})
	}
}
