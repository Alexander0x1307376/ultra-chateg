export type LoginData = {
	login: string;
	password: string;
	rememberMe: boolean;
};

export type UserAuthData = {
	id: number;
	name: string;
};

export type AuthResponse = {
	userData: UserAuthData;
	accessToken: string;
	refreshToken: string;
};
