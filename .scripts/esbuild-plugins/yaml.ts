import ESBuild from 'esbuild'
import { readFile } from 'fs-extra'
import { load, type LoadOptions } from 'js-yaml'
import { isAbsolute, join } from 'path'

const yamlPlugin: (opts: {
	loadOptions?: LoadOptions
	transform?: (data: any, filePath: string) => any
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
			const transformed = options?.transform?.(parsed, args.path)
			if (transformed !== void 0) parsed = transformed
			return {
				contents: JSON.stringify(parsed),
				loader: 'json',
				watchFiles: [args.path],
			}
		})
	},
})

export default yamlPlugin
