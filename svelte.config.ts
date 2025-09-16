import { resolve } from 'path'
import { sveltePreprocess } from 'svelte-preprocess'
import { typescript } from 'svelte-preprocess-esbuild'
import type { ISvelteESBuildPluginOptions } from './.scripts/esbuild-plugins/svelte'
import VSCODE_SETTINGS from './.vscode/settings.json'

export const preprocess = [
	typescript({
		target: 'es2022',
		define: {
			'process.browser': 'true',
		},
	}),
	sveltePreprocess({
		typescript: false,
		sourceMap: process.env.NODE_ENV === 'development',
	}),
]

const IMPORT_PATH = resolve(__dirname, '../src/util/', 'events.ts')

export const transformCssToJs = (css: string) => `import SVELTE_EVENTS from ${JSON.stringify(
	IMPORT_PATH
)};
(() => {
	const $deletable = Blockbench.addCSS(${JSON.stringify(css)});
	function DELETE_SVELTE_CSS() { $deletable?.delete() }
	SVELTE_EVENTS.UNLOAD.subscribe(DELETE_SVELTE_CSS, true);
	SVELTE_EVENTS.UNINSTALL.subscribe(DELETE_SVELTE_CSS, true);
})()`

const IGNORED_WARNINGS = Object.keys(VSCODE_SETTINGS['svelte.plugin.svelte.compilerWarnings'])

export default {
	preprocess,
	transformCssToJs,
	compilerOptions: {
		dev: process.env.NODE_ENV === 'development',
		runes: true,
		warningFilter(warning) {
			return !IGNORED_WARNINGS.includes(warning.code)
		},
	},
} satisfies ISvelteESBuildPluginOptions
