import type { Socket } from 'socket.io-client';
import { BaseStore } from '../store/BaseStore';
import type { SocketData, WebsocketConnection } from '../webSockets/WebsocketConnection';

export type Channel = {
	id: string;
	name: string;
	ownerId: string;
};

export type CreateChannelInput = {
	name: string;
};

export type ClientToServerEvents = {
	'channels:subscribe': () => void;
	'channels:unsubscribe': () => void;
	'channels:createChannel': (
		channelInput: CreateChannelInput,
		response: (response: AckResponse<Channel>) => void
	) => void;
};

export type ServerToClientEvents = {
	'channels:set': (data: Channel[]) => void;
	'channels:remove': (ids: string[]) => void;
	'channels:update': (data: Channel[]) => void;
};

export type AckResponse<T> = {
	status: 'ok' | 'error';
	message?: string;
	data?: T;
};

export type ChannelsState = Channel[];

export class ChannelsRemoteStore extends BaseStore<ChannelsState> {
	private _socket: Socket<ServerToClientEvents, ClientToServerEvents> | undefined;

	constructor(wsConnection: WebsocketConnection) {
		super([]);

		this.subscribe = this.subscribe.bind(this);
		this.handleConnectSocket = this.handleConnectSocket.bind(this);
		this.handleSocket = this.handleSocket.bind(this);
		this.addChannel = this.addChannel.bind(this);
		this.upsertChannels = this.upsertChannels.bind(this);
		this.removeChannels = this.removeChannels.bind(this);

		wsConnection.subscribe(this.handleConnectSocket);
	}

	override subscribe(subscription: (value: ChannelsState) => void): () => void {
		console.log(`[ChannelsRemoteStore]:subscribe`, this._store);

		// если это первый подписчик - сообщаем серверу, что хотим получать обновления
		if (this.subscriptionsCount === 0) {
			this._socket?.emit('channels:subscribe');
		}

		const unsubscribe = super.subscribe(subscription);
		return () => {
			unsubscribe();
			// если это последний подписчик - отписываемся от обновлений с сервера
			if (this.subscriptionsCount === 0) {
				this._socket?.emit('channels:unsubscribe');
			}
		};
	}

	private handleConnectSocket(socket: SocketData) {
		if (!socket) return;
		this._socket = socket;
		this.handleSocket(socket);
	}

	private handleSocket(socket: Socket<ServerToClientEvents, ClientToServerEvents>) {
		socket.on('connect', () => {
			console.log(`[ChannelsRemoteStore]:handleSocket:(connect)`);
			if (this.subscriptionsCount) {
				console.log(`[ChannelsRemoteStore]:handleSocket:(connect): connection recovered`);
				setTimeout(() => {
					socket.emit('channels:subscribe');
				}, 200);
			}
		});

		socket.on('channels:set', this.set);
		socket.on('channels:remove', this.removeChannels);
		socket.on('channels:update', this.upsertChannels);
	}

	removeChannels(ids: string[]) {
		this.update((prevState) => prevState.filter((item) => !ids.includes(item.id)));
	}

	upsertChannels(upsertData: Channel[]) {
		this.update((prevState) => {
			const updatedStore = [...prevState];
			// проходим по добавляемым данным, сверяемся с имеющимися данными
			// если id совпадают - заменяем, иначе - пушим в конец
			upsertData.forEach((upsertItem) => {
				const existingItemIndex = updatedStore.findIndex(
					(storeItem) => storeItem.id === upsertItem.id
				);

				if (existingItemIndex !== -1) {
					updatedStore[existingItemIndex] = upsertItem;
				} else {
					updatedStore.push(upsertItem);
				}
			});
			return updatedStore;
		});
	}

	addChannel(channelInput: CreateChannelInput) {
		return new Promise<AckResponse<Channel>>((resolve, reject) => {
			if (this._socket) {
				this._socket.emit('channels:createChannel', channelInput, (response) => {
					if (response.status === 'error') {
						console.warn('[ChannelsRemoteStore]:addChannel: error:', response.message);
						reject(response);
					}
					if (response.status === 'ok') {
						resolve(response);
					}
				});
			} else {
				console.warn('[ChannelsRemoteStore]:addChannel: no socket initialized');
				reject({ status: 'error', message: 'no socket' });
			}
		});
	}
}
