import { createPropertySubscribable, registerMod } from '@blockbench-tools'
import { currentFormatIsUtilityModelProject } from '@utility/formats/utility-model-project/index.ts'
import { localize } from '@utility/util/lang.ts'

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

registerMod({
	id: `utility-engine:cube/material-renderside`,
	apply: () => {
		const cubeInit = Cube.prototype.init
		const openCubeMenu = Cube.prototype.menu!.open
		const meshInit = Mesh.prototype.init
		const openMeshMenu = Mesh.prototype.menu!.open

		Cube.prototype.init = function (this: Cube, ...args) {
			const result = cubeInit.apply(this, args)

			const scope = this
			const [, set] = createPropertySubscribable<THREE.ShaderMaterial>(this.mesh, 'material')
			set.subscribe(value => {
				switch (scope.enableBackfaceCulling) {
					case true:
						value.newValue.side = THREE.FrontSide
						break
					case false:
						value.newValue.side = THREE.DoubleSide
						break
					default:
						switch (Project!.default_backface_culling_mode) {
							case 'cull_backfaces':
								value.newValue.side = THREE.FrontSide
								break
							case 'no_culling':
							default:
								value.newValue.side = THREE.DoubleSide
								break
						}
						break
				}
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

		Mesh.prototype.init = function (this: Mesh, ...args) {
			const result = meshInit.apply(this, args)

			const scope = this
			const [, set] = createPropertySubscribable<THREE.ShaderMaterial>(this.mesh, 'material')
			set.subscribe(value => {
				switch (scope.enableBackfaceCulling) {
					case true:
						value.newValue.side = THREE.FrontSide
						break
					case false:
						value.newValue.side = THREE.DoubleSide
						break
					default:
						switch (Project!.default_backface_culling_mode) {
							case 'cull_backfaces':
								value.newValue.side = THREE.FrontSide
								break
							case 'no_culling':
							default:
								value.newValue.side = THREE.DoubleSide
								break
						}
						break
				}
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

		return { cubeInit, meshInit }
	},
	revert: ({ cubeInit, meshInit }) => {
		Cube.prototype.init = cubeInit
		Mesh.prototype.init = meshInit

		Cube.prototype.menu!.removeAction(BACKFACE_CULLING_TOGGLE)
		Cube.prototype.menu!.removeAction(USE_DEFAULT_BACKFACE_CULLING)
		Mesh.prototype.menu!.removeAction(BACKFACE_CULLING_TOGGLE)
		Mesh.prototype.menu!.removeAction(USE_DEFAULT_BACKFACE_CULLING)
	},
})
