/// <reference path="D:/github-repos/snavesutit/blockbench-types/types/index.d.ts"/>
//// <reference types="blockbench-types"/>

declare module '*.png' {
	const value: string
	export = value
}

/**
 * Import this folder's contents recursively.
 * If a local index is found in a folder, it is imported and the rest of that folder is ignored.
 */
declare module '*//' {
	const value: any
	export = value
}

/**
 * Import this folder's contents, ignoring subdirectories.
 * If a local index is found in a folder, it is imported and the rest of that folder is ignored.
 */
declare module '*/' {
	const value: any
	export = value
}
