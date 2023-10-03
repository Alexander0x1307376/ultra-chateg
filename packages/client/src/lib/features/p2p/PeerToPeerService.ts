import type { Socket } from 'socket.io-client';
import type { SocketData, WebsocketConnection } from '../webSockets/WebsocketConnection';
import type { PeerConnections, PeerData } from './PeerConnections';
import type { DevicesService } from '../stream/DevicesService';

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
	private _devicesService: DevicesService;

	constructor(
		wsConnection: WebsocketConnection,
		peerConnections: PeerConnections,
		devicesService: DevicesService
	) {
		this._peerConnections = peerConnections;
		this._devicesService = devicesService;

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
				this._peerConnections.addStreams(peerData.peerId, event.streams as MediaStream[]);
			};

			const { connection } = this._peerConnections.addPeer(peerData, {
				iceCandidateHandler: handleIceCandidate.bind(this),
				trackHandler: handleTrack.bind(this)
			});

			const stream = await this._devicesService.getMediaStream();
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
			await connection.setRemoteDescription(remoteSessionDescription);

			if (offer.type !== 'offer') return;

			const answer = await connection.createAnswer();
			await connection.setLocalDescription(answer);

			socket.emit('relaySDP', {
				channelId: sdpData.channelId,
				peerId: sdpData.peerId,
				userId: sdpData.userId,
				sessionDescription: answer
			});
		});
		socket.on('ICECandidate', (iceCandidateData) => {
			const peerData = this._peerConnections.getPeerData(iceCandidateData.peerId);
			if (!peerData) return;

			const rtcIceCandidate = new RTCIceCandidate(iceCandidateData.iceCandidate);
			peerData.connection.addIceCandidate(rtcIceCandidate);
		});
		socket.on('removePeer', ({ peerId }) => {
			console.log('REMOVE_PEER', peerId);
			this._peerConnections.removePeer(peerId);
		});
	}
}
