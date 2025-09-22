/**
 * Returns true if v1 is newer than v2
 */
export function compareLongVersions(v1: string, v2: string): boolean {
	const v1Parts = v1.split('.').map(Number)
	const v2Parts = v2.split('.').map(Number)
	for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
		const part1 = v1Parts[i] ?? 0
		const part2 = v2Parts[i] ?? 0
		if (part1 > part2) return true
		if (part1 < part2) return false
	}
	return false
}
