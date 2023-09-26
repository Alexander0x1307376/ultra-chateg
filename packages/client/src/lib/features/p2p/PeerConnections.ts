import type { IStore } from '$lib/interfaces/IStore';
import freeice from 'freeice';

export type PeerData = {
	peerId: string;
	userId: number;
	channelId: string;
	createOffer: boolean;
};

export type PeerEvents = {
	peerAdded: (peerId: string, peerData: PeerData) => void;
	streamsAdded: (peerId: string, streams: MediaStream[]) => void;
	peerRemoved: (peerId: string) => void;
	allPeersRemoved: () => void;
};

export type FullPeerData = {
	peerData: PeerData;
	connection: RTCPeerConnection;
	streams: MediaStream[];
};

export type PeerConnectionsState = Map<string, FullPeerData>;

export class PeerConnections implements IStore<PeerConnectionsState> {
	private _peerData: Map<string, FullPeerData>; // основное хранилище с данными для отображения
	private _userIndexes: Map<number, FullPeerData>; // те же данные (те же ссылки), но с ключами юзера

	private _subscriptions: ((data: PeerConnectionsState) => void)[];

	get peersByUsers() {
		return this._userIndexes;
	}

	constructor() {
		this._peerData = new Map();
		this._userIndexes = new Map();
		this._subscriptions = [];

		this.addPeer = this.addPeer.bind(this);
		this.addStreams = this.addStreams.bind(this);
		this.removePeer = this.removePeer.bind(this);
		this.getPeerData = this.getPeerData.bind(this);
		this.getPeerDataByUserId = this.getPeerDataByUserId.bind(this);

		this.subscribe = this.subscribe.bind(this);
		this.emit = this.emit.bind(this);
	}

	subscribe(subscription: (value: PeerConnectionsState) => void) {
		this._subscriptions.push(subscription);
		subscription(this._peerData);
		return () => {
			this._subscriptions.splice(this._subscriptions.indexOf(subscription), 1);
		};
	}

	protected emit(value: PeerConnectionsState) {
		this._subscriptions.forEach((subscription) => subscription.call(this, value));
	}

	addPeer(
		peerData: PeerData,
		handlers: {
			iceCandidateHandler: (event: RTCPeerConnectionIceEvent) => void;
			trackHandler: (event: RTCTrackEvent) => void;
		}
	): FullPeerData {
		const peer = new RTCPeerConnection({
			iceServers: freeice()
		});

		peer.addEventListener('icecandidate', handlers.iceCandidateHandler);
		peer.addEventListener('track', handlers.trackHandler);

		const newPeerData: FullPeerData = {
			peerData,
			connection: peer,
			streams: []
		};
		this._peerData.set(peerData.peerId, newPeerData);
		this._userIndexes.set(peerData.userId, newPeerData);
		this.emit(this._peerData);
		return newPeerData;
	}

	addStreams(peerId: string, streams: MediaStream[]): FullPeerData | undefined {
		const peerData = this._peerData.get(peerId);
		if (!peerData) {
			console.log(`[PeerConnections]:addStreams: no peer with id: ${peerId} found`);
			return;
		}
		peerData.streams = streams;
		this.emit(this._peerData);
		return peerData;
	}

	removePeer(peerId: string) {
		const peerData = this._peerData.get(peerId);
		if (!peerData) {
			console.log(`[PeerConnections]:removePeer: no peer with id: ${peerId} found`);
			return;
		}
		this.closeConnectionAndStreams(peerData);
		this._peerData.delete(peerId);
		this.emit(this._peerData);
	}

	removeAllPeers() {
		this._peerData.forEach(this.closeConnectionAndStreams);
		this._peerData.clear();
		this.emit(this._peerData);
	}

	private closeConnectionAndStreams(peerData: FullPeerData) {
		console.log(`[[PeerConnections]]:closeConnectionAndStreams`);
		peerData.connection.close();
		peerData.streams.forEach((stream) => {
			stream.getTracks().forEach((track) => {
				track.stop();
			});
		});
	}

	getPeerData(peerId: string): FullPeerData | undefined {
		const peerData = this._peerData.get(peerId);
		if (!peerData) {
			console.log(`[PeerConnections]:getPeerData: no peer with id: ${peerId} found`);
			return;
		}
		return peerData;
	}

	getPeerDataByUserId(userId: number): FullPeerData | undefined {
		const peerData = this._userIndexes.get(userId);
		if (!peerData) {
			console.log(
				`[PeerConnections]:getPeerDataByUserId: no peer data by user with id: ${userId} found`
			);
			return;
		}
		return peerData;
	}
}
