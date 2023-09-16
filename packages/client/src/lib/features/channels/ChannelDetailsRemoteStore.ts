import type { Socket } from 'socket.io-client';
import { BaseStore } from '../store/BaseStore';
import type { SocketData, WebsocketConnection } from '../webSockets/WebsocketConnection';
import { goto } from '$app/navigation';

export type User = {
	id: number;
	name: string;
	avaUrl?: string;
};

export type ScopeTransfer = {
	id: string;
	name: string;
	members: number[];
};

export type ChannelDetailsTransfer = {
	id: string;
	name: string;
	ownerId: number;
	members: User[];
	scopes: ScopeTransfer[];
};

export type ClientToServerEvents = {
	'channelDetails:subscribe': (channelId: string) => void;
	'channelDetails:unsubscribe': () => void;
	'channelDetails:update': (channel: ChannelDetailsTransfer) => void;
};
export type ServerToClientEvents = {
	'channelDetails:set': (channel: ChannelDetailsTransfer) => void;
	'channelDetails:remove': (channelId: string) => void;
	'channelDetails:update': (channel: ChannelDetailsTransfer) => void;
};

export type ChannelDetailsState = ChannelDetailsTransfer | undefined;

export class ChannelDetailsRemoteStore extends BaseStore<ChannelDetailsState> {
	private _socket: Socket<ServerToClientEvents, ClientToServerEvents> | undefined;

	private _channelId: string;
	set channelId(value: string) {
		this._channelId = value;
	}

	constructor(wsConnection: WebsocketConnection) {
		super(undefined);
		this._channelId = '';

		this.subscribe = this.subscribe.bind(this);
		this.handleConnectSocket = this.handleConnectSocket.bind(this);
		this.handleSocket = this.handleSocket.bind(this);
		this.updateOnServer = this.updateOnServer.bind(this);

		wsConnection.subscribe(this.handleConnectSocket);
	}

	updateOnServer(callback: (channel: ChannelDetailsState) => ChannelDetailsState) {
		const dataToSend = callback(this._store);
		if (dataToSend) this._socket?.emit('channelDetails:update', dataToSend);
	}

	override subscribe(subscription: (value: ChannelDetailsState) => void): () => void {
		const channelId = this._channelId;
		if (!channelId) {
			console.warn(`[ChannelDetailsRemoteStore]:subscribe: channel id isn't set`);
			return () => {
				/** */
			};
		}

		console.log(`[ChannelDetailsRemoteStore]:subscribe`, this._store);

		// если это первый подписчик - сообщаем серверу, что хотим получать обновления
		if (this.subscriptionsCount === 0) {
			console.log(`[ChannelDetailsRemoteStore]:subscribe: socket emit`);
			this._socket?.emit('channelDetails:subscribe', channelId);
		}

		const unsubscribe = super.subscribe(subscription);
		return () => {
			console.log(`[ChannelDetailsRemoteStore]:unsubscribe`, channelId);
			unsubscribe();
			// если это последний подписчик - отписываемся от обновлений с сервера
			if (this.subscriptionsCount === 0) {
				this._socket?.emit('channelDetails:unsubscribe');
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
			if (this.subscriptionsCount && this._channelId) {
				setTimeout(() => {
					socket.emit('channelDetails:subscribe', this._channelId);
				}, 200);
			}
		});
		socket.on('channelDetails:set', this.set);
		socket.on('channelDetails:update', (data) => {
			this.set(data);
		});
		// если канал был удалён на сервере или не существует по разным причинам
		socket.on('channelDetails:remove', () => {
			this.set(undefined);
			goto('/');
		});
	}
}
