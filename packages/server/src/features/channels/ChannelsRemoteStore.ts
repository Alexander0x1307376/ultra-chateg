import { Socket, Server } from "socket.io";
import { ISocketHandler } from "../webSockets/ISocketHandler";
import { UserData } from "../users/userTypes";
import { nanoid } from "nanoid";

export type Channel = {
  id: string;
  name: string;
  ownerId: number;
};

export type CreateChannelInput = {
  name: string;
};

export type Response = {
  status: "ok" | "error";
  message?: string;
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
  set: (data: Channel[]) => void;
  remove: (ids: string[]) => void;
  update: (data: Channel[]) => void;
};

export class ChannelsRemoteStore implements ISocketHandler {
  private readonly CHANNEL_CHATROOM = "channels";

  private _channels: Channel[];
  private _socketServer: Server<ClientToServerEvents, ServerToClientEvents>;

  constructor(socketServer: Server) {
    this._channels = [];
    this._socketServer = socketServer;
    this.socketHandler = this.socketHandler.bind(this);
    this.updateChannels = this.updateChannels.bind(this);
    this.removeChannels = this.removeChannels.bind(this);
    this.init = this.init.bind(this);
  }

  socketHandler(socket: Socket<ClientToServerEvents, ServerToClientEvents>, userData: UserData) {
    socket.on("channels:subscribe", () => {
      console.log("[ChannelsRemoteStore]: subscribed", this._channels);
      socket.join(this.CHANNEL_CHATROOM);
      socket.emit("set", this._channels);
    });
    socket.on("channels:unsubscribe", () => {
      console.log("[ChannelsRemoteStore]: unsubscribe");
      socket.leave(this.CHANNEL_CHATROOM);
    });
    socket.on("channels:createChannel", (channelInput, response) => {
      console.log("createChannel", channelInput);
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
    this._socketServer.in(this.CHANNEL_CHATROOM).emit("update", channels);
  }

  removeChannels(ids: string[]) {
    const updatedChannels = [...this._channels].filter((item) => !ids.includes(item.id));
    this._channels = updatedChannels;
    this._socketServer.in(this.CHANNEL_CHATROOM).emit("remove", ids);
  }

  init() {
    //
  }
}
