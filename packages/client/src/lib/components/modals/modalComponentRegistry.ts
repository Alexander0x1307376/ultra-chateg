import type { ModalComponent } from '@skeletonlabs/skeleton';
import CreateChannelModal from './CreateChannelModal.svelte';

export const modalComponentRegistry: Record<string, ModalComponent> = {
	// Create channel modal
	CreateChannelModal: {
		ref: CreateChannelModal
	}
};
