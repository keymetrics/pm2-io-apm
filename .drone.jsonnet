local pipeline(version) = {
    kind: "pipeline",
    name: "node-v" + version,
    steps: [
        {
            name: "tests",
            image: "node:" + version,
            commands: [
                "node -v",
                "yarn -v",
                "uname -r",
                "yarn install",
                "yarn add express koa mongodb-core mysql mysql2 redis ioredis pg vue vue-server-renderer @pm2/node-runtime-stats v8-profiler-node8",
                "export PATH=$PATH:./node_modules/.bin/",
                "curl -L https://codeclimate.com/downloads/test-reporter/test-reporter-latest-linux-amd64 > ./cc-test-reporter",
                "chmod +x ./cc-test-reporter",
                "./cc-test-reporter before-build",
                "yarn lint",
                "runTest () { if [ \"$NODE_VERSION\" = \"11\" ]; then nyc --clean false --require ts-node/register --require source-map-support/register mocha --exit $*; else mocha --exit --require ts-node/register $*; fi ;}",
                "runTest test/metrics/runtime.spec.ts",
                "runTest test/api.spec.ts",
                "runTest test/autoExit.spec.ts",
                "runTest test/entrypoint.spec.ts",
                "runTest test/standalone/tracing.spec.ts",
                "runTest test/standalone/events.spec.ts",
                "runTest test/features/events.spec.ts",
                "runTest test/features/profiling.spec.ts",
                "runTest test/features/tracing.spec.ts",
                "runTest test/metrics/eventloop.spec.ts",
                // "runTest test/metrics/http.spec.ts",
                "runTest test/metrics/network.spec.ts",
                "runTest test/metrics/v8.spec.ts",
                "runTest test/services/actions.spec.ts",
                "runTest test/services/metrics.spec.ts",
                "runTest src/census/plugins/__tests__/http.spec.ts",
                "runTest src/census/plugins/__tests__/http2.spec.ts",
                "runTest src/census/plugins/__tests__/https.spec.ts",
                "runTest src/census/plugins/__tests__/mongodb.spec.ts",
                "runTest src/census/plugins/__tests__/mysql.spec.ts",
                "runTest src/census/plugins/__tests__/mysql2.spec.ts",
                "runTest src/census/plugins/__tests__/redis.spec.ts",
                "runTest src/census/plugins/__tests__/ioredis.spec.ts",
                "runTest src/census/plugins/__tests__/vue.spec.ts",
                "runTest src/census/plugins/__tests__/pg.spec.ts",
                "runTest src/census/plugins/__tests__/express.spec.ts",
                "runTest src/census/plugins/__tests__/net.spec.ts",
                "nyc report --reporter lcov || echo \"No nyc coverage\"",
                "./cc-test-reporter after-build --exit-code 0 || echo \"Skipping CC coverage upload\" or upload-coverage || echo \"Skipping CC coverage upload\"",
            ],
            environment: {
              NODE_ENV: "test",
              OPENCENSUS_MONGODB_TESTS: "1",
              OPENCENSUS_REDIS_TESTS: "1",
              OPENCENSUS_MYSQL_TESTS: "1",
              OPENCENSUS_PG_TESTS: "1",
              OPENCENSUS_REDIS_HOST: "redis",
              OPENCENSUS_MONGODB_HOST: "mongodb",
              OPENCENSUS_MYSQL_HOST: "mysql",
              OPENCENSUS_PG_HOST: "postgres",
              CC_TEST_REPORTER_ID: {
                from_secret: "code_climate_token"
              },
            },
        },
    ],
    services: [
      {
        name: "mongodb",
        image: "mongo:3.4",
        environment: {
          AUTH: "no"
        },
      },
      {
        name: "redis",
        image: "redis:5",
      },
      {
        name: "mysql",
        image: "mysql:5",
        environment: {
          MYSQL_DATABASE: "test",
          MYSQL_ROOT_PASSWORD: "password"
        },
      },
      {
        name: "postgres",
        image: "postgres:11",
        environment: {
          POSTGRES_DB: "test",
          POSTGRES_PASSWORD: "password"
        },
      },
    ],
    trigger: {
      event: ["push", "pull_request"]
    },
};

[
    pipeline("8"),
    pipeline("10"),
    pipeline("12"),
    pipeline("13"),
    {
        kind: "pipeline",
        name: "build & publish",
        trigger: {
          event: "tag"
        },
        steps: [
          {
            name: "build",
            image: "node:8",
            commands: [
              "export PATH=$PATH:./node_modules/.bin/",
              "yarn 2> /dev/null",
              "mkdir build",
              "yarn run build",
            ],
          },
          {
            name: "publish",
            image: "plugins/npm",
            settings: {
              username: {
                from_secret: "npm_username"
              },
              password: {
                from_secret: "npm_password"
              },
              email: {
                from_secret: "npm_email"
              },
            },
          },
        ],
    },
    {
        kind: "secret",
        name: "npm_username",
        get: {
          path: "secret/drone/npm",
          name: "username",
        },
    },
    {
        kind: "secret",
        name: "npm_email",
        get: {
          path: "secret/drone/npm",
          name: "email",
        },
    },
    {
        kind: "secret",
        name: "npm_password",
        get: {
          path: "secret/drone/npm",
          name: "password",
        },
    },
    {
        kind: "secret",
        name: "code_climate_token",
        get: {
          path: "secret/drone/codeclimate",
          name: "token_apm_node",
        },
    },
]
