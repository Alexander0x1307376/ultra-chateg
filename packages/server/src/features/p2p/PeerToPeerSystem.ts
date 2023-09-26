import { Server, Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { UserData } from "../users/userTypes";
import { ISocketHandler } from "../webSockets/ISocketHandler";
import {
  ChannelDetailsRemoteStore,
  MemberJoinedData,
  MemberLeftData,
  RemoteStoreEvents,
} from "../channels/ChannelDetailsRemoteStore";
import { ChannelDetails, ChannelDetailsStore } from "../channels/ChannelDetailsStore";
import { UsersRealtimeService } from "../users/UsersRealtimeService";
import { EventEmitter } from "../eventEmitter/EventEmitter";

export type PeerData = {
  peerId: string;
  userId: number;
  channelId: string;
  createOffer: boolean;
};

export type DisconnectPeerData = {
  peerId: string;
};

export type IceCandidateData = {
  peerId: string;
  userId: number;
  channelId: string;
  iceCandidate: RTCIceCandidate;
};

export type SPDData = {
  peerId: string;
  userId: number;
  channelId: string;
  sessionDescription: RTCSessionDescriptionInit;
};

export type StartPeerConnectionData = {
  channelId: string;
  userId: string;
};

export type ClientToServerEvents = {
  relayICE: (answer: IceCandidateData) => Promise<void> | void;
  relaySDP: (answer: SPDData) => Promise<void> | void;
};

export type ServerToClientEvents = {
  addPeer: (answer: PeerData) => Promise<void> | void;
  removePeer: (peerData: DisconnectPeerData) => Promise<void> | void;
  ICECandidate: (answer: IceCandidateData) => Promise<void> | void;
  sessionDescription: (answer: SPDData) => Promise<void> | void;
};

export class PeerToPeerSystem implements ISocketHandler {
  private _socketServer: Server<ClientToServerEvents, ServerToClientEvents>;
  private _channelDetailsStore: ChannelDetailsStore;
  private _usersRealtimeService: UsersRealtimeService;
  private _channelsMembersEmitter: EventEmitter<RemoteStoreEvents>;

  constructor(
    socketServer: Server<ClientToServerEvents, ServerToClientEvents>,
    channelDetailsStore: ChannelDetailsStore,
    usersRealtimeService: UsersRealtimeService,
    channelDetailsRemoteStore: ChannelDetailsRemoteStore,
  ) {
    this._socketServer = socketServer;
    this._channelDetailsStore = channelDetailsStore;
    this._usersRealtimeService = usersRealtimeService;
    this._channelsMembersEmitter = channelDetailsRemoteStore.emitter;

    this.socketHandler = this.socketHandler.bind(this);
    this.emitToMembersOfChatroom = this.emitToMembersOfChatroom.bind(this);
    this.fromChannelMembersToThisSocket = this.fromChannelMembersToThisSocket.bind(this);

    this.handleUserJoinedChannel = this.handleUserJoinedChannel.bind(this);
    this.handleUserLeftChannel = this.handleUserLeftChannel.bind(this);

    this._channelsMembersEmitter.on("memberJoined", this.handleUserJoinedChannel);
    this._channelsMembersEmitter.on("memberLeft", this.handleUserLeftChannel);
  }

  handleUserJoinedChannel(
    socket: Socket<ClientToServerEvents, ServerToClientEvents>,
    { channel, chatRoom, userData }: MemberJoinedData,
  ) {
    this.emitToMembersOfChatroom(socket, chatRoom, "addPeer", {
      channelId: channel.id,
      peerId: socket.id,
      userId: userData.user.id,
      createOffer: false,
    });
    this.fromChannelMembersToThisSocket(socket, channel, "addPeer", (userData, channelDetails) => [
      {
        peerId: userData.socketId,
        userId: userData.user.id,
        channelId: channelDetails.id,
        createOffer: true,
      },
    ]);
  }
  handleUserLeftChannel(
    socket: Socket<ClientToServerEvents, ServerToClientEvents>,
    { chatRoom, userData }: MemberLeftData,
  ) {
    this._socketServer.in(chatRoom).emit("removePeer", { peerId: socket.id });
  }

  socketHandler(socket: Socket<ClientToServerEvents, ServerToClientEvents>, userData: UserData) {
    socket.on("relayICE", (iceData) => {
      this._socketServer.to(iceData.peerId).emit("ICECandidate", {
        channelId: iceData.channelId,
        peerId: socket.id,
        userId: userData.user.id,
        iceCandidate: iceData.iceCandidate,
      });
    });

    socket.on("relaySDP", (sdpData) => {
      this._socketServer.to(sdpData.peerId).emit("sessionDescription", {
        channelId: sdpData.channelId,
        userId: userData.user.id,
        peerId: socket.id,
        sessionDescription: sdpData.sessionDescription,
      });
    });
  }

  private emitToMembersOfChatroom<Key extends keyof ServerToClientEvents>(
    socket: Socket,
    chatRoomId: string,
    command: Key,
    ...data: Parameters<ServerToClientEvents[Key]>
  ) {
    socket.in(chatRoomId).emit(command, ...data);
  }

  private fromChannelMembersToThisSocket<Key extends keyof ServerToClientEvents>(
    socket: Socket,
    channel: ChannelDetails,
    command: Key,
    callback: (userData: UserData, channelDetails: ChannelDetails) => Parameters<ServerToClientEvents[Key]>,
  ) {
    const usersOnline = this._usersRealtimeService.usersStore;

    const membersUserData: UserData[] = [];
    channel.members.forEach((member) => {
      const memberData = usersOnline.get(member.id);
      memberData && memberData.socketId !== socket.id && membersUserData.push(memberData);
    });

    membersUserData.map((member) => {
      socket.emit(command, ...callback(member, channel));
    });
  }
}
