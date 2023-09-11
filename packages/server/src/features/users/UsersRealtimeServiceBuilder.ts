import { EventEmitter } from "../eventEmitter/EventEmitter";
import { UsersRealtimeService } from "./UsersRealtimeService";
import { UserData, UsersRealtimeEvents } from "./userTypes";

export class UsersRealtimeServiceBuilder {
  static build() {
    const usersStore = new Map<number, UserData>();
    const usersEmitter = new EventEmitter<UsersRealtimeEvents>();
    const usersRealtimeService = new UsersRealtimeService(usersStore, usersEmitter);
    return {
      usersStore,
      usersEmitter,
      usersRealtimeService,
    };
  }
}
