import { defineConfig } from '@snavesutit/jestbench'

export default defineConfig({
	// Pin the minimum supported version so runs are reproducible.
	blockbenchVersion: '5.1.6',
	// Isolated envbench environment - never touches a real Blockbench install.
	environment: 'utility-engine-tests',
	// Production bundle. `bun run test` rebuilds it first; the file name must
	// match the id passed to BBPlugin.register() ('utility-engine').
	plugins: ['./dist/utility-engine.js'],
})
