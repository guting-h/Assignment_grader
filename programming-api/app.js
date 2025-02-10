import * as programmingAssignmentService from "./services/programmingAssignmentService.js";
import { serve } from "./deps.js";
import { Buffer } from "npm:buffer";
//import { createMQConnection } from "./services/gradeConsumer.js";
import { cachedAssignmentService } from "./util/cacheUtil.js";
import { redisClient } from "./util/redisClient.js";

// fetches all assignments: not really used in the frontend
const handleGetAssginments = async (request) => {
  const programmingAssignments = await cachedAssignmentService.findAll();
  return Response.json(programmingAssignments);
}

// gets the first incompleted assignment by user
const handleGetActiveAssignment = async (request) => {
  const url = new URL(request.url);
  const userUuid = url.searchParams.get("userUuid");

  if (!userUuid) {
    return Response.json({ error: "User UUID is required" });
  }

  try {
    // try to find an incompleted assignment
    const submissions = await cachedAssignmentService.findSubmissionByUser(userUuid);
    const allAssignments = await cachedAssignmentService.findAll();
    const incompleteAssignments = allAssignments.filter((assignment) => {
      return !submissions.some(
        (submission) => submission.programming_assignment_id === assignment.id && submission.correct === true
      );
    });

    if (incompleteAssignments.length > 0) {
      return Response.json(incompleteAssignments[0]);
    }

    // otherwise choose a random assignment to return
    const randomIndex = Math.floor(Math.random() * allAssignments.length);
    return Response.json(allAssignments[randomIndex]);
    
  } catch (error) {
    console.log(error);
    return new Response("Invalid request", { status: 400 });
  }
}

// get all submissions made by a user
const handleGetSubmissions = async (request) => {
  // fetch only submissions related to a given user
  const url = new URL(request.url);
  const userUuid = url.searchParams.get("userUuid");
  if (!userUuid) {
    return res.status(400).json({ error: "User UUID is required" });
  }

  try {
    const result = await cachedAssignmentService.findSubmissionByUser(userUuid);
    return Response.json(result);
  } catch (error) {
    console.log(error);
    return new Response("Invalid request", { status: 400 });
  }
  
}

const handlePostSubmission = async (request) => {
  const requestData = await request.json();
  const { userUuid, code, assgId } = requestData;

  // if users have submissions that are being graded -> prevent new submission
  const activeSubmission = await programmingAssignmentService.findActiveSubmission(userUuid);
  if (activeSubmission.length > 0) {
    return Response.json(
      { error: "You already have a submission being graded. Please wait." },
      { status: 400 }
    );
  }

  // check for identical submissions -> directly fetch grader result from db
  const matchingSubmission = await cachedAssignmentService.findMatchingSubmission(userUuid, assgId, code);
  if (matchingSubmission.length > 0) {
    return Response.json({ 
      grader_feedback: matchingSubmission[0].grader_feedback,
      correct:  matchingSubmission[0].correct,
      status: matchingSubmission[0].status,
    });
  }

  // insert new row to submissions table
  const newSubmission = await cachedAssignmentService.createSubmission(userUuid, assgId, code);
  const submissionId = newSubmission[0].id;

  // fetch testCode of the assignment
  const assignment = await cachedAssignmentService.findById(assgId);
  if (assignment.length === 0) {
    return new Response("Assignment not found", { status: 404 });
  }
  const testCode = assignment[0]["test_code"];

  // publish to the grading queue
  try {
    await redisClient.xAdd("grading_queue", "*", {
      submissionId: String(submissionId), 
      //userUuid: String(userUuid),         
      code: String(code),
      testCode: String(testCode),                 
      //assgId: String(assgId)            
    });
  } catch(e) {
    console.log("Something happened", e)
  }
  
  // send submissionID back to client if the submission needs grading
  return Response.json({ submissionId: submissionId, status: "pending" })
}

// emits events
const handleGradingResult = async (request) => {
  const { socket, response } = Deno.upgradeWebSocket(request);

  socket.onmessage = async (event) => {
    console.log("MESSAGE RECEIVED")
    try {
      const data = JSON.parse(event.data);
      const resultChannel = `grading_result`;

      console.log(`Listening for results on ${resultChannel}`);

      while (true) {
        const messages = await redisClient.xRead(
          [{ key: resultChannel, id: "0" }],
          { COUNT: 5, BLOCK: 5000 } 
        );

        if (!messages) continue;
        
        for (const { id, message } of messages[0].messages) {
          if (message.submissionId === String(data.submissionId)) {
            // message from the stream are Strings -> convert to boolean
            message.correct = message.correct === "true";

            await cachedAssignmentService.updateSubmission(
              message.submissionId,
              message.grader_feedback,
              message.correct
            );

            console.log(`📩 Sending result for submission: ${data.submissionId}`);
            socket.send(JSON.stringify(message));

            // 🗑️ Optionally delete the processed message to prevent reprocessing
            await redisClient.xDel(resultChannel, id);

            socket.close();
            return;
          }
        }
      }
    } catch (err) {
        console.error("WebSocket message error:", err);
        socket.close();
    }
  };  

  socket.onclose = () => {
    console.log("WebSocket client disconnected.");
  };

  return response;
}

const handleGetUserPoints = async (request) => {
  const url = new URL(request.url);
  const userUuid = url.searchParams.get("userUuid");
  if (!userUuid) {
    return Response.json({ error: "User UUID is required" }, { status: 400 });
  }

  try {
    // all unique completed assignments for the user
    const completedAssignments = await cachedAssignmentService.findUniqueCorrectAssignments(userUuid);

    const totalPoints = completedAssignments.length * 100;

    return Response.json({ points: totalPoints });
  } catch (error) {
    console.error("Error fetching user points:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}


const urlMapping = [
  {
    method: 'GET',
    pattern: new URLPattern({ pathname: "/" }),
    fn: () => new Response("Welcome to Programming Assignement API"),
  },
  {
    method: "GET",
    pattern: new URLPattern({ pathname: "/assg" }),
    fn: handleGetAssginments,
  },
  {
    method: "GET",
    pattern: new URLPattern({ pathname: "/active-assg" }),
    fn: handleGetActiveAssignment,
  },
  {
    method: "GET",
    pattern: new URLPattern({ pathname: "/submissions" }),
    fn: handleGetSubmissions,
  },
  {
    method: "GET",
    pattern: new URLPattern({ pathname: "/result" }),
    fn: handleGradingResult,
  },
  {
    method: "POST",
    pattern: new URLPattern({ pathname: "/submit"}),
    fn: handlePostSubmission
  },
  {
    method: "GET",
    pattern: new URLPattern({ pathname: "/points"}),
    fn: handleGetUserPoints
  }
];

const handleRequest = async (request) => {
  const mapping = urlMapping.find(
    (um) => um.method === request.method && um.pattern.test(request.url)
  );

  if (!mapping) {
    return new Response("Endpoint not found", { status: 404 });
  }

  const mappingResult = mapping.pattern.exec(request.url);
  return await mapping.fn(request, mappingResult);
};

const portConfig = { port: 7777, hostname: "0.0.0.0" };
serve(handleRequest, portConfig);
