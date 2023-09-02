<script lang="ts">
  import type { PageData } from './$types';
  import Login from "$lib/pages/Login.svelte";

  export let data: PageData;

  const authData = data.core.authStore;
  const login = data.core.authQueryService.login;

</script>

<Login authData={$authData} {login} />
