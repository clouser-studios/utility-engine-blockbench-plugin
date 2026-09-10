import { beforeEach } from '@jest/globals'
import { blockbench } from '@snavesutit/jestbench'

/**
 * jestbench shares one Blockbench instance across the whole run and cleans up
 * *after* each test. That leaves a window where a stale project (and, after a
 * patch-manager re-apply, a stale format instance) is still active when the next
 * test starts, which makes `newProject` abort and the format-identity checks
 * fail intermittently. Force a clean slate before every test instead.
 */
beforeEach(async () => {
	await blockbench.evaluate(() => {
		const g = globalThis as unknown as {
			Dialog?: { open?: { cancel?: () => void } }
			ModelProject?: { all?: Array<{ close?: (discard: boolean) => void }> }
		}
		g.Dialog?.open?.cancel?.()
		for (const project of [...(g.ModelProject?.all ?? [])]) {
			try {
				project.close?.(true)
			} catch {
				/* best effort */
			}
		}
	})
	await blockbench.waitFor('!Project && ModelProject.all.length === 0')
})
