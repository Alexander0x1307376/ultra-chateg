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

export type PeerConnectionsState = Map<number, FullPeerData>;

export class PeerConnections implements IStore<PeerConnectionsState> {
	private _userPeerData: Map<number, FullPeerData>;

	private _subscriptions: ((data: PeerConnectionsState) => void)[];

	constructor() {
		this._userPeerData = new Map();
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
		subscription(this._userPeerData);
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
		this._userPeerData.set(peerData.userId, newPeerData);
		this.emit(this._userPeerData);
		return newPeerData;
	}

	addStreams(userId: number, streams: MediaStream[]): FullPeerData | undefined {
		const peerData = this._userPeerData.get(userId);
		if (!peerData) {
			console.log(`[PeerConnections]:addStreams: no peer data of user with id: ${userId} found`);
			return;
		}
		peerData.streams = streams;
		this.emit(this._userPeerData);
		return peerData;
	}

	removePeer(userId: number) {
		const peerData = this._userPeerData.get(userId);
		if (!peerData) {
			console.log(`[PeerConnections]:removePeer: no peer data of user with id: ${userId} found`);
			return;
		}
		this.closeConnectionAndStreams(peerData);
		this._userPeerData.delete(userId);
		this.emit(this._userPeerData);
	}

	removeAllPeers() {
		this._userPeerData.forEach(this.closeConnectionAndStreams);
		this._userPeerData.clear();
		this.emit(this._userPeerData);
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

	getPeerData(userId: number): FullPeerData | undefined {
		const peerData = this._userPeerData.get(userId);
		if (!peerData) {
			console.log(`[PeerConnections]:getPeerData: no peer of user with id: ${userId} found`);
			return;
		}
		return peerData;
	}

	getPeerDataByUserId(userId: number): FullPeerData | undefined {
		const peerData = this._userPeerData.get(userId);
		if (!peerData) {
			console.log(
				`[PeerConnections]:getPeerDataByUserId: no peer data of user with id: ${userId} found`
			);
			return;
		}
		return peerData;
	}
}
