import { Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { UserData } from "../users/userTypes";
import { ISocketHandler } from "../webSockets/ISocketHandler";
import { PAGES } from "./pages";

export type ClientToServerEvents = {
  watch: (watchData: { page: string; params: Record<string, string> }) => void;
};
export type ServerToClientEvents = {
  //
};

export class PageRealtimeService implements ISocketHandler {
  private readonly PAGE_PREFIX = "page_";

  constructor() {
    this.socketHandler = this.socketHandler.bind(this);
    this.joinPageRoom = this.joinPageRoom.bind(this);
    this.leavePageRoom = this.leavePageRoom.bind(this);
  }

  socketHandler(socket: Socket<ClientToServerEvents, ServerToClientEvents>, userData: UserData) {
    socket.on("watch", ({ page, params }) => {
      console.log("WATCH!!!", { page, params });
      if (page === PAGES.MAIN) {
        this.joinPageRoom(socket, page);
      }
      if (page === PAGES.CHANNEL) {
        const { channelId } = params;
        if (channelId) {
          this.joinPageRoom(socket, `${page}:${channelId}`);
        }
      }
    });
  }

  private joinPageRoom(socket: Socket, page: string) {
    // перед входом в комнату страницы - выходим из других комнат страницы
    this.leavePageRoom(socket);
    socket.join(this.PAGE_PREFIX + page);
  }

  private leavePageRoom(socket: Socket) {
    socket.rooms.forEach((val) => {
      if (val.includes(this.PAGE_PREFIX)) {
        socket.leave(val);
      }
    });
  }
}
