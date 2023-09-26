import { REFRESH_TOKEN_STORAGE_KEY, API_URL } from '$lib/config/config';
import { AuthQueryService } from '$lib/features/auth/AuthQueryService';
import { AuthStore } from '$lib/features/auth/AuthStore';
import { ChannelDetailsRemoteStore } from '$lib/features/channels/ChannelDetailsRemoteStore';
import { ChannelsRemoteStore } from '$lib/features/channels/ChannelsRemoteStore';
import { HttpClient } from '$lib/features/http/HttpClient';
import { PeerConnections } from '$lib/features/p2p/PeerConnections';
import { PeerToPeerService } from '$lib/features/p2p/PeerToPeerService';
import { StreamService } from '$lib/features/stream/StreamService';
import { RealtimeService } from '$lib/features/webSockets/RealtimeService';
import { WebsocketConnection } from '$lib/features/webSockets/WebsocketConnection';

// здесь инициализируем и связываем все необходимые нам системы
export const bootstrap = () => {
	const authStore = new AuthStore(undefined, localStorage, REFRESH_TOKEN_STORAGE_KEY);
	const httpClient = new HttpClient(API_URL, authStore);
	const authQueryService = new AuthQueryService(
		httpClient,
		authStore,
		localStorage,
		REFRESH_TOKEN_STORAGE_KEY
	);

	const webSocketConnection = new WebsocketConnection('/', authStore);
	const channelsRemoteStore = new ChannelsRemoteStore(webSocketConnection);
	const channelDetailsRemoteStore = new ChannelDetailsRemoteStore(webSocketConnection);

	const streamService = new StreamService();

	const peerConnections = new PeerConnections();
	const peerToPeerService = new PeerToPeerService(
		webSocketConnection,
		peerConnections,
		streamService
	);

	const realtimeService = new RealtimeService([]);

	return {
		authStore,
		authQueryService,
		httpClient,
		webSocketConnection,
		realtimeService,
		channelsRemoteStore,
		channelDetailsRemoteStore,
		peerToPeerService,
		streamService,
		peerConnections
	};
};
