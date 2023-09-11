import { EventEmitter } from "../eventEmitter/EventEmitter";
import { ChannelsRealtimeService } from "./ChannelsRealtimeService";

export class ChannelsRealtimeStateBuilder {
  static build() {
    const channelsStore = new Map();
    const channelssEmitter = new EventEmitter();
    const channelsRealtimeService = new ChannelsRealtimeService(channelsStore, channelssEmitter);
    return {
      channelsStore,
      channelssEmitter,
      channelsRealtimeService,
    };
  }
}
