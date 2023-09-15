import type { ChannelDetails, ChannelDetailsTransfer } from "./ChannelDetailsStore";

export const channelDataToTransfer = (channelData: ChannelDetails): ChannelDetailsTransfer => {
  return {
    id: channelData.id,
    name: channelData.name,
    ownerId: channelData.ownerId,
    members: Array.from(channelData.members, ([_, member]) => member),
    scopes: Array.from(channelData.scopes, ([_, scope]) => ({
      id: scope.id,
      name: scope.name,
      members: Array.from(scope.members),
    })),
  };
};
