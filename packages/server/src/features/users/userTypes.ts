export type UserTransfer = {
  id: number;
  name: string;
  avaUrl?: string;
};

export type UserData = {
  user: {
    id: number;
    name: string;
    avaUrl?: string;
  };
  currentChannel?: string;
  socketId?: string;
};

export type UsersRealtimeEvents = {
  userAdded: (user: UserData) => void;
  userUpdated: (user: UserData) => void;
  userRemoved: (user: UserData) => void;
};
