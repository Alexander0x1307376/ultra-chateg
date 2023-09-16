import type { User } from '$lib/entities/entities';
import type { ChannelDetailsVisual, UserVisual } from '$lib/pages/Channel.svelte';
import type { ChannelDetailsTransfer, ScopeTransfer } from './ChannelDetailsRemoteStore';

export const channelDetailsTransferToVisual = (
	transfer: ChannelDetailsTransfer
): ChannelDetailsVisual => {
	const mapUserVisual = (user: User): UserVisual => ({
		id: user.id.toString(),
		name: user.name,
		avaUrl: user.avaUrl || undefined
	});

	const scopesVisual = transfer.scopes.map((scope) => {
		const memberIdsSet = new Set(scope.members);
		const scopeMembers: UserVisual[] = transfer.members
			.filter((member) => memberIdsSet.has(member.id))
			.map(mapUserVisual);
		return {
			id: scope.id,
			name: scope.name,
			members: scopeMembers
		};
	});

	return {
		id: transfer.id,
		name: transfer.name,
		members: transfer.members.map(mapUserVisual),
		scopes: scopesVisual
	};
};

export const channelDetailsVisualToTransfer = (
	visual: ChannelDetailsVisual,
	ownerId: number
): ChannelDetailsTransfer => {
	const mapUser = (userVisual: UserVisual): User => ({
		id: Number(userVisual.id),
		name: userVisual.name,
		avaUrl: userVisual.avaUrl || undefined
	});

	const scopesTransfer: ScopeTransfer[] = visual.scopes.map((scope) => ({
		id: scope.id,
		name: scope.name,
		members: scope.members.map((user) => Number(user.id))
	}));

	return {
		id: visual.id,
		name: visual.name,
		ownerId,
		members: visual.members.map(mapUser),
		scopes: scopesTransfer
	};
};
