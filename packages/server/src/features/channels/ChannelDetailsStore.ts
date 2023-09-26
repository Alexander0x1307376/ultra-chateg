import { nanoid } from "nanoid";
import { EventEmitter } from "../eventEmitter/EventEmitter";
import { channelDataToTransfer } from "./channelUtils";
import { ChannelsRemoteStore, ChannelsRemoteStoreEvents } from "./ChannelsRemoteStore";
import { UsersRealtimeService } from "../users/UsersRealtimeService";
import { UserTransfer } from "../users/userTypes";

export type User = {
  id: number;
  name: string;
  avaUrl?: string;
};

export type Scope = {
  id: string;
  name: string;
  members: Set<number>;
};

export type ChannelDetails = {
  id: string;
  name: string;
  ownerId: number;
  members: Map<number, User>;
  scopes: Map<string, Scope>;
};

export type CreateChannelInput = {
  name: string;
  ownerId: number;
};

export type CreateScopeInput = {
  name: string;
  channelId: string;
};

export type RemoveScopeInput = {
  scopeId: string;
  channelId: string;
};

export type AddScopeMemberInput = {
  scopeId: string;
  channelId: string;
  memberId: number;
};

export type RemoveScopeMemberInput = {
  memberId: number;
  channelId: string;
  scopeId: string;
};

export type AddMemberInput = {
  channelId: string;
  member: User;
};

export type RemoveMemberInput = {
  memberId: number;
  channelId: string;
};

export type ScopeTransfer = {
  id: string;
  name: string;
  members: number[];
};

export type ChannelDetailsTransfer = {
  id: string;
  name: string;
  ownerId: number;
  members: UserTransfer[];
  scopes: ScopeTransfer[];
};

export type StoreEvents = {
  channelCreated: (channel: ChannelDetailsTransfer) => void;
  channelUpdated: (channel: ChannelDetailsTransfer) => void;
  channelRemoved: (channel: ChannelDetailsTransfer) => void;
};

export class ChannelDetailsStore {
  private _channels: Map<string, ChannelDetails>;
  private _emitter: EventEmitter<StoreEvents>;
  private _channelListEmitter: EventEmitter<ChannelsRemoteStoreEvents>;
  private _usersOnlineStore: UsersRealtimeService;
  get emitter() {
    return this._emitter;
  }
  constructor(channelsStore: ChannelsRemoteStore, usersOnlineStore: UsersRealtimeService) {
    this._emitter = new EventEmitter();
    this._channels = new Map();
    this._channelListEmitter = channelsStore.emitter;
    this._usersOnlineStore = usersOnlineStore;

    this.get = this.get.bind(this);
    this.addChannel = this.addChannel.bind(this);
    this.removeChannel = this.removeChannel.bind(this);
    this.addScope = this.addScope.bind(this);
    this.removeScope = this.removeScope.bind(this);
    this.addMemberInScope = this.addMemberInScope.bind(this);
    this.removeMemberFromScope = this.removeMemberFromScope.bind(this);
    this.handleChannelStoreEvents = this.handleChannelStoreEvents.bind(this);
    this.removeMember = this.removeMember.bind(this);

    this.handleChannelStoreEvents();
  }

  private handleChannelStoreEvents() {
    const emitter = this._channelListEmitter;
    emitter.on("updated", (channels) => {
      // создать каналы
      channels.forEach((channel) => {
        const updatingChannel = this._channels.get(channel.id);
        if (!updatingChannel) {
          this._channels.set(channel.id, {
            id: channel.id,
            name: channel.name,
            ownerId: channel.ownerId,
            members: new Map(),
            scopes: new Map(),
          });
        }
      });
    });
    emitter.on("removed", (channelIds) => {
      channelIds.forEach((id) => {
        this._channels.delete(id);
      });
    });
  }

  get(channelId: string) {
    return this._channels.get(channelId);
  }

  updateChannel(input: ChannelDetailsTransfer) {
    const { members, name, ownerId, scopes } = input;

    const channel = this._channels.get(input.id);
    if (!channel) {
      console.warn(`[ChannelDetailsStore]:updateChannel: no channel with id: ${input.id}`);
      return;
    }
    channel.name = name;
    channel.members = new Map(members.map((item) => [item.id, item]));
    channel.ownerId = ownerId;
    channel.scopes = new Map(
      scopes.map((scope) => [
        scope.id,
        {
          id: scope.id,
          name: scope.name,
          members: new Set(scope.members),
        },
      ]),
    );
    this._emitter.emit("channelUpdated", input);
  }

  addChannel(input: CreateChannelInput) {
    const newChannelId = nanoid();
    const newChannel: ChannelDetails = {
      id: newChannelId,
      name: input.name,
      ownerId: input.ownerId,
      members: new Map(),
      scopes: new Map(),
    };
    this._channels.set(newChannelId, newChannel);
    this._emitter.emit("channelCreated", channelDataToTransfer(newChannel));
  }

  removeChannel(channelId: string) {
    const channel = this._channels.get(channelId);
    if (!channel) {
      console.warn(`[ChannelDetailsStore]:removeChannel: no channel with id: ${channelId}`);
      return;
    }
    this._channels.delete(channelId);
    this._emitter.emit("channelRemoved", channelDataToTransfer(channel));
  }

  addScope(input: CreateScopeInput) {
    const channel = this._channels.get(input.channelId);
    if (!channel) {
      console.warn(`[ChannelDetailsStore]:addScope: no channel with id: ${input.channelId}`);
      return;
    }

    const newScopeId = nanoid();
    channel.scopes.set(newScopeId, {
      id: newScopeId,
      name: input.name,
      members: new Set(),
    });
    this._emitter.emit("channelUpdated", channelDataToTransfer(channel));
  }

  removeScope(input: RemoveScopeInput) {
    const channel = this._channels.get(input.channelId);
    if (!channel) {
      console.warn(`[ChannelDetailsStore]:removeScope: no channel with id: ${input.channelId}`);
      return;
    }
    this._emitter.emit("channelUpdated", channelDataToTransfer(channel));
  }

  addMember(input: AddMemberInput) {
    const channel = this._channels.get(input.channelId);
    if (!channel) {
      console.warn(`[ChannelDetailsStore]:addMember: no channel with id: ${input.channelId}`);
      return;
    }
    channel.members.set(input.member.id, input.member);
    this._emitter.emit("channelUpdated", channelDataToTransfer(channel));
  }

  removeMember(input: RemoveMemberInput) {
    const channel = this._channels.get(input.channelId);
    if (!channel) {
      console.warn(`[ChannelDetailsStore]:removeMember: no channel with id: ${input.channelId}`);
      return;
    }
    // снос из мемберсов
    channel.members.delete(input.memberId);
    // снос из скопов если есть
    channel.scopes.forEach((scope) => {
      scope.members.delete(input.memberId);
    });

    this._emitter.emit("channelUpdated", channelDataToTransfer(channel));
  }

  addMemberInScope(input: AddScopeMemberInput) {
    const channel = this._channels.get(input.channelId);
    if (!channel) {
      console.warn(`[ChannelDetailsStore]:addMemberInScope: no channel with id: ${input.channelId}`);
      return;
    }
    const scope = channel.scopes.get(input.scopeId);
    if (!scope) {
      console.warn(
        `[ChannelDetailsStore]:addMemberInScope: no scope with id: ${input.scopeId} in channel ${input.channelId}`,
      );
      return;
    }
    // scope.members.set(input.member.id, input.member);
    scope.members.add(input.memberId);

    this._emitter.emit("channelUpdated", channelDataToTransfer(channel));
  }

  removeMemberFromScope(input: RemoveScopeMemberInput) {
    const channel = this._channels.get(input.channelId);
    if (!channel) {
      console.warn(`[ChannelDetailsStore]:removeMemberFromScope: no channel with id: ${input.channelId}`);
      return;
    }
    const scope = channel.scopes.get(input.scopeId);
    if (!scope) {
      console.warn(
        `[ChannelDetailsStore]:removeMemberFromScope: no scope with id: ${input.scopeId} in channel ${input.channelId}`,
      );
      return;
    }
    scope.members.delete(input.memberId);
    this._emitter.emit("channelUpdated", channelDataToTransfer(channel));
  }
}
