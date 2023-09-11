import type { IInitiable } from '$lib/interfaces/IInitiable';
import { type Writable, writable } from 'svelte/store';
import type { AuthStore } from '../auth/AuthStore';
import { Socket, io } from 'socket.io-client';
import type { IStore } from '$lib/interfaces/IStore';

export type SocketData = Socket | undefined;

export class WebsocketConnection implements IInitiable, IStore<SocketData> {
	private _hostUrl: string;
	private _authStore: AuthStore;

	socket: Writable<SocketData>;
	private _socket: SocketData;

	getSocket() {
		return this._socket;
	}

	constructor(hostUrl: string, authStore: AuthStore) {
		this._hostUrl = hostUrl;
		this._authStore = authStore;

		this.socket = writable();

		this.init = this.init.bind(this);
		this.getSocket = this.getSocket.bind(this);
	}

	init() {
		console.log('[WebsocketSystem]: initialization...');
		const authData = this._authStore.authData;
		if (authData) {
			const extraHeaders = { Authorization: `Bearer ${authData.accessToken}` };
			const socket = io({
				autoConnect: false,
				host: this._hostUrl,
				auth: authData.userData,
				extraHeaders
			});
			socket.on('connect', () => {
				console.log('[WebsocketSystem]: initialization success. Socket connected');
			});

			socket.on('connect_error', (error: Error) => {
				if (error.message === 'NOT_AUTHORIZED') {
					console.warn('[WebsocketSystem]:error: not authorized');
				} else {
					console.warn('[WebsocketSystem]:error: unhandled error', error.message);
				}
			});
			socket.connect();
			this._socket = socket;
			this.socket.set(socket);
		} else {
			console.warn(`[WebsocketSystem]: no auth data. Initialization failed`);
		}
	}

	subscribe(subscription: (value: SocketData) => void) {
		return this.socket.subscribe(subscription);
	}
}
