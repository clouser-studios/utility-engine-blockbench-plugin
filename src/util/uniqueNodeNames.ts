import { localize } from '@utility/util/lang.ts'
import { log } from '@utility/util/log.ts'

/** Cubes and meshes may share names; every other node's name must be unique across all types. */
export function requiresUniqueName(node: OutlinerNode): boolean {
	return !(node instanceof Cube || node instanceof Mesh)
}

/** Every node that needs a unique name, in outliner order. */
export function uniquelyNamedNodes(): OutlinerNode[] {
	const nodes: OutlinerNode[] = []
	const visit = (children: OutlinerNode[]) => {
		for (const node of children) {
			if (requiresUniqueName(node)) nodes.push(node)
			const nested = (node as { children?: unknown }).children
			if (Array.isArray(nested)) visit(nested as OutlinerNode[])
		}
	}
	visit(Outliner.root)
	return nodes
}

/**
 * Returns `name`, or the first numbered variant that isn't taken, using Blockbench's scheme:
 * strip trailing digits, then count up from 2 (or from 1 if the name ended in 0).
 */
export function nextFreeName(name: string, isTaken: (name: string) => boolean): string {
	if (!isTaken(name)) return name
	const zeroBased = /[^\d]0$/.test(name)
	const base = name.replace(/\d+$/, '').replace(/\s+/g, '_')
	for (let num = zeroBased ? 1 : 2; num < 8e3; num++) {
		if (!isTaken(base + num)) return base + num
	}
	return name
}

/**
 * Renames nodes whose name an earlier node in the outliner already uses, so the first one keeps
 * it. Not recorded in undo history; meant for right after a project loads.
 */
export function dedupeNodeNames() {
	const nodes = uniquelyNamedNodes()
	const taken = new Set(nodes.map(node => node.name.toLowerCase()))
	const seen = new Set<string>()
	const renames: string[] = []

	for (const node of nodes) {
		if (seen.has(node.name.toLowerCase())) {
			const name = nextFreeName(node.name, n => taken.has(n.toLowerCase()))
			renames.push(`${node.name} -> ${name}`)
			node.name = name
			taken.add(name.toLowerCase())
		}
		seen.add(node.name.toLowerCase())
	}

	if (renames.length) {
		log.warn('Renamed duplicate node names:', renames)
		Blockbench.showQuickMessage(
			localize('message.renamed_duplicate_names', String(renames.length)),
			3000
		)
	}
}
