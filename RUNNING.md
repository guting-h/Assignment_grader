# Running the Application

## Prerequisite
Navigate to the grader-image directory and build the grader image:

```bash
docker build -t grader-image .
```

## Development Environment

Start the application with:
```bash
docker compose up
```

## Production Evironment

Start the application with:
```bash
docker compose -f docker-compose.prod.yml up        
```
## Testing

### playwright tests:
1. Make sure the application is up and running (e.g. with `docker compose up`)
2. Run all the tests with 
    ```bash
    docker compose run --rm --entrypoint=npx e2e-playwright playwright test
    ```
    You may have to update the browsers with
    ```
    npx playwright install
    ```

Note: fetching an active assignment occassionally can be slow, causing some of the tests to fail.

### k6 tests:
1. Make sure the application is up and running (e.g. with `docker compose up`)
2. Run `k6 run {test-file-name}.js` from the k6 directory