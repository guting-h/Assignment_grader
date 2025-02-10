// import { Buffer } from "npm:buffer";
// import amqp from "npm:amqplib";
// import * as programmingAssignmentService from "./programmingAssignmentService.js";
// import { cachedAssignmentService } from "../util/cacheUtil.js";
// import { redisClient } from "../util/redisClient.js";


// //let connection; // use a common connection

// // export const createMQConnection = async () => {
// //     console.log("Connecting to RabbitMQ...");
// //     if (!connection) {
// //         console.log("Connecting to RabbitMQ...");
// //         connection = await amqp.connect("amqp://rabbitmq");

// //         connection.on("error", (err) => {
// //             console.error("RabbitMQ Connection Error:", err);
// //         });

// //         connection.on("close", () => {
// //             console.error("RabbitMQ Connection Closed. Reconnecting...");
// //             connection = null; // Reset connection so it can be re-established
// //             setTimeout(createMQConnection, 5000);
// //         });
// //     }
// //     const channel = await connection.createChannel();
// //     await channel.assertQueue("grading_queue", { durable: true });
// //     await channel.assertQueue("grading_result", { durable: true });
    
// //     return { connection, channel };
// // }

// /*
//     - consumes submissions from the grading_queue
//     - produces grading results to the grading_result
// */
// const consumeSubmission = async () => {
//     console.log("Waiting for messages from Redis Streams...");
  
//     while (true) {
//       try {
//         // ✅ Read new messages from Redis Stream (blocking call)
//         const messages = await redisClient.xRead(
//           { key: "grading_queue", id: ">" }, // Start from latest unread
//           { BLOCK: 5000 } // Block for 5 seconds
//         );
  
//         if (!messages) continue;
  
//         for (const { message } of messages) {
//           const submissionData = message;
//           console.log(`Processing submission ${submissionData.submissionId}`);
  
//           // Fetch test code
//           const assignment = await cachedAssignmentService.findById(submissionData.assgId);
//           if (!assignment.length) {
//             console.error("Assignment not found!");
//             continue;
//           }
//           const testCode = assignment[0].test_code;
  
//           // Send to grader API
//           const graderResponse = await fetch("http://grader-api:7000/", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ testCode, code: submissionData.code }),
//           });
  
//           const gradingResult = await graderResponse.json();
//           const correctness = gradingResult.result.includes("OK");
  
//           // ✅ Update DB
//           await programmingAssignmentService.updateSubmission(
//             submissionData.submissionId,
//             gradingResult.result,
//             correctness
//           );
  
//           console.log(`Grading complete for ${submissionData.submissionId}`);

//           const channel = `grading_result_${submissionData.userUuid}`;

//           try {
//             await redisClient.xGroupCreate(resultChannel, "grading_consumers", "$", { MKSTREAM: true });
//           } catch (err) {
//             if (!err.message.includes("BUSYGROUP")) {
//               console.error(`Error creating consumer group: ${err}`);
//             }
//           }
  
//           // ✅ Push result to Redis Stream
//           await redisClient.xAdd(resultChannel, "*", {
//             submissionId: submissionData.submissionId,
//             status: "processed",
//             grader_feedback: gradingResult.result,
//             correct: correctness,
//           });
//         }
//       } catch (err) {
//         console.error("Error processing Redis stream:", err);
//       }
//     }
// };
// console.log("HELLO?");
// consumeSubmission();