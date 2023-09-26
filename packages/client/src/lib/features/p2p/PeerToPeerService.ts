import type { Socket } from 'socket.io-client';
import type { SocketData, WebsocketConnection } from '../webSockets/WebsocketConnection';
import type { PeerConnections, PeerData } from './PeerConnections';
import type { StreamService } from '../stream/StreamService';

export type DisconnectPeerData = {
	peerId: string;
};

export type IceCandidateData = {
	peerId: string;
	userId: number;
	channelId: string;
	iceCandidate: RTCIceCandidate;
};

export type SPDData = {
	peerId: string;
	userId: number;
	channelId: string;
	sessionDescription: RTCSessionDescriptionInit;
};

export type ClientToServerEvents = {
	relayICE: (answer: IceCandidateData) => Promise<void> | void;
	relaySDP: (answer: SPDData) => Promise<void> | void;
	startPeerConnection: () => Promise<void> | void;
};

export type ServerToClientEvents = {
	addPeer: (answer: PeerData) => Promise<void> | void;
	removePeer: (peerData: DisconnectPeerData) => Promise<void> | void;
	ICECandidate: (answer: IceCandidateData) => Promise<void> | void;
	sessionDescription: (answer: SPDData) => Promise<void> | void;
};

export class PeerToPeerService {
	private _socket: Socket<ServerToClientEvents, ClientToServerEvents> | undefined;
	private _peerConnections: PeerConnections;
	private _streamService: StreamService;

	private _trackCount = 0;

	constructor(
		wsConnection: WebsocketConnection,
		peerConnections: PeerConnections,
		streamService: StreamService
	) {
		this._peerConnections = peerConnections;
		this._streamService = streamService;

		this.handleConnectSocket = this.handleConnectSocket.bind(this);
		this.handleSocket = this.handleSocket.bind(this);

		wsConnection.subscribe(this.handleConnectSocket);
	}

	private handleConnectSocket(socket: SocketData) {
		if (!socket) return;
		this._socket = socket;
		this.handleSocket(socket);
	}

	private handleSocket(socket: Socket<ServerToClientEvents, ClientToServerEvents>) {
		//
		socket.on('addPeer', async (peerData) => {
			console.log('addPeer', peerData);

			const handleIceCandidate = (event: RTCPeerConnectionIceEvent) => {
				if (!event.candidate) return;
				socket.emit('relayICE', {
					peerId: peerData.peerId,
					userId: peerData.userId,
					channelId: peerData.channelId,
					iceCandidate: event.candidate
				});
			};

			const handleTrack = (event: RTCTrackEvent) => {
				console.log('handleTrack-handleTrack-handleTrack', event.streams[0].getTracks().length);
				this._trackCount++;
				if (this._trackCount === 2) {
					this._trackCount = 0;
					this._peerConnections.addStreams(peerData.peerId, event.streams as MediaStream[]);
				}
			};

			const { connection } = this._peerConnections.addPeer(peerData, {
				iceCandidateHandler: handleIceCandidate.bind(this),
				trackHandler: handleTrack.bind(this)
			});

			const stream = await this._streamService.getMediaStream();
			stream.getTracks().forEach((track) => {
				connection.addTrack(track, stream);
			});

			if (peerData.createOffer) {
				console.log('CERATE_OFFER');
				const offer = await connection.createOffer();
				connection.setLocalDescription(offer);
				socket.emit('relaySDP', {
					channelId: peerData.channelId,
					userId: peerData.userId,
					peerId: peerData.peerId,
					sessionDescription: offer
				});
			}
		});

		socket.on('sessionDescription', async (sdpData) => {
			const peerData = this._peerConnections.getPeerData(sdpData.peerId);
			if (!peerData) return;

			const { connection } = peerData;

			const offer = sdpData.sessionDescription;
			const remoteSessionDescription = new RTCSessionDescription(offer);
			connection.setRemoteDescription(remoteSessionDescription);

			if (offer.type !== 'offer') return;

			const answer = await connection.createAnswer();
			await connection.setLocalDescription(answer);
			console.log('SET_LOCAL_DESC:ANSWER', { peerId: peerData.peerData.peerId });

			socket.emit('relaySDP', {
				channelId: sdpData.channelId,
				peerId: sdpData.peerId,
				userId: sdpData.userId,
				sessionDescription: answer
			});
		});

		socket.on('removePeer', ({ peerId }) => {
			console.log('REMOVE_PEER', peerId);
			this._peerConnections.removePeer(peerId);
		});
	}
}
