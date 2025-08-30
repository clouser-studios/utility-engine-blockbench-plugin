import { createBlockbenchMod, createPropertySubscribable } from '@blockbench-tools'
import { PACKAGE } from '@package'
import { UTILITY_MODEL_PROJECT_FORMAT } from '@utility/formats/utility-model-project'
import { translate } from '@utility/util/translation'

declare global {
	interface Cube {
		enableBackfaceCulling?: boolean
	}
	interface Mesh {
		enableBackfaceCulling?: boolean
	}
}

createBlockbenchMod(
	`${PACKAGE.name}:cube_material_renderside`,
	{
		cubeInit: Cube.prototype.init,
		openCubeMenu: Cube.prototype.menu!.open,
		meshInit: Mesh.prototype.init,
		openMeshMenu: Mesh.prototype.menu!.open,
	},
	ctx => {
		Cube.prototype.init = function (this: Cube, ...args) {
			console.log('Cube init called with args:', args)
			const result = ctx.cubeInit.apply(this, args)

			const scope = this
			const [, set] = createPropertySubscribable<THREE.ShaderMaterial>(this.mesh, 'material')
			set.subscribe(value => {
				console.log('Material set:', value.newValue)
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
			console.log('Cube menu open called with args:', args)
			const result = ctx.openCubeMenu.apply(this, args)
			if (!UTILITY_MODEL_PROJECT_FORMAT.isCurrentFormat()) {
				return result
			}
			const cube = Cube.selected.at(0)
			if (!cube) return result

			console.log('test', cube.enableBackfaceCulling)

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
			console.log('Mesh init called with args:', args)
			const result = ctx.meshInit.apply(this, args)

			const scope = this
			const [, set] = createPropertySubscribable<THREE.ShaderMaterial>(this.mesh, 'material')
			set.subscribe(value => {
				console.log('Material set:', value.newValue)
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
			console.log('Mesh menu open called with args:', args)
			const result = ctx.openMeshMenu.apply(this, args)
			if (!UTILITY_MODEL_PROJECT_FORMAT.isCurrentFormat()) {
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

		return ctx
	},
	ctx => {
		Cube.prototype.init = ctx.cubeInit
	}
)

const USE_DEFAULT_BACKFACE_CULLING = new Toggle('utility_engine_use_default_backface_culling', {
	name: translate('model_format.utility_model.element_settings.use_default_backface_culling'),
	onChange: (value: boolean) => {
		console.log('Toggling default backface culling mode:', value)
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
	condition: () => {
		return UTILITY_MODEL_PROJECT_FORMAT.isCurrentFormat()
	},
})

const BACKFACE_CULLING_TOGGLE = new Toggle('utility_engine_backface_culling_toggle', {
	name: translate('model_format.utility_model.element_settings.backface_culling'),
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
	condition: () => {
		return UTILITY_MODEL_PROJECT_FORMAT.isCurrentFormat()
	},
})

Cube.prototype.menu!.addAction(BACKFACE_CULLING_TOGGLE, 7)
Cube.prototype.menu!.addAction(USE_DEFAULT_BACKFACE_CULLING, 7)
Mesh.prototype.menu!.addAction(BACKFACE_CULLING_TOGGLE, 7)
Mesh.prototype.menu!.addAction(USE_DEFAULT_BACKFACE_CULLING, 7)
