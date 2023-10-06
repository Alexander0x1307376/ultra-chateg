import type { AuthStore } from '../auth/AuthStore';
import type { PeerConnections, PeerConnectionsState } from '../p2p/PeerConnections';
import { BaseStore } from '../store/BaseStore';
import type { DevicesService } from '../stream/DevicesService';

export type UserAudio = {
	analyser: AnalyserNode;
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
	get userAudios() {
		return this._userAudios;
	}

	private _deviceService: DevicesService;
	private _authStore: AuthStore;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private _calculateNoiseInterval: any;

	constructor(
		peerConnections: PeerConnections,
		deviceService: DevicesService,
		authStore: AuthStore
	) {
		super({});
		this._userAudios = new Map();
		this._deviceService = deviceService;
		this._authStore = authStore;

		this.handlePeerConnectionUpdate = this.handlePeerConnectionUpdate.bind(this);
		this.startProcess = this.startProcess.bind(this);
		this.stopProcess = this.stopProcess.bind(this);
		this.processing = this.processing.bind(this);
		this.initAudioControls = this.initAudioControls.bind(this);
		this.setMemberVolume = this.setMemberVolume.bind(this);

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
		const newState: Record<number, AudioStateItem> = {};
		this._userAudios.forEach((userAudioData, userId) => {
			newState[userId] = {
				isVoice: this.getVoiceIndicator(userAudioData.analyser),
				volume: this._store[userId]?.volume || DEFAULT_VOLUME
			};
		});
		this.set(newState);
	}

	private getVoiceIndicator(analyserNode: AnalyserNode): boolean {
		const bufferLength = analyserNode.frequencyBinCount;
		const dataArray = new Uint8Array(bufferLength);
		analyserNode.getByteFrequencyData(dataArray);
		const average = dataArray.reduce((acc, val) => acc + val, 0) / bufferLength;
		return average > VOICE_THRESHOLD;
	}

	setMemberVolume(memberId: number, inputVolumePercent: number) {
		const member = this._userAudios.get(memberId);
		if (!member) return;
		const clampedVolumePercent = Math.min(Math.max(inputVolumePercent, 0), 100);
		this.update((prev) => {
			const memberAudio = prev[memberId.toString()];
			const newMemberAudio: AudioStateItem = {
				isVoice: memberAudio.isVoice,
				volume: clampedVolumePercent
			};
			prev[memberId.toString()] = newMemberAudio;
			return prev;
		});
	}

	private initAudioControls(stream: MediaStream): UserAudio {
		const audioContext = new window.AudioContext();

		const audioSource = audioContext.createMediaStreamSource(stream);
		const analyser = audioContext.createAnalyser();

		// source -> analyzer -> gainNode -> destination
		audioSource.connect(analyser);
		analyser.fftSize = FFT_SIZE;

		return {
			analyser
		};
	}
}
