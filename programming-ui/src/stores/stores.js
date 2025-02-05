import { readable, writable } from "svelte/store";

export let currentAssignmentID = writable("")
export let activeAssignment = writable({});
let user = localStorage.getItem("userUuid");

if (!user) {
  user = crypto.randomUUID().toString();
  localStorage.setItem("userUuid", user);
} 

if (!currentAssignmentID ) {
  await getAssignment()
}

export const getAssignment = async () => {
    try {
        const response = await fetch(`/api/active-assg?userUuid=${user}`);
        const newAssignment = await response.json();
        
        activeAssignment.set(newAssignment);
        currentAssignmentID.set(newAssignment.id);
        localStorage.setItem("activeAssignment", JSON.stringify(newAssignment));
    } catch (e) {
        console.error("Error fetching assignment:", e);
    }
};

export const userUuid = readable(user);