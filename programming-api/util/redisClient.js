import { createClient } from "npm:redis";

export const redisClient = createClient({
  url: "redis://redis:6379", 
  pingInterval: 1000, 
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));

await redisClient.connect();