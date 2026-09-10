import { currentFormatIsUtilityModelProject } from '@utility/formats/utility-model-project/index.ts'
import { localize } from '@utility/util/lang.ts'
import { overrideAccessors, registerPatch } from 'blockbench-patch-manager'

declare global {
	interface Cube {
		enableBackfaceCulling?: boolean
	}
	interface Mesh {
		enableBackfaceCulling?: boolean
	}
}

const USE_DEFAULT_BACKFACE_CULLING = new Toggle('utility-engine:use-default-backface-culling', {
	name: localize('model_format.utility_model.element_settings.use_default_backface_culling'),
	icon: 'settings_backup_restore',
	onChange: (value: boolean) => {
		if (value) {
			for (const cube of Cube.selected) {
				cube.enableBackfaceCulling = undefined
			}
			for (const mesh of Mesh.selected) {
				mesh.enableBackfaceCulling = undefined
			}
		}
		Canvas.updateAll()
	},
	condition: () => currentFormatIsUtilityModelProject(),
})

const BACKFACE_CULLING_TOGGLE = new Toggle('utility-engine:backface-culling-toggle', {
	name: localize('model_format.utility_model.element_settings.backface_culling'),
	icon: 'texture',
	onChange: (value: boolean) => {
		console.log('Toggling backface culling for selected cubes & meshes', value)
		if (Cube.selected.length !== 0) {
			for (const cube of Cube.selected) {
				cube.enableBackfaceCulling = value
			}
		}
		if (Mesh.selected.length !== 0) {
			for (const mesh of Mesh.selected) {
				mesh.enableBackfaceCulling = value
			}
		}
		Canvas.updateAll()
	},
	condition: () => currentFormatIsUtilityModelProject(),
})

function updateBackfaceCulling(material: THREE.Material, enableBackfaceCulling?: boolean) {
	if (enableBackfaceCulling === true) {
		material.side = THREE.FrontSide
	} else if (enableBackfaceCulling === false) {
		material.side = THREE.DoubleSide
	} else if (Project!.default_backface_culling_mode === 'cull_backfaces') {
		material.side = THREE.FrontSide
	} else {
		material.side = THREE.DoubleSide
	}
}

registerPatch({
	id: `utility-engine:cube/material-renderside`,
	apply: () => {
		const cubeInit = Cube.prototype.init
		const openCubeMenu = Cube.prototype.menu!.open
		const meshInit = Mesh.prototype.init
		const openMeshMenu = Mesh.prototype.menu!.open

		Cube.prototype.init = function (this: Cube, ...args) {
			const result = cubeInit.apply(this, args)

			overrideAccessors({
				target: this.mesh,
				key: 'material',
				get: value => {
					updateBackfaceCulling(value as THREE.Material, this.enableBackfaceCulling)
					return value
				},
			})

			return result
		}

		Cube.prototype.menu!.open = function (this: Cube, ...args) {
			const result = openCubeMenu.apply(this, args)
			if (!currentFormatIsUtilityModelProject()) {
				return result
			}
			const cube = Cube.selected.at(0)
			if (!cube) return result

			if (cube.enableBackfaceCulling === undefined) {
				USE_DEFAULT_BACKFACE_CULLING.set(true)
				BACKFACE_CULLING_TOGGLE.set(
					Project!.default_backface_culling_mode === 'cull_backfaces'
				)
			} else {
				USE_DEFAULT_BACKFACE_CULLING.set(false)
				BACKFACE_CULLING_TOGGLE.set(!!cube.enableBackfaceCulling)
			}

			return result
		}

		Mesh.prototype.init = function (this: Mesh & { mesh: THREE.Mesh }, ...args) {
			const result = meshInit.apply(this, args)

			overrideAccessors({
				target: this.mesh,
				key: 'material',
				get: value => {
					updateBackfaceCulling(value as THREE.Material, this.enableBackfaceCulling)
					return value
				},
			})

			return result
		}

		Mesh.prototype.menu!.open = function (this: Mesh, ...args) {
			const result = openMeshMenu.apply(this, args)
			if (!currentFormatIsUtilityModelProject()) {
				return result
			}
			const mesh = Mesh.selected.at(0)
			if (!mesh) return result

			if (mesh.enableBackfaceCulling === undefined) {
				USE_DEFAULT_BACKFACE_CULLING.set(true)
				BACKFACE_CULLING_TOGGLE.set(
					Project!.default_backface_culling_mode === 'cull_backfaces'
				)
			} else {
				USE_DEFAULT_BACKFACE_CULLING.set(false)
				BACKFACE_CULLING_TOGGLE.set(!!mesh.enableBackfaceCulling)
			}

			return result
		}

		Cube.prototype.menu!.addAction(BACKFACE_CULLING_TOGGLE, 7)
		Cube.prototype.menu!.addAction(USE_DEFAULT_BACKFACE_CULLING, 7)
		Mesh.prototype.menu!.addAction(BACKFACE_CULLING_TOGGLE, 7)
		Mesh.prototype.menu!.addAction(USE_DEFAULT_BACKFACE_CULLING, 7)

		return { cubeInit, meshInit, openCubeMenu, openMeshMenu }
	},
	revert: ({ cubeInit, meshInit, openCubeMenu, openMeshMenu }) => {
		Cube.prototype.init = cubeInit
		Mesh.prototype.init = meshInit
		Cube.prototype.menu!.open = openCubeMenu
		Mesh.prototype.menu!.open = openMeshMenu

		Cube.prototype.menu!.removeAction(BACKFACE_CULLING_TOGGLE)
		Cube.prototype.menu!.removeAction(USE_DEFAULT_BACKFACE_CULLING)
		Mesh.prototype.menu!.removeAction(BACKFACE_CULLING_TOGGLE)
		Mesh.prototype.menu!.removeAction(USE_DEFAULT_BACKFACE_CULLING)
	},
})
