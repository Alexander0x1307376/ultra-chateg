import axios from 'axios';
import type { AuthResponse, LoginInput, RegistrationInput } from './types';
import type { AuthDataStore, AuthStore } from './AuthStore';
import type { HttpClient } from '../http/HttpClient';
import type { User } from '$lib/entities/entities';

export class AuthQueryService {
	constructor(
		private httpClient: HttpClient,
		private authSystem: AuthStore,
		private storage: Storage,
		private readonly storageRefreshTokenKey: string
	) {
		this.login = this.login.bind(this);
		this.refresh = this.refresh.bind(this);
		this.register = this.register.bind(this);
	}

	private responseToUserData(responseData: AuthResponse): AuthDataStore {
		const userData: User = { ...responseData.userData, id: responseData.userData.id.toString() };
		const accessToken = responseData.accessToken;
		const refreshToken = responseData.refreshToken;
		return {
			userData,
			accessToken,
			refreshToken
		};
	}

	async register(data: RegistrationInput) {
		const response = await this.httpClient.post<AuthResponse, RegistrationInput>('/register', data);
		const storeData = this.responseToUserData(response.data);
		this.authSystem.set(storeData);
	}

	async login(data: LoginInput) {
		const response = await this.httpClient.post<AuthResponse, LoginInput>('/login', data);
		const storeData = this.responseToUserData(response.data);
		this.authSystem.set(storeData);
	}

	async refresh() {
		const refreshToken = this.storage.getItem(this.storageRefreshTokenKey) || '';
		console.log('[AuthQueryService]: refreshing...');
		if (!refreshToken) {
			console.log("[AuthQueryService]: No refresh token. Refetch won't be executed");
			this.authSystem.clear();
			return false;
		}
		try {
			const refreshResponse = await axios.get<AuthResponse>('/api/refresh', {
				headers: { Authorization: `Bearer ${refreshToken}` }
			});
			console.log(
				'[AuthQueryService]: refreshing sucsess. new refreshToken',
				refreshResponse.data.refreshToken
			);
			const storeData = this.responseToUserData(refreshResponse.data);
			this.authSystem.set(storeData);
			return true;
		} catch (e) {
			this.authSystem.clear();
			console.error('[AuthQueryService]: Unauthorized');
			return false;
		}
	}
}
