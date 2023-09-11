<script lang="ts">
	import { slide } from 'svelte/transition';
	import BlockInCenter from '../components/BlockInCenter.svelte';
	import type { LoginInput } from '../features/auth/types';
	import Icon from '@iconify/svelte';
	import { goto as navigate } from '$app/navigation';
	import type { AuthDataStore } from '$lib/features/auth/AuthStore';

	export let login: (data: LoginInput) => void | Promise<void>;
	export let authData: AuthDataStore;

	const formData: LoginInput = {
		login: '',
		password: '',
		rememberMe: false
	};
	let isErrorDisplayed: boolean = false;

	$: {
		if (authData) {
			navigate('/');
		}
	}

	const handleLogin = () => {
		login(formData);
	};

	const handleCloseError = () => {
		isErrorDisplayed = false;
	};
</script>

<BlockInCenter>
	<div>
		<form
			on:submit|preventDefault={handleLogin}
			class="w-72 rounded-lg bg-slate-600/25 pb-4 shadow-lg shadow-black/50"
		>
			<h2 class="p-4">Вход в систему</h2>
			{#if isErrorDisplayed}
				<aside transition:slide|global class="variant-filled-error">
					<div class="flex items-center">
						<div class="grow p-2">Неверный логин или пароль</div>
						<button on:click={handleCloseError} type="button" class="p-2 text-[1.4rem]">
							<Icon icon="material-symbols:close" />
						</button>
					</div>
				</aside>
			{/if}
			<div class="flex flex-col space-y-3 px-4">
				<label class="label">
					<span>Логин</span>
					<input
						bind:value={formData.login}
						name="login"
						class="input"
						type="text"
						placeholder="логин"
					/>
				</label>
				<label class="label">
					<span>Пароль</span>
					<input
						bind:value={formData.password}
						name="password"
						class="input"
						type="password"
						placeholder="пароль"
					/>
				</label>
				<label class="flex items-center space-x-2">
					<input
						bind:checked={formData.rememberMe}
						name="rememberMe"
						class="checkbox"
						type="checkbox"
					/>
					<p>Запомнить меня</p>
				</label>
			</div>
			<div class="px-4 pt-2">
				<button type="submit" class="btn variant-filled-primary w-full">Вход</button>
			</div>
		</form>
	</div>
</BlockInCenter>
