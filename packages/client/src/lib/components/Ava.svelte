<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton';
	import { getFirstLetters } from '$lib/utils/getFirstLetters';
	export let src: string | undefined = '';
	export let label: string;
	export let width: string = 'w-12';

	$: initials = getFirstLetters(label);
</script>

<Avatar {width} {src} {initials} />
