class ShadowAnimation extends Blockbench.Animation {
	constructor(data: AnimationOptions) {
		super(data)
		if (!data?.name) {
			this.name = 'custom'
		}
	}

	setLength(len = this.length) {
		this.length = 0
		this.length = limitNumber(len, this.getMaxLength(), 1e4)
		if (Blockbench.Animation.selected == this) {
			// @ts-expect-error
			Timeline.vue._data.animation_length = this.length
			// @ts-expect-error
			BarItems.slider_animation_length.update()
		}
	}
}

// @ts-expect-error
Animation = ShadowAnimation
// @ts-expect-error
Blockbench.Animation = ShadowAnimation
