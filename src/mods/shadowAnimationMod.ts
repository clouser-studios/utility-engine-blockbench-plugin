class ShadowAnimation extends Blockbench.Animation {
	constructor(data: AnimationOptions) {
		super(data)
		if (!data?.name) {
			this.name = 'custom'
		}
	}
}

// @ts-ignore
// eslint-disable-next-line no-global-assign
Animation = ShadowAnimation
// @ts-ignore
Blockbench.Animation = ShadowAnimation
