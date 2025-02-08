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
import { readFile } from 'fs-extra'
import { load } from 'js-yaml'
import ProblemsPatchPlugin from 'node-modules-vscode-problems-patch'
import { isAbsolute, join } from 'path'
import { TextDecoder } from 'util'
import SvelteConfig from '../svelte.config.js'
import PackagerPlugin from './plugins/packagePlugin'
import SveltePlugin from './plugins/sveltePlugin'

try {
	const hooks = fs.readdirSync('./.githooks/')
	for (const hook of hooks) {
		fs.copyFileSync(`./.githooks/${hook}`, `./.git/hooks/${hook}`)
	}
} catch (error) {
	console.error('Failed to copy git hooks:')
	console.error(error)
}

const PACKAGE = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))

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
		`v${PACKAGE.version as string}`,
		``,
		PACKAGE.description,
		``,
		`Created by ${PACKAGE.author.name as string}`,
		`(${PACKAGE.author.email as string}) [${PACKAGE.author.url as string}]`,
		``,
		`[ SOURCE ]`,
		`${PACKAGE.repository.url as string}`,
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

const yamlPlugin: (opts: {
	loadOptions?: jsyaml.LoadOptions
	transform?: any
}) => ESBuild.Plugin = options => ({
	name: 'yaml',
	setup(build) {
		build.onResolve({ filter: /\.(yml|yaml)$/ }, args => {
			if (args.resolveDir === '') return
			return {
				path: isAbsolute(args.path) ? args.path : join(args.resolveDir, args.path),
				namespace: 'yaml',
			}
		})
		build.onLoad({ filter: /.*/, namespace: 'yaml' }, async args => {
			const yamlContent = await readFile(args.path)
			let parsed = load(new TextDecoder().decode(yamlContent), options?.loadOptions)
			if (options?.transform && options.transform(parsed, args.path) !== void 0)
				parsed = options.transform(parsed, args.path)
			return {
				contents: JSON.stringify(parsed),
				loader: 'json',
				watchFiles: [args.path],
			}
		})
	},
})

async function buildDev() {
	const ctx = await ESBuild.context({
		banner: createBanner(),
		entryPoints: ['./src/index.ts'],
		outfile: `./dist/${PACKAGE.name as string}.js`,
		bundle: true,
		minify: false,
		platform: 'node',
		sourcemap: 'inline',
		loader: { '.svg': 'dataurl', '.ttf': 'binary' },
		plugins: [
			ProblemsPatchPlugin(),
			InlineImage({
				limit: -1,
			}),
			ImportGlobPlugin(),
			INFO_PLUGIN,
			SveltePlugin(SvelteConfig),
			yamlPlugin({}),
			PackagerPlugin(),
		],
		format: 'iife',
		define: DEFINES,
	})
	await ctx.watch()
}

function buildProd() {
	ESBuild.build({
		entryPoints: ['./src/index.ts'],
		outfile: `./dist/${PACKAGE.name as string}.js`,
		bundle: true,
		minify: true,
		platform: 'node',
		loader: { '.svg': 'dataurl', '.ttf': 'binary' },
		plugins: [
			InlineImage({
				limit: -1,
			}),
			ImportGlobPlugin(),
			INFO_PLUGIN,
			SveltePlugin(SvelteConfig),
			yamlPlugin({}),
			PackagerPlugin(),
		],
		// Disabling this will reduce file size, but make bugs much harder to track down.
		keepNames: true,
		banner: createBanner(),
		drop: ['debugger'],
		format: 'iife',
		define: DEFINES,
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
