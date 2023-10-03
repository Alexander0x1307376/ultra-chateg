<script lang="ts">
	export let stream: MediaStream;

	let videoElement: HTMLVideoElement;
	$: stream && videoElement && setStream();
	const setStream = () => {
		videoElement.srcObject = stream;
	};
</script>

<div class="bg-slate-700 h-28 rounded overflow-clip">
	<video class="h-hull" bind:this={videoElement} autoplay playsInline>
		<track kind="captions" />
	</video>
</div>
