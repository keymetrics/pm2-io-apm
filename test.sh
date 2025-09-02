

NODE_ENV='test'
MOCHA='npx mocha --config .mocharc.js'

trap "exit" INT
set -e
if command -v bun &> /dev/null; then
  bun run build
else
  npm run build
fi

#### Unit tests

$MOCHA ./test/autoExit.spec.ts
$MOCHA ./test/api.spec.ts
$MOCHA ./test/metrics/http.spec.ts
$MOCHA ./test/metrics/runtime.spec.ts
$MOCHA ./test/entrypoint.spec.ts
# $MOCHA ./test/standalone/tracing.spec.ts
# $MOCHA ./test/standalone/events.spec.ts
$MOCHA ./test/features/events.spec.ts
$MOCHA ./test/features/tracing.spec.ts
$MOCHA ./test/metrics/eventloop.spec.ts
$MOCHA ./test/metrics/network.spec.ts
$MOCHA ./test/metrics/v8.spec.ts
$MOCHA ./test/services/actions.spec.ts
$MOCHA ./test/services/metrics.spec.ts
