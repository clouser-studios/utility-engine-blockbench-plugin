/// <reference path="/var/mnt/ssd2/repos/snavesutit/blockbench/types/index.d.ts"/>
//// <reference types="blockbench-types"/>

declare module '*.png' {
	const value: string
	export default value
}

declare module '*.svg' {
	const value: string
	export default value
}

/**
 * Import this folder's contents recursively.
 * If a local index is found in a folder, it is imported and the rest of that folder is ignored.
 */
declare module '*//' {
	const value: any
	export default value
}

/**
 * Import this folder's contents, ignoring subdirectories.
 * If a local index is found in a folder, it is imported and the rest of that folder is ignored.
 */
declare module '*/' {
	const value: any
	export default value
}
