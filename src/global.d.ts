/// <reference path="/var/mnt/ssd2/repos/snavesutit/blockbench/types/index.d.ts"/>
//// <reference types="blockbench-types"/>
// Ensure invertMolang is available globally
/// <reference path="/var/mnt/ssd2/repos/snavesutit/blockbench/types/generated/util/molang.d.ts"/>

/** Blockbench globals missing from `@blockbench-types`. */
type MenuItem =
	| string
	| Action
	| {
			id?: string
			icon?: IconString | (() => IconString)
			name?: string
			condition?: ConditionResolvable
			click?: (...args: any[]) => void
			children?: MenuItem[] | ((context: any) => MenuItem[])
			[key: string]: any
	  }

type MenuOpenPositionAnchor = Event | HTMLElement | ArrayVector2 | JQuery<HTMLElement>

interface MenuOptions {
	searchable?: boolean
}

declare class Menu implements Deletable {
	id: string
	structure: MenuItem[] | ((context: any) => MenuItem[])
	options?: MenuOptions
	condition?: ConditionResolvable

	constructor(template: MenuItem[] | ((context?: any) => MenuItem[]), options?: MenuOptions)
	constructor(
		id: string,
		template: MenuItem[] | ((context?: any) => MenuItem[]),
		options?: MenuOptions
	)

	open(position?: MenuOpenPositionAnchor, context?: any): this
	show(position?: MenuOpenPositionAnchor, context?: any): this
	hide(): this
	addAction(action: Action | MenuItem | '_', path?: string | number): void
	removeAction(path: string | Action): void
	delete(): void
}

declare class MenuSeparator {
	constructor(id?: string)
}

declare class Preview {
	static all: Preview[]
	canvas: HTMLCanvasElement
	loadBackground(): void
}

interface RecentProjectData {
	name: string
	path: string
	icon: string
	day: number
	favorite: boolean
	textures?: string[]
	animation_files?: string[]
}

declare function addRecentProject(data: Partial<RecentProjectData>): void
declare function updateRecentProjectThumbnail(): Promise<void>

/**
 * `BoundingBox` (`js/outliner/types/bounding_box.ts`) isn't exposed by `@blockbench-types`
 * at all yet, unlike its sibling outliner types (`Locator`, `Billboard`, `Armature`,
 * `ArmatureBone`), which are all generated.
 */
type BoundingBoxFunction = 'collision' | 'hitbox'

interface BoundingBoxOptions {
	name?: string
	from?: ArrayVector3
	to?: ArrayVector3
	size?: ArrayVector3
	visibility?: boolean
	color?: number
	function?: BoundingBoxFunction[]
}

declare class BoundingBox extends OutlinerElement {
	visibility: boolean
	color: number
	function: BoundingBoxFunction[]
	from: ArrayVector3
	to: ArrayVector3

	constructor(data?: BoundingBoxOptions, uuid?: string)
	extend(object: BoundingBoxOptions): this

	static all: BoundingBox[]
	static selected: BoundingBox[]
}

/**
 * Remove these when blockbench-types updates to add them.
 */
interface CodecLoadOptions {
	import_to_current_project?: boolean
	externalDataLoader?: (path: string) => any
	[key: string]: unknown
}

interface CodecOptions {
	name?: string
	load?(model: any, file: Filesystem.FileResult, args?: CodecLoadOptions): void
	compile?(options?: any): string | ArrayBuffer | any
	parse?(data: any, path: string, args?: CodecLoadOptions): void
	export?(): void
	fileName?(): string
	startPath?(): string
	write?(content: any, path: string): void
	overwrite?(content: any, path: string, callback: (path: any) => void): void
	afterDownload?(path: any): void
	afterSave?(path: any): void
	exportCollection?(collection: Collection): void
	writeCollection?(collection: Collection): void
	dispatchEvent?(event_name: string, data: any): void
	extension?: string
	remember?: boolean
	multiple_per_file?: boolean
	support_partial_export?: boolean
	support_offset?: boolean
	load_filter?: {
		extensions: string[] | (() => string[])
		type: 'json' | 'text' | 'image'
		condition?: ConditionResolvable
	}
	export_options?: Record<string, any>
	export_action?: Action
	format?: ModelFormat
	plugin?: string
}

declare class Codec extends EventSystem {
	constructor(id: string, data?: CodecOptions)
	static getAllExtensions(): string[]
}

// Instance members are merged in separately so the rest of the file's snake_case
// Blockbench API surface isn't flagged as non-camelCase class properties.
interface Codec {
	id: string
	name: string
	extension: string
	remember: boolean
	multiple_per_file?: boolean
	support_partial_export: boolean
	support_offset: boolean
	load_filter?: CodecOptions['load_filter']
	export_action?: Action
	export_options: Record<string, any>
	format?: ModelFormat
	plugin?: string
	context: any

	load(model: any, file?: Filesystem.FileResult, args?: CodecLoadOptions): boolean | void
	parse?(data: any, path: string, args?: CodecLoadOptions): void
	compile(options?: any): any
	export(): void
	write(content: any, path: string): void
	overwrite?(content: any, path: string, callback: (path: string) => void): void
	fileName(): string
	startPath(): string
	afterDownload(path: string): void
	afterSave(path: string): void
	getExportOptions(): Record<string, any>
	dispatchEvent(eventName: string, data?: any): void
	delete(): void

	[key: string]: any
}

// eslint-disable-next-line @typescript-eslint/naming-convention
declare const Codecs: Record<string, Codec>

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
