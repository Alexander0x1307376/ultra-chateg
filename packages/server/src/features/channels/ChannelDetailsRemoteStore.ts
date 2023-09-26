import { Server, Socket } from "socket.io";
import { UserData } from "../users/userTypes";
import { ISocketHandler } from "../webSockets/ISocketHandler";
import type { ChannelDetails, ChannelDetailsStore, ChannelDetailsTransfer } from "./ChannelDetailsStore";
import { channelDataToTransfer } from "./channelUtils";
import { EventEmitter } from "../eventEmitter/EventEmitter";

export type ClientToServerEvents = {
  "channelDetails:subscribe": (channelId: string) => void;
  "channelDetails:unsubscribe": () => void;
  "channelDetails:update": (data: ChannelDetailsTransfer) => void;
  "channelDetails:joinScope": (channelId: string, scopeId: string) => void;
  "channelDetails:leaveScope": (channelId: string, scopeId: string) => void;
};
export type ServerToClientEvents = {
  "channelDetails:set": (channel: ChannelDetailsTransfer) => void;
  "channelDetails:remove": (channelId: string) => void;
  "channelDetails:update": (channel: ChannelDetailsTransfer) => void;
};

export type MemberJoinedData = {
  channel: ChannelDetails;
  userData: UserData;
  chatRoom: string;
};

export type MemberLeftData = {
  channelId: string;
  userData: UserData;
  chatRoom: string;
};

export type RemoteStoreEvents = {
  memberJoined: (socket: Socket, data: MemberJoinedData) => void;
  memberLeft: (socket: Socket, data: MemberLeftData) => void;
};

// данные конкретного канала
// предполагается, что клиент одновременно может отслеживать данные только одного канала
export class ChannelDetailsRemoteStore implements ISocketHandler {
  private readonly CHANNEL_CHATROOM_PREFIX = "channel_";

  private _socketServer: Server<ClientToServerEvents, ServerToClientEvents>;
  private _channelsDetailsStore: ChannelDetailsStore;
  private _emitter: EventEmitter<RemoteStoreEvents>;
  get emitter() {
    return this._emitter;
  }

  constructor(socketServer: Server, channelsDetailsStore: ChannelDetailsStore) {
    this._socketServer = socketServer;
    this._channelsDetailsStore = channelsDetailsStore;
    this._emitter = new EventEmitter();

    this.socketHandler = this.socketHandler.bind(this);
    this.handleStoreEvents = this.handleStoreEvents.bind(this);
    this.getChannelRoomName = this.getChannelRoomName.bind(this);
    this.leaveAllChatRooms = this.leaveAllChatRooms.bind(this);
    this.removeMember = this.removeMember.bind(this);

    this.handleStoreEvents();
  }

  socketHandler(socket: Socket<ClientToServerEvents, ServerToClientEvents>, userData: UserData) {
    socket.on("channelDetails:subscribe", (channelId) => {
      const oldCurrentChannel = userData.currentChannel;

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
      if (oldCurrentChannel !== channelId) {
        socket.emit("channelDetails:set", channelDataToTransfer(channel));
        this._emitter.emit("memberJoined", socket, {
          channel,
          userData,
          chatRoom,
        });
      }
    });
    //
    socket.on("channelDetails:unsubscribe", () => {
      const currentChannel = userData.currentChannel;
      // #region вылидация
      if (!currentChannel) {
        console.warn(`[ChannelDetailsRemoteStore]:socketHandler:(channelDetails:unsubscribe): no user in any channel`);
        return;
      }
      // #endregion

      console.log(`user "${userData.user.name}" left "${currentChannel}"`);
      this.leaveAllChatRooms(socket);
      this.removeMember(socket, userData);
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
    socket.on("channelDetails:joinScope", (channelId: string, scopeId: string) => {
      // #region Валидация
      const channel = this._channelsDetailsStore.get(channelId);
      if (!channel) {
        console.warn(
          `[ChannelDetailsRemoteStore]:socketHandler:(channelDetails:joinScope): no channel with id: ${channelId}`,
        );
        return;
      }
      // скоп должен быть в канале
      if (!channel.scopes.has(scopeId)) {
        console.warn(
          `[ChannelDetailsRemoteStore]:socketHandler:(channelDetails:joinScope): no scope ${scopeId} in channel ${channelId}`,
        );
        return;
      }
      // юзер должен быть в канале
      if (userData.currentChannel !== channelId) {
        console.warn(
          `[ChannelDetailsRemoteStore]:socketHandler:(channelDetails:joinScope): user ${userData.user.name} isn't in the channel with id: ${channelId}`,
        );
        return;
      }
      // #endregion
      this._channelsDetailsStore.addMemberInScope({
        channelId,
        scopeId,
        memberId: userData.user.id,
      });
    });
    socket.on("channelDetails:leaveScope", (channelId: string, scopeId: string) => {
      // #region Валидация
      const channel = this._channelsDetailsStore.get(channelId);
      if (!channel) {
        console.warn(
          `[ChannelDetailsRemoteStore]:socketHandler:(channelDetails:leaveScope): no channel with id: ${channelId}`,
        );
        return;
      }
      // скоп должен быть в канале
      if (!channel.scopes.has(scopeId)) {
        console.warn(
          `[ChannelDetailsRemoteStore]:socketHandler:(channelDetails:leaveScope): no scope ${scopeId} in channel ${channelId}`,
        );
        return;
      }
      // юзер должен быть в канале
      if (userData.currentChannel !== channelId) {
        console.warn(
          `[ChannelDetailsRemoteStore]:socketHandler:(channelDetails:leaveScope): user ${userData.user.name} isn't in the channel with id: ${channelId}`,
        );
        return;
      }
      // #endregion
      this._channelsDetailsStore.removeMemberFromScope({
        memberId: userData.user.id,
        channelId,
        scopeId,
      });
    });
    socket.on("disconnect", () => {
      if (!userData.currentChannel) return;
      this.removeMember(socket, userData);
    });
  }

  private removeMember(socket: Socket, userData: UserData) {
    const currentChannel = userData.currentChannel;
    userData.currentChannel = undefined;

    this._channelsDetailsStore.removeMember({
      channelId: currentChannel,
      memberId: userData.user.id,
    });
    this._emitter.emit("memberLeft", socket, {
      channelId: currentChannel,
      userData,
      chatRoom: this.getChannelRoomName(currentChannel),
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
