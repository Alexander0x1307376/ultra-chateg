import type { IStore } from '$lib/utils/IStore';
import type { AuthResponse } from './types';

export type AuthData = AuthResponse;
export type AuthDataStore = AuthData | undefined;

export class AuthStore implements IStore<AuthDataStore> {
	private _store: AuthDataStore;
	private _browserStorage: Storage;
	private readonly _storageRefreshTokenKey: string;

	get authData() {
		return this._store;
	}

	constructor(
		initialValue: AuthDataStore = undefined,
		storage: Storage,
		storageRefreshTokenKey: string
	) {
		this._store = initialValue;
		this._browserStorage = storage;
		this._storageRefreshTokenKey = storageRefreshTokenKey;

		this._subscriptions = [];
		this.clear = this.clear.bind(this);
		this.subscribe = this.subscribe.bind(this);
		this.set = this.set.bind(this);
		this.emit = this.emit.bind(this);
	}

	clear() {
		console.log('[AuthSystem]: clear');
		this.set(undefined);
		this._browserStorage.removeItem(this._storageRefreshTokenKey);
	}

	// IStore implementation
	private _subscriptions: ((data: AuthDataStore) => void)[];

	subscribe(subscription: (value: AuthDataStore) => void) {
		this._subscriptions.push(subscription);
		subscription(this._store);
		return () => {
			this._subscriptions.splice(this._subscriptions.indexOf(subscription), 1);
		};
	}

	set(value: AuthDataStore) {
		this._store = value;
		if (value) {
			this._browserStorage.setItem(this._storageRefreshTokenKey, value.refreshToken);
		} else {
			this._browserStorage.removeItem(this._storageRefreshTokenKey);
		}
		this.emit(value);
	}

	private emit(value: AuthDataStore) {
		this._subscriptions.forEach((subscription) => subscription(value));
	}
}
