export class StreamService {
	private _mediaStream: MediaStream | undefined;

	constructor() {
		this.getMediaStream = this.getMediaStream.bind(this);
	}

	async getMediaStream(): Promise<MediaStream> {
		if (!this._mediaStream) {
			this._mediaStream = await navigator.mediaDevices.getUserMedia({
				audio: true,
				video: true
			});
		}

		return this._mediaStream;
	}
}
