import { serve } from "./deps.js";
import { grade } from "./services/gradingService.js";
import { createClient } from "npm:redis";

let state = -1;

const SERVER_ID = crypto.randomUUID();

const redisClient = createClient({
  url: "redis://redis:6379",
  pingInterval: 1000,
});

await redisClient.connect();

const STREAM_NAME = "grading_queue";
const CONSUMER_GROUP = "grading_consumers";

try {
  await redisClient.xGroupCreate(STREAM_NAME, CONSUMER_GROUP, "$", { MKSTREAM: true });
  console.log(`Consumer Group '${CONSUMER_GROUP}' created`);
} catch (err) {
  if (!err.message.includes("BUSYGROUP")) {
    console.error("Error creating consumer group:", err);
  }
}


const getCode = () => {
  state = (state + 1) % 5;

  if (state == 0) {
    return `
def hello():
  return "Hello world!"
`;
  } else if (state == 1) {
    return `
def hello():
  return "hello world!"
    `;
  } else if (state == 2) {
    return `
def ohnoes():
  return "Hello world!"
    `;
  } else if (state == 3) {
    return `
:D
      `;
  } else {
    return `
while True:
  print("Hmmhmm...")
    `;
  }
};

const gradingDemo = async () => {
  let code = getCode();

  const testCode = `
import socket
def guard(*args, **kwargs):
  raise Exception("Internet is bad for you :|")
socket.socket = guard

import unittest
from code import *

class TestHello(unittest.TestCase):

  def test_hello(self):
    self.assertEqual(hello(), "Hello world!", "Function should return 'Hello world!'")

if __name__ == '__main__':
  unittest.main()  
`;

  return await grade(code, testCode);
};

const consumeSubmissions = async () => {
  console.log(`🚀 [${SERVER_ID}] Waiting for submissions from Redis Streams...`);

  while (true) {
    const response = await redisClient.xReadGroup(CONSUMER_GROUP, SERVER_ID, {
      key: STREAM_NAME,
      id: '>', 
      count: 1,
      block: 5000 
    });

    try {
      if (response && response.length > 0) {
        const [streamData] = response;
        const { messages } = streamData;
        const { id, message } = messages[0];

        console.log(`⏳ Processing submission ${message.submissionId}`)
        
        const result = await grade(message.code, message.testCode);
        
        // push to grading result stream
        await redisClient.xAdd("grading_result", "*", {
          submissionId: message.submissionId,
          grader_feedback: result,
          status: "processed",
          correct: String(result.includes("OK"))
        });

        console.log(`Grading complete for submission: ${message.submissionId}`);

        // remove processed submission from stream
        await redisClient.xDel(STREAM_NAME, id);
      }

      if (!response) continue;
    } catch (e) {
      console.log("ERROR reading group", e)
      break
    }
  }
};

console.log(`${SERVER_ID} is running and waiting for submissions...`);

await consumeSubmissions();