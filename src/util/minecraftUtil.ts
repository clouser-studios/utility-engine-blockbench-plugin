export type IParsedMinecraftPackPath = {
	/** The root folder of the resource pack */
	packRoot: string
	/** The namespace of the resource (e.g. "minecraft") */
	namespace: string
	/** The absolute path to the namespace folder */
	namespacePath: string
	/** The subtype of the resource (e.g. "block", "item", "function") */
	subtype: string
	/** The path to the resource including the subtype (e.g. "block/stone") */
	subtypedPath: string
	/** The path to the resource, relative to the subtype folder */
	resourcePath: string
} & (
	| { isFile?: false }
	| {
			// These properties are only defined if the resource is a file
			isFile: true
			/** The resource location (e.g. "namespace:path/to/resource") */
			resourceLocation: string
			/** The name of the resource file (without extension) */
			name: string
			/** The file extension (e.g. ".png", ".json") */
			ext: string
	  }
)

/**
 * Parses a Minecraft resource pack path.
 * @param packCategory The category of the pack (data or assets)
 * @param path The path to parse
 * @param expectFile Whether to expect a file at the end of the path.
 *
 * @returns The parsed pack path or undefined if the path is invalid.
 */
export function parsePackPath(
	packCategory: 'data' | 'assets',
	path: string,
	expectFile: true
): (IParsedMinecraftPackPath & { isFile: true }) | undefined
export function parsePackPath(
	packCategory: 'data' | 'assets',
	path: string,
	expectFile?: boolean
): IParsedMinecraftPackPath | undefined {
	path = path.replaceAll(/\\/g, '/')
	const parts = path.split('/')

	const categoryIndex = parts.indexOf(packCategory)
	if (categoryIndex === -1) return undefined

	const result = {} as IParsedMinecraftPackPath

	result.packRoot = parts.slice(0, categoryIndex).join('/')

	if (parts.length < categoryIndex + 3) return undefined
	result.namespace = parts[categoryIndex + 1]
	result.namespacePath = parts.slice(0, categoryIndex + 2).join('/')

	result.subtype = parts[categoryIndex + 2]
	result.resourcePath = parts.slice(categoryIndex + 3).join('/')
	result.subtypedPath = `${result.subtype}/${result.resourcePath}`

	const fileName = parts.at(-1)
	// Using the not operator here instead of an undefined check
	// allows paths ending with `/` to be treated as fileless.
	if (!fileName) {
		if (expectFile) {
			return undefined
		} else {
			return result
		}
	}
	result.isFile = true
	if (result.isFile) {
		const extensionlessResourcePath = result.resourcePath.replace(/\.[^/.]+$/, '')
		result.resourceLocation = `${result.namespace}:${extensionlessResourcePath}`
		result.name = fileName.split('.').slice(0, -1).join('.') || ''
		result.ext = fileName.split('.').pop() || ''
	}

	return result
}
