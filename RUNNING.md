# Running the Application

## Prerequisite
Navigate to the grader-image directory and build the grader image:

```bash
docker build -t grader-image .
```

## Development Environment

```bash
docker compose up
```

## Production Evironment

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

### k6 tests:
1. Make sure the application is up and running (e.g. with `docker compose up`)
2. Run `k6 run {test-file-name}.js` from the k6 directory