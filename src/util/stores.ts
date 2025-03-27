import { get, type Subscriber, type Unsubscriber, type Writable, writable } from 'svelte/store'

export class Syncable<T> implements Writable<T> {
	static all: Array<Syncable<any>> = []

	protected store: Writable<T>
	protected valueValidator: (value: T) => T

	constructor(value: T, valueValidator?: Syncable<T>['valueValidator']) {
		this.store = writable(value)
		this.valueValidator = valueValidator ?? ((value: T) => value)
		Syncable.all.push(this)
	}

	get() {
		return this.valueValidator(get(this.store))
	}

	set(value: T) {
		return this.store.set(this.valueValidator(value))
	}

	update(fn: (value: T) => T) {
		return this.store.update((value: T) => this.valueValidator(fn(value)))
	}

	subscribe(run: Subscriber<T>, invalidate?: (value?: T) => void): Unsubscriber {
		return this.store.subscribe(run, invalidate)
	}
}

export class SyncableSet<T> extends Syncable<Set<T>> {
	constructor(value: Set<T>) {
		super(value, (value: Set<T>) => new Set(value))
	}

	add(value: T) {
		const set = this.get()
		set.add(value)
		this.set(set)
	}

	delete(value: T) {
		const set = this.get()
		set.delete(value)
		this.set(set)
	}
}
