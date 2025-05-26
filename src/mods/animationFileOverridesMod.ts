import { UTILITY_MODEL_FORMAT } from '../formats/utilityProject'
import { PACKAGE } from '../package'
import { createBlockbenchMod } from '../util/moddingTools'
import { translate } from '../util/translation'

createBlockbenchMod(
	`${PACKAGE.name}:animationFileOverrides`,
	{
		exportAnimationFile: Animator.exportAnimationFile,
		animationFolderMenu: Blockbench.Animation.prototype.file_menu,
		// loadAnimationFile: Animator.loadFile,
	},
	context => {
		Animator.exportAnimationFile = function (path: string) {
			if (UTILITY_MODEL_FORMAT.isCurrentFormat()) {
				for (const anim of Blockbench.Animation.all) {
					if (anim.name.startsWith('utility.')) {
						anim.path = `utility`
					} else {
						const match = /^(.+?)\.(.+)/.exec(anim.name)
						anim.path = match ? match[1] : 'custom'
					}
					anim.saved = true
				}
				return
			}
			return context.exportAnimationFile(path)
		}

		// Animator.loadFile = function (file: any, animation_filter?: string[]) {
		// 	//
		// }

		Blockbench.Animation.prototype.file_menu = new Menu([
			{
				name: translate('action.delete_animation_folder.label'),
				icon: 'delete',
				click(folderName: string) {
					const includedAnimations = Animator.animations.filter(anim => {
						return anim.path === folderName
					})
					Undo.initEdit({ animations: includedAnimations })
					for (const anim of includedAnimations) {
						anim.remove(false, false)
					}
					Undo.finishEdit('Remove Animation Folder', {
						animations: Animator.animations,
					})
				},
			},
		])

		return context
	},
	context => {
		Animator.exportAnimationFile = context.exportAnimationFile
		Blockbench.Animation.prototype.file_menu = context.animationFolderMenu
	}
)
