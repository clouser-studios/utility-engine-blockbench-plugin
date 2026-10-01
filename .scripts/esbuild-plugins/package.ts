import { type Plugin } from 'esbuild'
import {
	copyFileSync,
	cpSync,
	existsSync,
	readFileSync,
	rmSync,
	unlinkSync,
	writeFileSync,
} from 'fs'
import * as pathjs from 'path'
import { compile } from 'svelte/compiler'
import PACKAGE from '../../package.json'
// @ts-expect-error
import * as svelteServer from 'svelte/internal/server'

const SRC = './src/'
const SRC_PACKAGE = pathjs.join(SRC, 'plugin-package/')
const SRC_ABOUT = pathjs.join(SRC_PACKAGE, 'about.svelte')
const SRC_ICON = pathjs.join(SRC, 'assets/icons/icon-96x.png')

const DIST = './dist/'
const DIST_PACKAGE = pathjs.join(DIST, 'package/')
const DIST_README = pathjs.join(DIST_PACKAGE, 'about.md')

function plugin(): Plugin {
	return {
		name: 'packagerPlugin',
		setup(build) {
			build.onEnd(async () => {
				await new Promise(r => setTimeout(r, 1000)) // Wait for file writes to finish
				const startTime = Date.now()

				const packageJSON: typeof PACKAGE = JSON.parse(
					readFileSync('./package.json', 'utf-8')
				)
				rmSync(DIST_PACKAGE, { recursive: true, force: true })
				cpSync(SRC_PACKAGE, DIST_PACKAGE, { recursive: true })
				const pluginBuildPath = `./dist/${packageJSON.name}.js`
				if (!existsSync(pluginBuildPath)) {
					console.error('❌ Plugin build not found while packaging!')
					return
				}
				copyFileSync(pluginBuildPath, pathjs.join(DIST_PACKAGE, packageJSON.name + '.js'))
				copyFileSync(SRC_ICON, pathjs.join(DIST_PACKAGE, packageJSON.icon))
				const svelteResult = compile(readFileSync(SRC_ABOUT, 'utf-8'), {
					generate: 'server',
					cssHash({ hash, css }) {
						return `utility-engine-about-page-${hash(css)}`
					},
				})
				const component = new Function(
					'svelteServer',
					svelteResult.js.code
						.replace(
							"import * as $ from 'svelte/internal/server';",
							'const $ = svelteServer;'
						)
						.replace('export default', 'return')
				)(svelteServer)
				const result = svelteServer.render(component)
				const style = svelteResult.css ? `\n<style>${svelteResult.css.code}</style>` : ''
				// One line: Blockbench parses about.md as Markdown, which splits multi-line HTML into paragraphs.
				const html = result.html.replace(/\s*\n\s*/g, ' ') + style
				writeFileSync(DIST_README, html)
				if (existsSync(pathjs.join(DIST_PACKAGE, 'about.svelte')))
					unlinkSync(pathjs.join(DIST_PACKAGE, 'about.svelte'))

				console.log(`📦 Package completed in ${Date.now() - startTime}ms`)
			})
		},
	}
}

export default plugin
