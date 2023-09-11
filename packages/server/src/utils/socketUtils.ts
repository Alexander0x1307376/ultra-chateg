import { Socket } from "socket.io";

const CHAT_ROOM_PREFIX = "room_";
const GROUP_PREFIX = "group_";
const OBSERVE_USER_PREFIX = "userObserve_";

export const getChatRoomName = (channelUuid: string) => CHAT_ROOM_PREFIX + channelUuid;

export const getGroupRoomName = (channelUuid: string) => GROUP_PREFIX + channelUuid;

export const getObserveUserRoomName = (userUuid: string) => OBSERVE_USER_PREFIX + userUuid;

export const isSocketInRoom = (socket: Socket, room: string) => socket.rooms.has(room);

export const getSocketChannels = (socket: Socket) => getRoomsByPrefix(socket, CHAT_ROOM_PREFIX);

export const getSocketGroups = (socket: Socket) => getRoomsByPrefix(socket, GROUP_PREFIX);

const getRoomsByPrefix = (socket: Socket, prefix: string) => {
  const result: string[] = [];
  for (let [key, val] of socket.rooms) {
    if (val.substring(0, prefix.length) === prefix) result.push(val);
  }
  return result;
};

export const leaveAllChatRooms = (socket: Socket) => {
  socket.rooms.forEach((val) => {
    if (val.includes(CHAT_ROOM_PREFIX)) {
      socket.leave(val);
    }
  });
};

export const joinChatRoom = (socket: Socket, roomUuid: string) => {
  socket.join(getChatRoomName(roomUuid));
};

export const switchChatRoom = (socket: Socket, roomUuid: string) => {
  leaveAllChatRooms(socket);
  joinChatRoom(socket, roomUuid);
};

export const joinGroupRoom = (socket: Socket, groupUuid: string) => {
  socket.join(getGroupRoomName(groupUuid));
};

export const leaveGroupRoom = (socket: Socket, groupUuid: string) => {
  socket.leave(getGroupRoomName(groupUuid));
};

export const leaveChatRoom = (socket: Socket, channelUuid: string) => {
  socket.leave(getChatRoomName(channelUuid));
};

export const observeUser = (socket: Socket, userUuid: string) => {
  socket.join(getObserveUserRoomName(userUuid));
};

export const unobserveUser = (socket: Socket, userUuid: string) => {
  socket.leave(getObserveUserRoomName(userUuid));
};
