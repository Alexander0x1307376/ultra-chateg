import { Socket, Server } from "socket.io";
import { ISocketHandler } from "../webSockets/ISocketHandler";
import { UserData } from "../users/userTypes";
import { nanoid } from "nanoid";
import { EventEmitter } from "../eventEmitter/EventEmitter";

export type Channel = {
  id: string;
  name: string;
  ownerId: number;
};

export type CreateChannelInput = {
  name: string;
};

export type AckResponse<T> = {
  status: "ok" | "error";
  message?: string;
  data?: T;
};

export type ClientToServerEvents = {
  "channels:subscribe": () => void;
  "channels:unsubscribe": () => void;
  "channels:createChannel": (
    channelInput: CreateChannelInput,
    response: (response: AckResponse<Channel>) => void,
  ) => void;
};
export type ServerToClientEvents = {
  "channels:set": (data: Channel[]) => void;
  "channels:remove": (ids: string[]) => void;
  "channels:update": (data: Channel[]) => void;
};

export type ChannelsRemoteStoreEvents = {
  updated: (data: Channel[]) => void;
  removed: (ids: string[]) => void;
};

export class ChannelsRemoteStore implements ISocketHandler {
  private readonly CHANNEL_CHATROOM = "channels";
  private _channels: Channel[];
  private _socketServer: Server<ClientToServerEvents, ServerToClientEvents>;
  private _emitter: EventEmitter<ChannelsRemoteStoreEvents>;
  get emitter() {
    return this._emitter;
  }

  constructor(socketServer: Server) {
    this._channels = [];
    this._emitter = new EventEmitter();
    this._socketServer = socketServer;
    this.socketHandler = this.socketHandler.bind(this);
    this.updateChannels = this.updateChannels.bind(this);
    this.removeChannels = this.removeChannels.bind(this);
  }

  socketHandler(socket: Socket<ClientToServerEvents, ServerToClientEvents>, userData: UserData) {
    socket.on("channels:subscribe", () => {
      console.log("[ChannelsRemoteStore]: subscribed");
      socket.join(this.CHANNEL_CHATROOM);
      socket.emit("channels:set", this._channels);
    });

    socket.on("channels:unsubscribe", () => {
      console.log("[ChannelsRemoteStore]: unsubscribe");
      socket.leave(this.CHANNEL_CHATROOM);
    });

    socket.on("channels:createChannel", (channelInput, response) => {
      // проверить наличие канала с таким именем
      const isAlreadyExists = this._channels.some((item) => item.name === channelInput.name);
      if (!channelInput.name) {
        response({ status: "error", message: "invalid data" });
        return;
      }
      if (isAlreadyExists) {
        response({ status: "error", message: "channel already exists" });
        return;
      }

      const newChannel = {
        id: nanoid(),
        name: channelInput.name,
        ownerId: userData.user.id,
      };

      this.updateChannels([newChannel]);

      response({ status: "ok", data: newChannel });
    });
  }

  updateChannels(channels: Channel[]) {
    const updatedChannels = [...this._channels];
    // проходим по добавляемым данным, сверяемся с имеющимися данными
    // если id совпадают - заменяем, иначе - пушим в конец
    channels.forEach((upsertItem) => {
      const existingItemIndex = updatedChannels.findIndex((storeItem) => storeItem.id === upsertItem.id);

      if (existingItemIndex !== -1) {
        updatedChannels[existingItemIndex] = upsertItem;
      } else {
        updatedChannels.push(upsertItem);
      }
    });
    this._channels = updatedChannels;
    this._socketServer.in(this.CHANNEL_CHATROOM).emit("channels:update", updatedChannels);
    this._emitter.emit("updated", updatedChannels);
  }

  removeChannels(ids: string[]) {
    const updatedChannels = [...this._channels].filter((item) => !ids.includes(item.id));
    this._channels = updatedChannels;
    this._socketServer.in(this.CHANNEL_CHATROOM).emit("channels:remove", ids);
    this._emitter.emit("removed", ids);
  }
}
