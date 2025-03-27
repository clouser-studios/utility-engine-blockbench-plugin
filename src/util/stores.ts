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

export class SyncableArrayVector<
	V extends ArrayVector2 | ArrayVector3 | ArrayVector4,
> extends Syncable<V> {
	length: number

	constructor(value: V) {
		super(value)
		this.length = value.length
		this.valueValidator = (value: V) => {
			if (value.length !== this.length) {
				throw new Error(
					'Syncable expected vector of length ' + this.length + ' but got ' + value.length
				)
			}
			return value
		}
	}

	getXSyncable() {
		const store = new Syncable<number>(this.get()[0])
		this.subscribe(value => store.set(value[0]))
		store.subscribe(v => {
			const vector = this.get()
			vector[0] = v
			this.set(vector)
		})
		return store
	}

	getYSyncable() {
		const store = new Syncable<number>(this.get()[1])
		this.subscribe(value => store.set(value[1]))
		store.subscribe(v => {
			const vector = this.get()
			vector[1] = v
			this.set(vector)
		})
		return store
	}

	getZSyncable() {
		if (this.length < 3) {
			throw new Error('Vector does not have a z component')
		}
		const store = new Syncable<number>(this.get()[2]!)
		this.subscribe(value => store.set(value[2]!))
		store.subscribe(v => {
			const vector = this.get()
			vector[2] = v
			this.set(vector)
		})
		return store
	}

	getWSyncable() {
		if (this.length < 4) {
			throw new Error('Vector does not have a w component')
		}
		const store = new Syncable<number>(this.get()[3]!)
		this.subscribe(value => store.set(value[3]!))
		store.subscribe(v => {
			const vector = this.get()
			vector[3] = v
			this.set(vector)
		})
		return store
	}

	get x() {
		return this.get()[0]
	}
	set x(value) {
		const vector = this.get()
		vector[0] = value
		this.set(vector)
	}

	get y() {
		return this.get()[1]
	}
	set y(value) {
		const vector = this.get()
		vector[1] = value
		this.set(vector)
	}

	get z() {
		if (this.length < 3) {
			throw new Error('Vector does not have a z component')
		}
		return this.get()[2]
	}
	set z(value) {
		if (this.length < 3) {
			throw new Error('Vector does not have a z component')
		}
		const vector = this.get()
		vector[2] = value
		this.set(vector)
	}

	get w() {
		if (this.length < 4) {
			throw new Error('Vector does not have a w component')
		}
		return this.get()[3]
	}
	set w(value) {
		if (this.length < 4) {
			throw new Error('Vector does not have a w component')
		}
		const vector = this.get()
		vector[3] = value
		this.set(vector)
	}

	fromGenericArray(array: number[]) {
		this.set(array as V)
		return this
	}

	toGenericArray() {
		return this.get() as number[]
	}

	fromThreeVector(vector: THREE.Vector2 | THREE.Vector3 | THREE.Vector4) {
		this.set(vector.toArray() as V)
		return this
	}

	toThreeVector(vector: THREE.Vector2 | THREE.Vector3 | THREE.Vector4) {
		return vector.fromArray(this.get())
	}
}
