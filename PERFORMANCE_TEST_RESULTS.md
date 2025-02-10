# Performance tests


## Load assignment page (1 programming-api, 2 grader-api)

```bash
    execution: local
      script: load-assignment.js
      output: -

    scenarios: (100.00%) 1 scenario, 10 max VUs, 40s max duration (incl. graceful stop):
            * default: 10 looping VUs for 10s (gracefulStop: 30s)


    data_received..................: 3.3 MB 330 kB/s
    data_sent......................: 762 kB 75 kB/s
    http_req_blocked...............: avg=5.34µs  min=0s     med=2µs     max=1.59ms p(90)=5µs     p(95)=6µs    
    http_req_connecting............: avg=919ns   min=0s     med=0s      max=877µs  p(90)=0s      p(95)=0s     
    http_req_duration..............: avg=18.55ms min=4.31ms med=11.7ms  max=1.69s  p(90)=23.63ms p(95)=35.13ms
      { expected_response:true }...: avg=18.55ms min=4.31ms med=11.7ms  max=1.69s  p(90)=23.63ms p(95)=35.13ms
    http_req_failed................: 0.00%  0 out of 5403
    http_req_receiving.............: avg=36.84µs min=7µs    med=27µs    max=1.31ms p(90)=69.8µs  p(95)=94µs   
    http_req_sending...............: avg=10.84µs min=2µs    med=7µs     max=1.83ms p(90)=15µs    p(95)=22µs   
    http_req_tls_handshaking.......: avg=0s      min=0s     med=0s      max=0s     p(90)=0s      p(95)=0s     
    http_req_waiting...............: avg=18.5ms  min=4.26ms med=11.65ms max=1.69s  p(90)=23.6ms  p(95)=35.05ms
    http_reqs......................: 5403   533.850551/s
    iteration_duration.............: avg=18.54ms min=4.45ms med=11.84ms max=1.69s  p(90)=23.81ms p(95)=35.8ms 
    iterations.....................: 5403   533.850551/s
    vus............................: 10     min=10        max=10
    vus_max........................: 10     min=10        max=10


  running (10.1s), 00/10 VUs, 5403 complete and 0 interrupted iterations
  default ✓ [======================================] 10 VUs  10s
```

## Posting submissions (1 programming-api, 2 grader-api)

```bash
    execution: local
      script: post-assignment.js
      output: -

    scenarios: (100.00%) 1 scenario, 10 max VUs, 40s max duration (incl. graceful stop):
            * default: 10 looping VUs for 10s (gracefulStop: 30s)


    data_received..................: 2.2 kB 160 B/s
    data_sent......................: 2.1 kB 155 B/s
    http_req_blocked...............: avg=1.86ms  min=935µs  med=2.18ms  max=2.35ms p(90)=2.3ms   p(95)=2.32ms  
    http_req_connecting............: avg=679.4µs min=411µs  med=501µs   max=1.12ms p(90)=1.07ms  p(95)=1.09ms  
    http_req_duration..............: avg=13.35s  min=11.86s med=13.52s  max=13.52s p(90)=13.52s  p(95)=13.52s  
      { expected_response:true }...: avg=13.35s  min=11.86s med=13.52s  max=13.52s p(90)=13.52s  p(95)=13.52s  
    http_req_failed................: 0.00%  0 out of 10
    http_req_receiving.............: avg=85.6µs  min=28µs   med=84.99µs max=206µs  p(90)=112.4µs p(95)=159.19µs
    http_req_sending...............: avg=881.3µs min=338µs  med=891.5µs max=1.19ms p(90)=1.13ms  p(95)=1.16ms  
    http_req_tls_handshaking.......: avg=0s      min=0s     med=0s      max=0s     p(90)=0s      p(95)=0s      
    http_req_waiting...............: avg=13.35s  min=11.86s med=13.52s  max=13.52s p(90)=13.52s  p(95)=13.52s  
    http_reqs......................: 10     0.738829/s
    iteration_duration.............: avg=13.36s  min=11.87s med=13.53s  max=13.53s p(90)=13.53s  p(95)=13.53s  
    iterations.....................: 10     0.738829/s
    vus............................: 9      min=9       max=10
    vus_max........................: 10     min=10      max=10


  running (13.5s), 00/10 VUs, 10 complete and 0 interrupted iterations
  default ✓ [======================================] 10 VUs  10s
```

## Summary
The performance tests indicate that loading assignments is highly efficient, with an average request time of 18.55ms, successfully processing 5,403 requests in 10 seconds without any failures. In contrast, submitting assignments shows significant delays, averaging 13.35 seconds per request, with some taking over 13.5 seconds to complete. These delays suggest potential bottlenecks in database writes, inefficient queue processing, or grader-api resource contention.

Caching does not help with posting assignments in this case, since each request posts a unique submission that causes the db to update and cache flushed. This might even cause additional overhead since the cache now needs to be flushed on every request.