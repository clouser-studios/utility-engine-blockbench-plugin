import { pollUntilResult } from '@utility/util/promises'
import { mount, unmount, type Component } from 'svelte'
import type { ComponentMountOptions } from './helperTypes'

interface InjectSvelteComponentOptions<C extends Component<any, any>, E extends HTMLElement>
	extends ComponentMountOptions<C> {
	/**
	 * A function that returns the element to inject the component into.
	 *
	 * This function will be polled until it returns a non-nullish value.
	 * @returns The element to inject the component into
	 */
	elementSelector: () => E | undefined | null
	/**
	 * A function to call after the component has been mounted
	 * @param component The mounted svelte component
	 */
	postMount?: (component: ReturnType<typeof mount>, target: E) => void
	/**
	 * Whether to prepend the component to the element's children.
	 *
	 * Overrides `injectIndex` if true.
	 */
	prepend?: boolean
	/**
	 * The index to inject the component at in the element's children.
	 */
	injectIndex?: number
}

/**
 * Attempts to mount a Svelte component into an element specified by `elementSelector`.
 *
 * The `elementSelector` function will be polled until it returns a non-null value, at which point the component will be mounted.
 *
 * @returns A function that cancels the mounting if it hasn't been mounted yet, or unmounts the component if it has been mounted.
 */
export function injectComponent<C extends Component<any, any>, E extends HTMLElement>(
	options: InjectSvelteComponentOptions<C, E>
): () => Promise<void> {
	let cancelled = false
	let mountResult: ReturnType<typeof mount> | undefined
	let anchor: Comment | undefined

	const mountedPromise = new Promise<void>(async resolve => {
		const target = await pollUntilResult(options.elementSelector, () => cancelled)
		anchor = document.createComment(`injected-svelte-component-` + guid())

		if (options.prepend) {
			target.insertBefore(anchor, target.firstChild)
		} else if (options.injectIndex !== undefined) {
			target.insertBefore(anchor, target.children[options.injectIndex] || null)
		} else {
			target.appendChild(anchor)
		}

		mountResult = mount(options.component, {
			target,
			anchor,
			props: options.props,
			intro: options.intro,
			context: options.context,
		})

		if (options.postMount) options.postMount(mountResult!, target)

		resolve()
	}).catch(e => {
		if (!cancelled) throw e
	})

	return async () => {
		// Cancel the promise if the component is unmounted before it could be injected.
		cancelled = true
		await mountedPromise
		if (mountResult) await unmount(mountResult, { outro: options.outro })
		anchor?.remove()
	}
}
