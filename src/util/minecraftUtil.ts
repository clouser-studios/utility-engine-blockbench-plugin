export interface IMinecraftResourceLocation {
	resourcePackRoot: string
	namespace: string
	resourcePath: string
	resourceLocation: string
	subtypelessPath: string
	fileName: string
	fileExtension: string
	type: string
}

export function parseResourcePackPath(path: string): IMinecraftResourceLocation | undefined {
	path = path.replaceAll(/\\/g, '/')
	const parts = path.split('/')

	const assetsIndex = parts.indexOf('assets')
	if (assetsIndex === -1) return undefined

	const resourcePackRoot = parts.slice(0, assetsIndex).join('/')
	const namespace = parts[assetsIndex + 1]
	const type = parts[assetsIndex + 2]
	const resourcePath = parts.slice(assetsIndex + 3, -1).join('/')
	const fileName = PathModule.basename(path).split('.').slice(0, -1).join('.')
	if (fileName !== fileName.toLowerCase()) return undefined
	const resourceLocation = (namespace + ':' + PathModule.join(resourcePath, fileName)).replaceAll(
		/\\/g,
		'/'
	)
	const subtypelessPath = parts.slice(assetsIndex + 4).join('/')

	return {
		resourcePackRoot,
		namespace,
		resourcePath,
		resourceLocation,
		subtypelessPath,
		fileName,
		fileExtension: PathModule.extname(path),
		type,
	}
}
