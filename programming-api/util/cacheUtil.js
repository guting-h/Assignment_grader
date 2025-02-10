import * as programmingAssignmentService from "../services/programmingAssignmentService.js";
import { redisClient } from "./redisClient.js"

const cacheMethodCalls = (object, methodsToFlushCacheWith = []) => {
    const handler = {
      get: (module, methodName) => {
        const method = module[methodName];
        return async (...methodArgs) => {
          if (methodsToFlushCacheWith.includes(methodName)) {
            //console.log("Flushing cache");
            try {
              const cacheKeys = await redisClient.keys('*');
              // grading_queueu should not be deleted
              for (const key of cacheKeys) {
                if (key !== 'grading_queue') {
                  await redisClient.del(key);
                }
              }
  
            } catch (error) {
              console.error("Error during cache flush:", error.message || error);
            }
            return await method.apply(this, methodArgs);
          }
          
          // Cache the result of the method
          const cacheKey = `${methodName}-${JSON.stringify(methodArgs)}`;
          const cacheResult = await redisClient.get(cacheKey);
          if (!cacheResult) {
            const result = await method.apply(this, methodArgs);
            await redisClient.set(cacheKey, JSON.stringify(result));
            return result;
          }
  
          return JSON.parse(cacheResult);
        };
      },
    };
  
    return new Proxy(object, handler);
};
  
export const cachedAssignmentService = cacheMethodCalls(programmingAssignmentService, ["createSubmission", "updateSubmission"]);