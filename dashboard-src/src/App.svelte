<script>
  import { onMount } from "svelte";
  import { load } from "$lib/data.svelte.js";
  import Shell from "./Shell.svelte";
  onMount(load);
</script>

<Shell />
