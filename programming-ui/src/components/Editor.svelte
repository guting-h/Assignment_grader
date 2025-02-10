<script>
    import { userUuid, currentAssignmentID, getAssignment, fetchScore } from "../stores/stores.js";
    import { writable } from "svelte/store";

    let code = "";
    let evaluationResult = writable({});
    let submissionId = writable("");
    let isPending = writable(false); // controls the submission workflow
    let socket;

    const submitForGrading = async () => {
        let assignmentID = $currentAssignmentID;
        if (code.trim().length == 0) {
            alert("Please write some code before submitting for grading.");
            return;
        }
        if (!assignmentID) {
            alert("No assignment selected.");
            return;
        }
        // prevents submission when previous submission is still being graded
        if ($isPending) {
            alert("Your previous submission is still being graded. Please wait.");
            return;
        }
        isPending.set(true);
        try {
            const response = await fetch("/api/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userUuid: $userUuid, code: code, assgId: assignmentID }),
            });
    
            const responseData = await response.json();

            // handles the case where there's already a submission in grading
            if (!response.ok && response.status === 400) {
                alert(responseData.error); 
                isPending.set(false);
                return;
            }

            evaluationResult.set(responseData);
            submissionId.set(responseData.submissionId);
            console.log(`Submitted submission ${$submissionId}`)

            // if submitted a new solution -> poll for grader result
            if (responseData.status === "pending"){
                conectWS();  
            } else { // submission processed
                isPending.set(false);
            }
            
        } catch(err) {
            console.log(err);
            alert("An unknown error occurred when making a submission ");
            isPending.set(false);
        }
    };

    const conectWS = () => {
        const host = window.location.host;
        socket = new WebSocket('ws://' + host + `/api/result`);

        socket.onopen = () => {
            console.log("WebSocket connected.");
            socket.send(JSON.stringify({submissionId: $submissionId}))
        };
        socket.onmessage = (event) => {
            const result = JSON.parse(event.data);

            evaluationResult.set(result);
            isPending.set(false);
            // update points only if the new submission is correct
            if (result.correct) { 
                fetchScore();
            }
        };

        socket.onerror = (error) => {
            console.error("WebSocket Error:", error);
            socket.close();
        };

        socket.onclose = () => {
            console.log("WebSocket closed.");
        };
    }

    $: feedbackText = (() => {
        let result = $evaluationResult;
        if (!result || !result.grader_feedback) return "";

        // result.correct is a String
        if (result.correct) return "✅ All tests passed!";
        if (!result.correct) return  "❌ Some tests failed." + "\n \n" + result.grader_feedback.replace(/\\n/g, "\n");
        return "Unexpected output.";
    })();
</script>

<!-- text area for entering code -->
<div class="flex flex-col items-center w-full p-4">
    <textarea 
        bind:value={code}
        class="w-full max-w-2xl h-64 p-4 border border-gray-300 rounded-lg shadow-md 
               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
               bg-gray-50 text-gray-800 font-mono"
        placeholder="Write your Python code here..."
    ></textarea>
</div>

<!-- grading button -->
<div class="w-full flex justify-center pr-8">
    <button
        class="font-bold py-2 px-6 rounded-full shadow transition-colors
            flex items-center justify-center gap-2
            { $isPending ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-700' } 
            text-white"
        on:click={submitForGrading}
        disabled={$isPending}
    >
        {#if $isPending}
            <svg aria-hidden="true" role="status" class="inline w-4 h-4 me-3 text-white animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#E5E7EB"/>
                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor"/>
            </svg>
            Grading...
        {:else}
            Submit for grading
        {/if}
    </button>
</div>


<!-- grading result -->
{#if feedbackText}
    <div class="flex items-center justify-center ">
        <div class="flex flex-col items-center w-full max-w-4xl p-6 rounded-lg">
            <pre class="text-gray-700 mt-4 w-full max-w-2xl">{feedbackText}</pre>
        </div>
    </div>
{/if}

{#if $evaluationResult.correct}
    <div class="w-full flex justify-center mt-4">
        <button
            class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-full shadow"
            on:click={() => {getAssignment(); code = ""; evaluationResult.set({})}}
        >
            Next Assignment
        </button>
    </div>
{/if}