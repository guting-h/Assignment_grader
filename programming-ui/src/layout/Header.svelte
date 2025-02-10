<script>
  import { userUuid, score, fetchScore } from "../stores/stores.js";
  import { onMount } from "svelte";
  import { writable } from "svelte/store";

  onMount(fetchScore);
</script>

<nav class="p-4 mb-4 shadow flex justify-between items-center">
  <span class="text-2xl text-gray-700 font-serif">Hello User {$userUuid}!</span>
  <span class="text-xl font-semibold text-blue-600" data-testid="points">Points: {$score}</span>
</nav>
