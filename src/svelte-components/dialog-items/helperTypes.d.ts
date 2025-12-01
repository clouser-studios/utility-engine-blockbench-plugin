interface StatusMessage {
	type: 'error' | 'warning'
	message: string
}

interface CollectionItem {
	icon?: string
	name: string
	value: string
}

interface DialogItemProps<T> {
	label: string
	description?: string
	tooltip?: string
	disabled?: boolean
	/**
	 * A function to validate the input value, and return an {@link StatusMessage} if invalid.
	 * Each dialog item is responsible for calling this function when the value changes, and setting the invalidStatus property of the dialog item.
	 */
	validate?: (value: T) => StatusMessage | undefined
	/**
	 * Event called when the reset button is pressed.
	 */
	onreset?: () => void
}
