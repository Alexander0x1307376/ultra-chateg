import { Socket } from "socket.io";
import { UserData } from "../users/userTypes";

export interface ISocketHandler {
  socketHandler: (socket: Socket, userData: UserData) => void;
}
