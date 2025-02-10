## Overview

1. **Frontend (Svelte App)**
    - Displays assignments and allows users to write & submit Python code.
    - Shows real-time grading updates via WebSockets.

2. **Backend (Programming API - Deno)**
   - Receives submissions via `/api/submit`.
   - Stores submissions in the database and publishing them to a queue for grading.
   - Listens for grading results at the `/api/result` endpoint, update the submissions database, and notifies the correct user via WebSockets. The client must be the one to initiate the WebSocket connection. 

3. **Grader**
   - Multiple grader instances consume submissions from the queue.
   - Runs the submitted code against provided test code.
   - Stores grading results and publishes them back to a result queue.

4. **Redis for Queuing & Caching**
   - Redis Streams manages and balances submission distribution across multiple graders.
   - Caching optimizations ensure faster retrieval of assignment handouts and duplicate submissions.

### **End-to-End Flow**

1. User submits a solution -> API queues it for grading.
2. A grader reads from the grading queue and processes the submission -> Publishes the result queue.
3. API reads from the result queue -> Sends it to the correct user.
4. If incorrect -> User sees errors & can resubmit.
5. If correct -> User gets 100 more points if assignment has not been completed before and may move to the next assignment.

## Improvements
 - Enable parallel processing of the submissions.
 - Design smarter cache invalidation rules. Right now the assignment handouts are simply cached as they were received. Whenever a submission has been created or updated, everything in the cache is cleaned. This is necessary for keeping the submissions data up-to-date, but if the assignment handouts rarely changes, those can be invalidated less often. 
 - Conduct more detailed performance tests to analyze the performance bottlenecks of the applcation.
 - If there is an error preventing a submission from a user to be processed by the grading, leaving the submission entry in the database as "pending," the UI would not allow the user to submit anything else. In the future, the application should be improved to handle such special cases. 