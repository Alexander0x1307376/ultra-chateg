import { writable, type Writable } from 'svelte/store';
import { BaseStore } from '../store/BaseStore';
import { AudioStateStore } from './AudioStateStore';

export const DEFAULT_VOLUME = 55;
export const VOICE_THRESHOLD = 40;

export type AudioStateItem = {
	volume: number;
	isVoice: boolean;
};

export type StreamServiceState = {
	volume: number;
	audioDevices: MediaDeviceInfo[];
	selectedAudioDevice: MediaDeviceInfo | undefined;
	isThereVolume: boolean;
};

export class DevicesService extends BaseStore<StreamServiceState> {
	private _mediaStream: MediaStream | undefined;
	private _processedStream: MediaStream | undefined;
	private _gainNode: GainNode | undefined;
	private _audioAnalyserNode: AnalyserNode | undefined;

	private _audioDataArray: Uint8Array | undefined;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private _calculateNoiseInterval: any;

	noiseValue: Writable<number>;

	audioState: AudioStateStore;

	constructor() {
		super({
			volume: DEFAULT_VOLUME,
			audioDevices: [],
			selectedAudioDevice: undefined,
			isThereVolume: false
		});

		this.audioState = new AudioStateStore({
			isVoice: false,
			volume: DEFAULT_VOLUME
		});

		this.getMediaStream = this.getMediaStream.bind(this);
		this.setVolume = this.setVolume.bind(this);
		this.getMediaDevices = this.getMediaDevices.bind(this);
		this.selectAudioDevice = this.selectAudioDevice.bind(this);
		this.handleDeviceChange = this.handleDeviceChange.bind(this);

		this.startCalculateNoise = this.startCalculateNoise.bind(this);
		this.stopCalculateNoise = this.stopCalculateNoise.bind(this);
		this.calculateNoise = this.calculateNoise.bind(this);

		this.noiseValue = writable(0);
		navigator.mediaDevices.addEventListener('devicechange', this.handleDeviceChange);

		this.getMediaDevices();
	}

	// handleDeviceChange(e: Event) {
	handleDeviceChange() {
		this.getMediaDevices();
	}

	set(streamServiceState: StreamServiceState) {
		super.set(streamServiceState);
	}

	async getMediaStream(): Promise<MediaStream> {
		if (this._mediaStream && this._processedStream && this._gainNode) return this._processedStream;

		this._mediaStream = await navigator.mediaDevices.getUserMedia({
			audio: { echoCancellation: true }
		});

		const audioContext = new window.AudioContext();

		const audioSource = audioContext.createMediaStreamSource(this._mediaStream);
		const audioDestination = audioContext.createMediaStreamDestination();
		const gainNode = audioContext.createGain();
		const analyser = audioContext.createAnalyser();

		// source -> analyzer -> gainNode -> destination
		audioSource.connect(analyser);
		analyser.connect(gainNode);
		gainNode.connect(audioDestination);

		// анализ аудиопотока
		analyser.fftSize = 128;
		const bufferLength = analyser.frequencyBinCount;
		this._audioDataArray = new Uint8Array(bufferLength);

		gainNode.gain.value = DEFAULT_VOLUME / 100;

		this._gainNode = gainNode;
		this._audioAnalyserNode = analyser;
		this._processedStream = audioDestination.stream;

		this.startCalculateNoise();

		return this._processedStream;
	}

	private startCalculateNoise() {
		this.calculateNoise();
	}
	private stopCalculateNoise() {
		this._calculateNoiseInterval && clearInterval(this._calculateNoiseInterval);
	}

	private async calculateNoise() {
		const dataArray = this._audioDataArray;
		const analyser = this._audioAnalyserNode;
		if (!(dataArray && analyser)) return;

		const bufferLength = analyser.frequencyBinCount;

		this._calculateNoiseInterval = setInterval(() => {
			analyser.getByteFrequencyData(dataArray);
			const average = dataArray.reduce((acc, val) => acc + val, 0) / bufferLength;
			this.noiseValue.set(average);

			// эмитим состояние индикатора только если ему на самом деле есть мсысл меняться
			if (average > VOICE_THRESHOLD && !this.audioState.store.isVoice) {
				this.audioState.update((prev) => ({ ...prev, isVoice: true }));
			}
			if (average < VOICE_THRESHOLD && this.audioState.store.isVoice) {
				this.audioState.update((prev) => ({ ...prev, isVoice: false }));
			}
		}, 50);
	}

	private async getMediaDevices() {
		const devices = await navigator.mediaDevices.enumerateDevices();
		const audioDevices = devices.filter(({ kind }) => kind === 'audioinput');

		const selectedAudioDevice =
			audioDevices.find(({ deviceId }) => deviceId === 'default') || audioDevices[0];

		super.update((state) => ({ ...state, selectedAudioDevice, audioDevices }));
	}

	selectAudioDevice(deviceId: string) {
		const selectedAudioDevice = this._store.audioDevices.find(
			(device) => device.deviceId === deviceId
		);
		super.update((state) => ({ ...state, selectedAudioDevice }));
	}

	setVolume(volumePercent: number) {
		const clampedVolumePercent = Math.min(Math.max(volumePercent, 0), 100);
		this._store.volume = clampedVolumePercent;
		this.set(this._store);
		if (!this._gainNode) return;
		const volume = clampedVolumePercent / 100;
		this._gainNode.gain.value = volume;
		this.audioState.update((prev) => ({ ...prev, volume }));
	}
}
