import { Server, Socket } from "socket.io";
import { UserData } from "../users/userTypes";
import { ISocketHandler } from "../webSockets/ISocketHandler";
import type { ChannelDetails, ChannelDetailsStore, ChannelDetailsTransfer } from "./ChannelDetailsStore";
import { channelDataToTransfer } from "./channelUtils";

export type ClientToServerEvents = {
  "channelDetails:subscribe": (channelId: string) => void;
  "channelDetails:unsubscribe": () => void;
  "channelDetails:update": (data: ChannelDetailsTransfer) => void;
};
export type ServerToClientEvents = {
  "channelDetails:set": (channel: ChannelDetailsTransfer) => void;
  "channelDetails:remove": (channelId: string) => void;
  "channelDetails:update": (channel: ChannelDetailsTransfer) => void;
};

// данные конкретного канала
// предполагается, что клиент одновременно может отслеживать данные только одного канала
export class ChannelDetailsRemoteStore implements ISocketHandler {
  private readonly CHANNEL_CHATROOM_PREFIX = "channel_";

  private _socketServer: Server<ClientToServerEvents, ServerToClientEvents>;
  private _channelsDetailsStore: ChannelDetailsStore;

  constructor(socketServer: Server, channelsDetailsStore: ChannelDetailsStore) {
    this._socketServer = socketServer;
    this._channelsDetailsStore = channelsDetailsStore;

    this.socketHandler = this.socketHandler.bind(this);
    this.handleStoreEvents = this.handleStoreEvents.bind(this);
    this.getChannelRoomName = this.getChannelRoomName.bind(this);
    this.leaveAllChatRooms = this.leaveAllChatRooms.bind(this);

    this.handleStoreEvents();
  }

  socketHandler(socket: Socket<ClientToServerEvents, ServerToClientEvents>, userData: UserData) {
    socket.on("channelDetails:subscribe", (channelId) => {
      //#region Валидация
      if (!channelId) {
        console.warn(
          `[ChannelDetailsRemoteStore]:socketHandler:(channelDetails:subscribe): channelId parameter isn't set`,
        );
        return;
      }

      const channel = this._channelsDetailsStore.get(channelId);
      if (!channel) {
        console.warn(
          `[ChannelDetailsRemoteStore]:socketHandler:(channelDetails:subscribe): no channel with id: ${channelId}`,
        );
        socket.emit("channelDetails:remove", channelId);
        return;
      }
      // #endregion

      this._channelsDetailsStore.addMember({
        member: userData.user,
        channelId,
      });
      userData.currentChannel = channelId;

      // выходим из комнат прочих каналов (если в них были)
      this.leaveAllChatRooms(socket);
      const chatRoom = this.getChannelRoomName(channelId);
      socket.join(chatRoom);
      console.log(`user "${userData.user.name}" joined "${chatRoom}"`);
      socket.emit("channelDetails:set", channelDataToTransfer(channel));
    });
    //
    socket.on("channelDetails:unsubscribe", () => {
      // #region вылидация
      if (!userData.currentChannel) {
        console.warn(`[ChannelDetailsRemoteStore]:socketHandler:(channelDetails:unsubscribe): no user in any channel`);
        return;
      }
      // #endregion

      console.log(`user "${userData.user.name}" left "${userData.currentChannel}"`);
      this.leaveAllChatRooms(socket);
      this._channelsDetailsStore.removeMember({
        channelId: userData.currentChannel,
        memberId: userData.user.id,
      });
    });
    socket.on("channelDetails:update", (data) => {
      // #region вылидация
      const channel = this._channelsDetailsStore.get(data.id);
      if (!channel) {
        console.warn(
          `[ChannelDetailsRemoteStore]:socketHandler:(channelDetails:update): no channel with id: ${data.id}`,
        );
        return;
      }
      if (channel.ownerId !== userData.user.id) {
        console.warn(
          `[ChannelDetailsRemoteStore]:socketHandler:(channelDetails:update): user ${userData.user.name} isn't an owner of channel with id: ${data.id}`,
        );
        return;
      }
      // #endregion
      this._channelsDetailsStore.updateChannel(data);
    });
    socket.on("disconnect", () => {
      if (!userData.currentChannel) return;
      this._channelsDetailsStore.removeMember({
        channelId: userData.currentChannel,
        memberId: userData.user.id,
      });
    });
  }

  private handleStoreEvents() {
    const emitter = this._channelsDetailsStore.emitter;
    emitter.on("channelCreated", (channel) => {
      this._socketServer.in(this.getChannelRoomName(channel.id)).emit("channelDetails:update", channel);
    });
    emitter.on("channelUpdated", (channel) => {
      this._socketServer.in(this.getChannelRoomName(channel.id)).emit("channelDetails:update", channel);
    });
  }

  private getChannelRoomName(name: string) {
    return this.CHANNEL_CHATROOM_PREFIX + name;
  }

  private leaveAllChatRooms(socket: Socket) {
    socket.rooms.forEach((val) => {
      val.includes(this.CHANNEL_CHATROOM_PREFIX) && socket.leave(val);
    });
  }
}
