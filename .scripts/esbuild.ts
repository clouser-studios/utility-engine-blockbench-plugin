if (process.argv.includes('--mode=dev')) {
	process.env.NODE_ENV = 'development'
} else {
	process.env.NODE_ENV = 'production'
}

process.env.FLAVOR ??= `local`

import ESBuild from 'esbuild'
import ImportGlobPlugin from 'esbuild-plugin-import-glob'
import InlineImage from 'esbuild-plugin-inline-image'
import * as fs from 'fs'
import ProblemsPatchPlugin from 'node-modules-vscode-problems-patch'
import {
	createBlockbenchSvelteConfig,
	esbuildPluginSvelte,
} from 'svelte-patching-tools/esbuildPlugin'
import PACKAGE from '../package.json'
import ImportFolderPlugin from './esbuild-plugins/importFolder.ts'
import LangPlugin from './esbuild-plugins/lang.ts'
import PackagePlugin from './esbuild-plugins/package.ts'
import YamlPlugin from './esbuild-plugins/yaml.ts'

try {
	const hooks = fs.readdirSync('./.githooks/')
	for (const hook of hooks) {
		fs.copyFileSync(`./.githooks/${hook}`, `./.git/hooks/${hook}`)
	}
} catch (error) {
	console.error('Failed to copy git hooks:')
	console.error(error)
}

const INFO_PLUGIN: ESBuild.Plugin = {
	name: 'infoPlugin',
	setup(build) {
		let start = Date.now()
		build.onStart(() => {
			console.log('\u{1F528} Building...')
			start = Date.now()
		})

		build.onEnd(result => {
			const end = Date.now()
			const diff = end - start
			console.log(
				`\u{2705} Build completed in ${diff}ms with ${result.warnings.length} warning${
					result.warnings.length == 1 ? '' : 's'
				} and ${result.errors.length} error${result.errors.length == 1 ? '' : 's'}.`
			)
		})
	},
}

function createBanner() {
	const license = fs.readFileSync('./LICENSE').toString()
	let lines: string[] = [
		`${PACKAGE.title} v${PACKAGE.version}`,
		PACKAGE.description,
		``,
		`[ AUTHOR ]`,
		`${PACKAGE.author.name}`,
		`(${PACKAGE.author.email}) [${PACKAGE.author.url}]`,
		``,
		`[ SOURCE ]`,
		`${PACKAGE.repository.url}`,
		``,
		`[ LICENSE ]`,
		...license.split('\n').map(v => v.trim()),
	]

	const maxLength = Math.max(...lines.map(line => line.length))
	const leftBuffer = Math.floor(maxLength / 2)
	const rightBuffer = Math.ceil(maxLength / 2)

	const header = '╭' + `─`.repeat(maxLength + 2) + '╮'
	const footer = '╰' + `─`.repeat(maxLength + 2) + '╯'

	lines = lines.map(v => {
		const div = v.length / 2
		const l = Math.ceil(leftBuffer - div)
		const r = Math.floor(rightBuffer - div)
		return '│ ' + ' '.repeat(l) + v + ' '.repeat(r) + ' │'
	})

	const banner = '\n' + [header, ...lines, footer].map(v => `//?? ${v}`).join('\n') + '\n'

	return {
		js: banner,
	}
}

const DEFINES: Record<string, string> = {}

Object.entries(process.env).forEach(([key, value]) => {
	if (/[^A-Za-z0-9_]/i.exec(key)) return
	DEFINES[`process.env.${key}`] = JSON.stringify(value)
})

import VSCODE_SETTINGS from '../.vscode/settings.json'
const IGNORED_SVELTE_WARNINGS = Object.keys(
	VSCODE_SETTINGS['svelte.plugin.svelte.compilerWarnings']
)

const COMMON_CONFIG: ESBuild.BuildOptions = {
	entryPoints: ['./src/index.ts'],
	outfile: `./dist/${PACKAGE.name}.js`,
	bundle: true,
	platform: 'browser',
	loader: { '.svg': 'dataurl', '.ttf': 'binary' },
	plugins: [
		ProblemsPatchPlugin(),
		LangPlugin({ languageFolder: './src/lang' }),
		InlineImage({
			limit: -1,
		}),
		ImportFolderPlugin,
		ImportGlobPlugin(),
		INFO_PLUGIN,
		esbuildPluginSvelte(
			createBlockbenchSvelteConfig(PACKAGE.name, {
				compilerOptions: {
					warningFilter(warning) {
						return !IGNORED_SVELTE_WARNINGS.includes(warning.code)
					},
				},
			})
		),
		YamlPlugin({}),
		PackagePlugin(),
	],
	banner: createBanner(),
	format: 'iife',
	define: DEFINES,
}

async function buildDev() {
	const ctx = await ESBuild.context({
		...COMMON_CONFIG,
		minify: false,
		platform: 'browser',
		sourcemap: 'inline',
	})
	await ctx.watch()
}

function buildProd() {
	ESBuild.build({
		...COMMON_CONFIG,
		// Disabling this will reduce file size, but make bugs much harder to track down.
		keepNames: true,
		minify: true,
		drop: ['debugger'],
	}).catch(() => process.exit(1))
}

async function main() {
	if (process.env.NODE_ENV === 'development') {
		await buildDev()
		return
	}
	buildProd()
}

void main()
