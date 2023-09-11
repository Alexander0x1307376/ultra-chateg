import { EventEmitter } from "../eventEmitter/EventEmitter";

export type ChannelData = {};

export type ChannelsEvents = {
  channelAdded: (user: ChannelData) => void;
  channelUpdated: (user: ChannelData) => void;
  channelRemoved: (user: ChannelData) => void;
};

export class ChannelsRealtimeService {
  constructor(
    private store: Map<string, ChannelData>,
    public emitter: EventEmitter<ChannelsEvents>,
  ) {}

  getTransferObjectList() {
    //
  }
}
