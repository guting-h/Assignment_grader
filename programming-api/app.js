import * as programmingAssignmentService from "./services/programmingAssignmentService.js";
import { serve } from "./deps.js";

// fetches all assignments
const handleGetAssginments = async (request) => {
  const programmingAssignments = await programmingAssignmentService.findAll();
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
    const result = await programmingAssignmentService.findIncompleteAssignment(userUuid);

    if (result.length > 0) {
      return Response.json(result[0]);
    }

    // otherwise choose a random assignment to return
    const allAssignments = await programmingAssignmentService.findAll();

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
    const result = await programmingAssignmentService.findSubmissionByUser(userUuid);
    return Response.json(result);
  } catch (error) {
    console.log(error);
    return new Response("Invalid request", { status: 400 });
  }
  
}

const handleGrading = async (request) => {
  // if not, grade the submission
  const { socket, response } = Deno.upgradeWebSocket(request);
  console.log("Starting websocket")

  socket.onopen = async () => {
    console.log("WebSocket connected");
  } 

  socket.onmessage = async (event) => {
    const requestData = JSON.parse(event.data);
    const code = requestData.code;
    const userUuid = requestData.user;
    const assgId = requestData.assignmentID;

    // check if there's already an identical submission with grading completed
    const matchingSubmission = await programmingAssignmentService.findMatchingSubmission(userUuid, assgId, code);
    
    // submissions that are not fully processed does not count
    if (matchingSubmission.length > 0 && matchingSubmission[0].status === "processed") {
      console.log("Identical submission found");
      socket.send(JSON.stringify({ 
        grader_feedback: matchingSubmission[0].grader_feedback,
        correct:  matchingSubmission[0].correct,
        status: matchingSubmission[0].status,
      }));
      socket.close();
      return
    }

    console.log("Sending for grading")
    // insert new row to submissions table
    const newSubmission = await programmingAssignmentService.createSubmission(userUuid, assgId, code);
    const submissionId = newSubmission[0].id;

    // send the submission id to the client
    socket.send(JSON.stringify({ submissionId: submissionId, status: "pending" }));

    // send code to the grader
    // fetch the testcode for the assignment with the given id
    const assignment = await programmingAssignmentService.findById(assgId);
    if (assignment.length === 0) {
      return new Response("Assignment not found", { status: 404 });
    }
    const testCode = assignment[0]["test_code"];

    const data = { testCode, code, };
    // send code for grading
    const graderResponse = await fetch("http://grader-api:7000/", {
      method: "POST",
      headers: { "Content-Type": "application/json",},
      body: JSON.stringify(data),
    });

    // Tests pass if the grader feedback has the text "OK"
    const gradingResult = await graderResponse.json();
    const correctness = gradingResult.result.includes("OK");
    // once grading is done, update db entry
    await programmingAssignmentService.updateSubmission(submissionId, gradingResult.result, correctness);
    // send result to client
    socket.send(JSON.stringify({
      submissionId: submissionId,
      status: "processed",
      grader_feedback: gradingResult.result,
      correct: correctness,
    }))

    socket.close();
  }

  socket.onerror = (err) => console.error("WebSocket error:", err);
  socket.onclose = () => console.log("WebSocket connection closed");

  return response
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
    pattern: new URLPattern({ pathname: "/grade" }),
    fn: handleGrading,
  },
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
