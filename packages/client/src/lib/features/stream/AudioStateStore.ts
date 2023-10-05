import { BaseStore } from '../store/BaseStore';

export type AudioStateItem = {
	volume: number;
	isVoice: boolean;
};
export class AudioStateStore extends BaseStore<AudioStateItem> {}
