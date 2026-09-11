import preset from '@snavesutit/jestbench/jest-preset.js'

/** @type {import('jest').Config} */
export default {
	...preset,
	rootDir: '.',
	// The preset does not transform TypeScript; compile test files with SWC.
	transform: {
		'^.+\\.ts$': ['@swc/jest', { jsc: { target: 'es2022' } }],
	},
	// Preset wires jestbench's setup; add our per-test clean-slate hook after it.
	setupFilesAfterEnv: [...(preset.setupFilesAfterEnv ?? []), '<rootDir>/test/hooks.ts'],
	// All specs share one Blockbench instance (preset sets maxWorkers: 1). They
	// are written to run in a stable order - keep Jest from shuffling them.
	randomize: false,
}
