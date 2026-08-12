/// <reference path="/var/mnt/ssd2/repos/snavesutit/blockbench/types/index.d.ts"/>
//// <reference types="blockbench-types"/>
/**
 * `@blockbench-types/generated/main.d.ts` never imports `./util/molang`, so its
 * `declare global { const invertMolang }` augmentation is otherwise never picked up.
 */
/// <reference path="/var/mnt/ssd2/repos/snavesutit/blockbench/types/generated/util/molang.d.ts"/>

/**
 * The following are real Blockbench globals that are missing from `@blockbench-types`,
 * either because their source file was converted to a real TS module without a matching
 * `.d.ts` being generated (`Menu`, `MenuSeparator`, `Preview`), or because the generated
 * `.d.ts` for them was never wired into `main.d.ts` (`addRecentProject`,
 * `updateRecentProjectThumbnail`). See `src/util/blockbenchCompat.ts` for the other class
 * of gap: real globals whose *existing* ambient type is incomplete.
 */
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
