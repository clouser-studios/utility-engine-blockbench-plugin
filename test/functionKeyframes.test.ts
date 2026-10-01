import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { action, blockbench, newProject } from '@snavesutit/jestbench'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
	CODEC_ID,
	compileProject,
	FORMAT_ID,
	loadProjectJson,
	settleUtilityFormat,
} from './support'

/**
 * Function keyframes live on a `commands` channel of the Effects animator and of locators, and
 * hold newline-separated commands plus an optional execute condition.
 */

interface FunctionKeyframeSummary {
	animator: string
	time: number
	commands: string
	condition: string
}

/** Builds a Utility project with a locator and an animation holding one function keyframe on
 * the Effects row and one on the locator. */
async function buildFunctionKeyframeProject(): Promise<void> {
	await newProject(FORMAT_ID)
	await settleUtilityFormat()
	await blockbench.evaluate(() => {
		const locator = new Locator({ name: 'muzzle' }).init()
		const animation = new Blockbench.Animation({ name: 'shoot', length: 1 }).add(false)
		const effects = (animation.animators.effects ??= new EffectAnimator(animation))
		effects.addKeyframe({
			channel: 'commands',
			time: 0.5,
			data_points: [
				{
					commands: 'say hi\n\n  particle flame ~ ~ ~ ',
					condition: ' if score @s x matches 1.. ',
				},
			],
		})
		animation.getBoneAnimator(locator).addKeyframe({
			channel: 'commands',
			time: 0.25,
			data_points: [{ commands: 'say boom', condition: '' }],
		})
	})
}

async function functionKeyframes(): Promise<FunctionKeyframeSummary[]> {
	return blockbench.evaluate(() =>
		Blockbench.Animation.all.flatMap(animation =>
			Object.values(animation.animators).flatMap(animator =>
				((animator as unknown as { commands?: _Keyframe[] }).commands ?? []).map(kf => ({
					animator: animator.type,
					time: kf.time,
					commands: kf.data_points[0].commands ?? '',
					condition: kf.data_points[0].condition ?? '',
				}))
			)
		)
	)
}

const BUILT_KEYFRAMES: FunctionKeyframeSummary[] = [
	{
		animator: 'effect',
		time: 0.5,
		commands: 'say hi\n\n  particle flame ~ ~ ~ ',
		condition: ' if score @s x matches 1.. ',
	},
	{ animator: 'locator', time: 0.25, commands: 'say boom', condition: '' },
]

describe('function keyframes', () => {
	it('adds a commands channel to effects and locators in Utility projects only', async () => {
		await newProject(FORMAT_ID)
		await settleUtilityFormat()
		const utility = await blockbench.evaluate(() => ({
			effectsVisible: Condition(EffectAnimator.prototype.channels.commands?.condition),
			locatorChannels: Object.keys(Locator.animator?.prototype.channels ?? {}),
		}))
		expect(utility).toEqual({ effectsVisible: true, locatorChannels: ['commands'] })

		await newProject('java_block')
		const javaBlock = await blockbench.evaluate(() => ({
			effectsVisible: Condition(EffectAnimator.prototype.channels.commands?.condition),
			locatorAnimator: Locator.animator ?? null,
		}))
		expect(javaBlock).toEqual({ effectsVisible: false, locatorAnimator: null })
	})

	it('skips motion trails for a selected locator (regression: threw reading position keyframes)', async () => {
		await buildFunctionKeyframeProject()

		const error = await blockbench.evaluate(() => {
			const motionTrails = settings.motion_trails.value
			settings.motion_trails.value = true
			try {
				Modes.options.animate.select()
				Blockbench.Animation.all[0].select()
				Locator.all[0].select()
				Animator.showMotionTrail()
				return null
			} catch (e) {
				return String(e)
			} finally {
				settings.motion_trails.value = motionTrails
			}
		})

		expect(error).toBeNull()
	})

	it('round-trips through .utilityproject', async () => {
		await buildFunctionKeyframeProject()
		expect(await functionKeyframes()).toEqual(BUILT_KEYFRAMES)

		await loadProjectJson(await compileProject())

		expect(await functionKeyframes()).toEqual(BUILT_KEYFRAMES)
	})

	describe('.utility.json', () => {
		let dir: string
		beforeAll(() => {
			dir = mkdtempSync(join(tmpdir(), 'ue-function-keyframes-'))
		})
		afterAll(() => {
			rmSync(dir, { recursive: true, force: true })
		})

		it('exports effects keyframes as functions and locator keyframes by name', async () => {
			await buildFunctionKeyframeProject()
			const exportPath = join(dir, 'export.utility.json')
			await blockbench.evaluate(path => {
				Project!.export_path = path
			}, exportPath)

			await action('utility_engine:action/export-utility-model').trigger()

			const model = JSON.parse(readFileSync(exportPath, 'utf-8'))
			expect(model.animations[0].functions).toEqual({
				'0.5': {
					commands: ['say hi', 'particle flame ~ ~ ~'],
					condition: 'if score @s x matches 1..',
				},
			})
			expect(model.animations[0].locators).toEqual({
				muzzle: { '0.25': { commands: ['say boom'] } },
			})
		})

		it('imports functions and locator keyframes', async () => {
			const locatorUuid = 'aaaaaaaa-0000-0000-0000-00000000000f'
			const model = {
				format_version: '0.0.3',
				texture_size: [16, 16],
				textures: {},
				elements: [],
				locators: [{ name: 'muzzle', uuid: locatorUuid, position: [0, 0, 0] }],
				structure: { locators: [locatorUuid] },
				animations: [
					{
						name: 'shoot',
						animation_length: 1,
						loop_mode: 'once',
						loop_delay: 0,
						bones: {},
						functions: { '0.5': { commands: ['say hi', 'say there'] } },
						locators: {
							muzzle: {
								'0.25': { commands: ['say boom'], condition: 'if entity @p' },
							},
						},
					},
				],
			}
			await blockbench.evaluate(
				(codecId, json) => {
					Codecs[codecId].load(JSON.parse(json), {
						path: 'fixture.utility.json',
						name: 'fixture.utility.json',
						content: json,
					} as unknown as Parameters<(typeof Codecs)[string]['load']>[1])
				},
				CODEC_ID,
				JSON.stringify(model)
			)

			expect(await functionKeyframes()).toEqual([
				{ animator: 'effect', time: 0.5, commands: 'say hi\nsay there', condition: '' },
				{
					animator: 'locator',
					time: 0.25,
					commands: 'say boom',
					condition: 'if entity @p',
				},
			])
		})
	})

	it('shows the commands editor for a selected function keyframe and writes edits back', async () => {
		await buildFunctionKeyframeProject()

		const panel = await blockbench.evaluate(async () => {
			Modes.options.animate.select()
			const animation = Blockbench.Animation.all[0]
			animation.select()
			const keyframe = (animation.animators.effects as EffectAnimator)
				.commands[0] as _Keyframe
			keyframe.select()
			await new Promise(resolve => setTimeout(resolve, 200))

			const textarea = document.querySelector<HTMLTextAreaElement>(
				'#function_keyframe_commands'
			)
			const shown = textarea?.value
			if (textarea) {
				textarea.value = 'say edited'
				textarea.dispatchEvent(new Event('input', { bubbles: true }))
			}
			return { shown, stored: keyframe.data_points[0].commands }
		})

		expect(panel).toEqual({ shown: 'say hi\n\n  particle flame ~ ~ ~ ', stored: 'say edited' })
	})
})
