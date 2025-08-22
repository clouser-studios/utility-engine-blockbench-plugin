import { createBlockbenchMod } from '@blockbench-tools'
import { PACKAGE } from '@package'

declare global {
	interface ModelFormat {
		isCurrentFormat(): boolean
	}
}

createBlockbenchMod(
	`${PACKAGE.name}:model_format.is_current_format`,
	undefined,
	() => {
		ModelFormat.prototype.isCurrentFormat = function (this) {
			return Project?.format?.id === this.id
		}
	},
	() => {
		// @ts-expect-error
		ModelFormat.prototype.isCurrentFormat = undefined
	}
)
