import type { Socket } from 'socket.io-client';
import { BaseStore } from '../store/BaseStore';
import type { SocketData, WebsocketConnection } from '../webSockets/WebsocketConnection';

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
};
export type ServerToClientEvents = {
	'channelDetails:set': (channel: ChannelDetailsTransfer) => void;
	'channelDetails:remove': (channel: ChannelDetailsTransfer) => void;
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

		wsConnection.subscribe(this.handleConnectSocket);
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
					console.log({ channelId: this._channelId, subsCount: this.subscriptionsCount });
					socket.emit('channelDetails:subscribe', this._channelId);
				}, 200);
			}
		});
		socket.on('channelDetails:set', this.set);
		socket.on('channelDetails:update', this.set);
	}
}
