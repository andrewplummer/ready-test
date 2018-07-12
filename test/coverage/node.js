'use strict';
var execSync = require('child_process').execSync;

function run(cmd) {
  try {
    execSync(cmd);
  } catch(err) {
    // Do nothing
  }
}

console.info('Running all tests...');

run('./node_modules/nyc/bin/nyc.js bin/readytest -r test/index.js');
run('./node_modules/nyc/bin/nyc.js bin/readytest --no-globals test/tests/standalone/import.js');
run('./node_modules/nyc/bin/nyc.js bin/readytest --no-globals test/tests/standalone/require.js');
run('./node_modules/nyc/bin/nyc.js bin/readytest test/tests/standalone/utils.js');
run('./node_modules/nyc/bin/nyc.js bin/readytest test/tests/standalone/focused-suite.js');
run('./node_modules/nyc/bin/nyc.js bin/readytest test/tests/standalone/focused-test.js');
run('./node_modules/nyc/bin/nyc.js bin/readytest test/tests/standalone/empty.js');
run('./node_modules/nyc/bin/nyc.js bin/readytest -f top test/tests/suites.js');
run('./node_modules/nyc/bin/nyc.js bin/readytest -f none test/tests/suites.js');
run('./node_modules/nyc/bin/nyc.js bin/readytest test/tests/standalone/failure-suite.js');
run('./node_modules/nyc/bin/nyc.js bin/readytest test/tests/standalone/failure-test.js');

// Absolute paths to relative
var path = process.cwd().replace(/\//g, '\\/');
run(`sed -i '' -e "s/${path}\\///g" .nyc_output/*`);
