import { get, writable, type Writable } from 'svelte/store'
import { mapEntries } from './objUtils'

type SyncableTypes = string | number | boolean | undefined

export type Syncable<T extends SyncableTypes> = Writable<T> & {
	get(): T
}

/**
 * Create a {@link writable} store that also has a get() method to retrieve the current value.
 * @param value The initial value of the store
 */
export function syncable<T extends SyncableTypes>(value: T): Syncable<T> {
	return {
		...writable(value),
		get() {
			return get(this)
		},
	}
}

export function makeSyncable<O extends Record<string, any>>(obj: O) {
	return mapEntries(obj, (k, v) => [k, syncable(v)]) as {
		[Key in keyof O]: Syncable<O[Key]>
	}
}

export function makeNotSyncable<O extends Record<string, Syncable<any>>>(obj: O) {
	return mapEntries(obj, (k, v) => [k, v.get()]) as {
		[Key in keyof O]: ReturnType<O[Key]['get']>
	}
}
