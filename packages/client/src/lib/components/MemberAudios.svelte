<script lang="ts">
	import type { Core } from '$lib/bootstrap/bootstrap';
	import { getContext } from 'svelte';

	const { peerConnections, memberAudios } = getContext<Core>('core');

	const attachStream = (node: HTMLVideoElement | HTMLAudioElement, stream: MediaStream) => {
		node.srcObject = stream;
		return {
			update: (newStream: MediaStream) => {
				node.srcObject = newStream;
			}
		};
	};

	let volumes: Record<number, number> = {};
	$: {
		for (const [key, peerData] of $peerConnections) {
			const keyString = key.toString();
			if (keyString in $memberAudios) {
				volumes[key] = $memberAudios[keyString].volume / 100;
			}
		}
	}
</script>

{#each $peerConnections as [key, peerData] (key)}
	<audio use:attachStream={peerData.streams[0]} autoplay bind:volume={volumes[key]} />
{/each}
