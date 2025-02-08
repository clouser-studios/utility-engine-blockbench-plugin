import SvelteEslint from 'eslint-plugin-svelte'
import SvelteParser from 'svelte-eslint-parser'
import TypeScriptESLint, { type ConfigWithExtends } from 'typescript-eslint'
import SvelteConfig from './svelte.config'
import type { NamingConventionRule } from './tools/tslint-naming-convention-rule'

console.log('Loading ESLint config')

const IGNORE_PATTERNS = [
	'.DS_Store',
	'.env',
	'.env.*',
	'.github',
	// On CI our PNPM store is local to the application source
	'.pnpm-store/**/*',
	'.svelte-kit/**/*',
	'.vscode',
	'node_modules/**/*',
	'build/**/*',
	'package/**/*',

	// Ignore files for PNPM, NPM and YARN
	'pnpm-lock.yaml',
	'package-lock.json',
	'yarn.lock',

	// i18n dictionaries and auto-generated data
	'src/lib/paraglide/**/*',

	// Blockbench Plugin Template
	'dist/**',
	'src/util/bufferGeometryUtils.ts',
]

const CUSTOM_RULES: ConfigWithExtends['rules'] = {
	// ESLint
	semi: ['error', 'never'],
	'prefer-const': 'warn',
	'no-fallthrough': 'off',
	'no-mixed-spaces-and-tabs': 'warn',
	'no-unreachable': 'warn',
	'no-unused-vars': [
		'warn',
		{
			vars: 'global',
			args: 'after-used',
			ignoreRestSiblings: true,
		},
	],
	// Svelte
	'svelte/html-quotes': ['warn', { prefer: 'double' }],
	'svelte/block-lang': ['error', { script: ['ts', null], style: null }],
	'svelte/comment-directive': ['error', { reportUnusedDisableDirectives: true }],
	// TypeScript
	'@typescript-eslint/no-explicit-any': 'off',
	'@typescript-eslint/no-floating-promises': ['error', { ignoreVoid: true }],
	'@typescript-eslint/array-type': ['warn', { default: 'array-simple' }],
	'@typescript-eslint/consistent-indexed-object-style': ['warn', 'record'],
	'@typescript-eslint/consistent-generic-constructors': 'warn',
	'@typescript-eslint/no-namespace': 'off',
	'@typescript-eslint/restrict-template-expressions': 'off',
	'@typescript-eslint/no-unsafe-member-access': 'off',
	'@typescript-eslint/no-unsafe-assignment': 'off',
	'@typescript-eslint/ban-ts-comment': 'off',
	'@typescript-eslint/require-await': 'warn',
	'@typescript-eslint/no-unsafe-call': 'off',
	'@typescript-eslint/unbound-method': 'off',
	'@typescript-eslint/no-non-null-assertion': 'off',
	'@typescript-eslint/triple-slash-reference': 'off',
	// Naming conventions
	'@typescript-eslint/naming-convention': [
		'warn',
		{
			selector: 'class',
			format: ['PascalCase'],
		},
		{
			selector: ['import'],
			modifiers: ['default'],
			types: ['function'],
			format: ['PascalCase'],
		},
		{
			selector: ['classProperty', 'classMethod'],
			format: ['camelCase'],
		},
		{
			selector: ['classProperty', 'classMethod'],
			filter: {
				regex: '^_.*$',
				match: true,
			},
			prefix: ['_'],
			format: ['camelCase'],
		},
		{
			selector: 'typeProperty',
			format: null,
		},
		{
			selector: 'variable',
			modifiers: ['const', 'destructured'],
			format: null,
		},
		{
			selector: 'variable',
			modifiers: ['const', 'global'],
			format: ['UPPER_CASE'],
		},
		{
			selector: 'variable',
			modifiers: ['const', 'global'],
			filter: {
				regex: '^_.*$',
				match: true,
			},
			prefix: ['_'],
			format: ['UPPER_CASE'],
		},
		{
			selector: 'variable',
			modifiers: ['const', 'global'],
			types: ['function'],
			format: ['camelCase'],
		},
		{
			selector: 'variable',
			modifiers: ['const', 'global', 'exported'],
			types: ['boolean', 'array', 'string', 'boolean', 'number'],
			format: ['camelCase', 'UPPER_CASE'],
		},
		{ selector: 'variableLike', format: ['camelCase'] },
		{ selector: 'interface', format: ['PascalCase'] },
		{
			selector: 'interface',
			modifiers: ['exported'],
			format: ['PascalCase'],
			prefix: ['I'],
		},
		{ selector: 'typeLike', format: ['PascalCase'] },
		{ selector: 'objectLiteralProperty', format: null },
		{ selector: 'default', format: ['camelCase'] },
		{
			selector: 'parameter',
			format: ['camelCase'],
		},
		{
			selector: 'enumMember',
			format: ['UPPER_CASE'],
		},
	] satisfies NamingConventionRule,
}

export default TypeScriptESLint.config(
	...TypeScriptESLint.configs.stylisticTypeChecked,
	...SvelteEslint.configs['flat/prettier'],
	{
		plugins: {
			'@typescript-eslint': TypeScriptESLint.plugin,
			svelte: SvelteEslint,
		},
	},
	{
		languageOptions: {
			parser: TypeScriptESLint.parser,
			parserOptions: {
				project: './tsconfig.json',
				extraFileExtensions: ['.svelte'],
			},
			globals: {
				browser: true,
				node: true,
			},
		},
	},
	{
		files: ['**/*.svelte'],
		rules: {
			// Causes issues with Svelte and global types
			'no-undef': 'off',
		},
		languageOptions: {
			parser: SvelteParser,
			parserOptions: {
				parser: TypeScriptESLint.parser,
				svelteConfig: SvelteConfig,
				extraFileExtensions: ['.svelte'],
			},
			globals: {
				browser: true,
				node: true,
			},
		},
		settings: {
			ignoreWarnings: ['svelte/a11y-no-onchange', 'a11y-no-onchange'],
		},
	},
	{
		ignores: IGNORE_PATTERNS,
		rules: CUSTOM_RULES,
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: __dirname,
			},
		},
		linterOptions: {
			reportUnusedDisableDirectives: true,
		},
	}
)
