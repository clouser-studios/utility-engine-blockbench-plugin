import Icon from '@assets/icons/nobackground.png'

interface ImgConsoleStyleOptions {
	url: string
	width?: number
	height?: number
}

const IMAGE_CACHE = new Map<string, string>()

async function getImgStyle({ url, width, height }: ImgConsoleStyleOptions) {
	const cacheString = [url, width, height].join('|')
	if (IMAGE_CACHE.has(cacheString)) {
		return IMAGE_CACHE.get(cacheString)!
	}

	const style = new Promise<string>(resolve => {
		const img = new Image()
		// Default font size of chrome's console is 12px, and the space char is about 3.6px wide
		// Chrome's dev tools scale the console itself, not the font size when zooming in/out
		// so the font size is always the same (when using chrome), so theses values can be hardcoded.
		const defaultConsoleFontSize = 12
		const widthOfSpaceChar = 3.6

		img.onload = () => {
			if (width == undefined && height != undefined) {
				// Base width on aspect ratio of img
				width = (height / img.height) * img.width
			}
			if (height == undefined && width != undefined) {
				// Base height on aspect ratio of img
				height = (width / img.width) * img.height
			}

			width ??= Math.floor(width ?? img.width)
			height ??= Math.floor(height ?? img.height)

			const paddingWidth = Math.max(width, defaultConsoleFontSize) * 0.5
			const paddingHeight = Math.max(height, defaultConsoleFontSize) * 0.5

			resolve(
				[
					`line-height: ${height % 2}px;`,
					`padding: ${paddingHeight}px ${paddingWidth - widthOfSpaceChar}px;`,
					`background: url(${url});`,
					`background-size: ${width}px ${height}px;`,
					`background-repeat: no-repeat;`,
					`background-position: center;`,
				].join(' ')
			)
		}

		img.src = url
		img.style.background = 'url(' + url + ')'
	})

	const result = await style
	IMAGE_CACHE.set(cacheString, result)
	return result
}

class Logger {
	constructor(
		public prefix: string[],
		icon?: ImgConsoleStyleOptions
	) {
		if (icon) {
			getImgStyle(icon).then(style => {
				this.prefix = ['%c %c ' + this.prefix[0], style, '', ...this.prefix.slice(1)]
			})
		}
	}

	info(...args: any[]) {
		console.log(...this.prefix, '\n', ...args)
	}

	warn(...args: any[]) {
		console.warn(...this.prefix, '\n', ...args)
	}

	error(...args: any[]) {
		console.error(...this.prefix, '\n', ...args)
	}

	async img(img: ImgConsoleStyleOptions, ...args: any[]) {
		const style = await getImgStyle(img)
		console.log('%c  ', style, ...args)
	}
}

export const log = new Logger(
	[
		'%cUtility Engine',
		'color: #EA3D7D; font-weight: bold; font-size: 12px; font-family: Consolas;',
	],
	{ url: Icon, height: 16 }
)
