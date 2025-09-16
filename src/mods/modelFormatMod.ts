import { createBlockbenchMod } from '@blockbench-tools'

declare global {
	interface ModelFormat {
		isCurrentFormat(): boolean
	}
}

createBlockbenchMod({
	id: `utility-engine:model-format/is-current-format`,
	apply: () => {
		ModelFormat.prototype.isCurrentFormat = function (this) {
			return Project?.format?.id === this.id
		}
	},
	revert: () => {
		// @ts-expect-error
		ModelFormat.prototype.isCurrentFormat = undefined
	},
})
