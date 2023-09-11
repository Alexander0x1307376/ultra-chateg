import { injectable } from "inversify";
import { EventEmitter } from "../eventEmitter/EventEmitter";
import type { UserData, UserTransfer, UsersRealtimeEvents } from "./userTypes";

/**
 * Хранит всю информацию о состоянии пользователя, находящегося онлайн. Испускает события при изменении данных
 */
@injectable()
export class UsersRealtimeService {
  constructor(
    private store: Map<number, UserData>,
    public emitter: EventEmitter<UsersRealtimeEvents>,
  ) {}

  getUser(userId: number): UserData {
    return this.store.get(userId);
  }

  addUser(socketId: string, user: UserTransfer): UserData {
    const data: UserData = { user, socketId };
    this.store.set(user.id, data);
    this.emitter.emit("userAdded", data);
    return data;
  }

  removeUser(userId: number): UserData | undefined {
    const user = this.store.get(userId);
    if (user) {
      this.store.delete(userId);
      this.emitter.emit("userRemoved", user);
    }
    return user;
  }

  setChannel(userId: number, channelId: string): UserData | undefined {
    const user = this.store.get(userId);
    if (user) {
      user.currentChannel = channelId;
      this.emitter.emit("userUpdated", user);
    }
    return user;
  }

  clearChannel(userId: number): UserData | undefined {
    const user = this.store.get(userId);
    if (user) {
      user.currentChannel = undefined;
      this.emitter.emit("userUpdated", user);
    }
    return user;
  }

  getTransferObjectList(): UserTransfer[] {
    const list: UserTransfer[] = Array.from(this.store, ([_, userData]) => userData.user);
    return list;
  }
}
