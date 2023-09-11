import type { Socket } from 'socket.io-client';
import type { BaseWebSocketHandler } from './BaseWebSocketHandler';

export class RealtimeService {
	constructor(private handlers: BaseWebSocketHandler[]) {}

	bindSocket(socket: Socket) {
		this.handlers.forEach((handler: BaseWebSocketHandler) => {
			handler.init(socket);
		});
	}
}
