import type { PeerConnections, PeerConnectionsState } from '../p2p/PeerConnections';
import { BaseStore } from '../store/BaseStore';
import type { DevicesService } from '../stream/DevicesService';

export type UserAudio = {
	stream: MediaStream;
	analyser: AnalyserNode;
	gain: GainNode;
};

export type AudioStateItem = {
	volume: number;
	isVoice: boolean;
};
export type AudioState = Record<string, AudioStateItem>;

const DEFAULT_VOLUME = 50;
const FFT_SIZE = 128;
const VOICE_THRESHOLD = 40;
const PROCESSING_INTERVAL = 100;

export class MemberAudios extends BaseStore<AudioState> {
	private _userAudios: Map<number, UserAudio>;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private _calculateNoiseInterval: any;

	constructor(peerConnections: PeerConnections, deviceService: DevicesService) {
		super({});
		this._userAudios = new Map();

		this.handlePeerConnectionUpdate = this.handlePeerConnectionUpdate.bind(this);
		this.startProcess = this.startProcess.bind(this);
		this.stopProcess = this.stopProcess.bind(this);
		this.processing = this.processing.bind(this);
		this.initAudioControls = this.initAudioControls.bind(this);

		peerConnections.subscribe(this.handlePeerConnectionUpdate);
	}

	handlePeerConnectionUpdate(peersState: PeerConnectionsState) {
		// сносим данные отключившихся юзеров
		const userKeysToRemove: number[] = [];
		this._userAudios.forEach((_, userId) => {
			if (peersState.has(userId)) userKeysToRemove.push(userId);
		});
		userKeysToRemove.forEach((key) => {
			this._userAudios.delete(key);
		});

		// добавляем данные юзеров, которых нет в местном хранилище
		// если peerData юзера не имеют стрима - ничего не делаем
		// имеющиеся данные не трогаем
		peersState.forEach((peerData, userId) => {
			if (!peerData.streams.length || this._userAudios.has(userId)) return;
			const userAudio = this.initAudioControls(peerData.streams[0]);
			this._userAudios.set(userId, userAudio);
		});

		this.startProcess();
	}

	override subscribe(subscription: (value: AudioState) => void): () => void {
		this.startProcess();

		const unsubscribe = super.subscribe(subscription);

		return () => {
			unsubscribe();
			if (!this.subscriptionsCount) this.stopProcess();
		};
	}

	// анализ аудиоданных должен выполняться только если есть юзеры в this._userAudios и если есть подписчики
	private startProcess() {
		if (this.subscriptionsCount && this._userAudios.size && !this._calculateNoiseInterval)
			this._calculateNoiseInterval = setInterval(this.processing, PROCESSING_INTERVAL);
	}

	//
	private stopProcess() {
		if (this._calculateNoiseInterval) {
			clearInterval(this._calculateNoiseInterval);
			this._calculateNoiseInterval = undefined;
		}
	}

	private processing() {
		const audioState: AudioState = {};
		this._userAudios.forEach((userAudioData, userId) => {
			audioState[userId] = this.getAudioStateItem(userAudioData.analyser, userAudioData.gain);
		});
		this.set(audioState);
	}

	private getAudioStateItem(analyserNode: AnalyserNode, gainNode: GainNode): AudioStateItem {
		const bufferLength = analyserNode.frequencyBinCount;
		const dataArray = new Uint8Array(bufferLength);
		analyserNode.getByteFrequencyData(dataArray);
		const average = dataArray.reduce((acc, val) => acc + val, 0) / bufferLength;
		return {
			isVoice: average > VOICE_THRESHOLD,
			volume: gainNode.gain.value
		};
	}

	private initAudioControls(stream: MediaStream): UserAudio {
		const audioContext = new window.AudioContext();

		const audioSource = audioContext.createMediaStreamSource(stream);
		const gainNode = audioContext.createGain();
		const analyser = audioContext.createAnalyser();
		const audioDestination = audioContext.createMediaStreamDestination();

		// source -> analyzer -> gainNode -> destination
		audioSource.connect(analyser);
		analyser.connect(gainNode);
		gainNode.connect(audioDestination);
		analyser.fftSize = FFT_SIZE;

		gainNode.gain.value = DEFAULT_VOLUME / 100;

		return {
			analyser,
			gain: gainNode,
			stream: audioDestination.stream
		};
	}
}
