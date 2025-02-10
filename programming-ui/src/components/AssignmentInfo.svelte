<script>
    import { onMount } from "svelte";
    import { currentAssignmentID, getAssignment, activeAssignment } from "../stores/stores.js";

    onMount(getAssignment);
</script>

<div class="flex flex-col items-center w-full p-6">
    <h3 class="text-2xl font-semibold text-blue-600"  data-testid="assignment-title">
        {$activeAssignment.assignment_order? `Assignment ${$activeAssignment.assignment_order}: ${$activeAssignment.title}`: "Loading..."}
    </h3>
    <p class="text-gray-700 mt-4 text-center w-full max-w-2xl" data-testid="assignment-handout">
        {$activeAssignment.handout || "Fetching assignment details..."}
    </p>
</div>