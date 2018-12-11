'use strict';

const path = require('path');
const { run, open } = require('./helpers');

const outputDir = path.resolve(__dirname, 'output')

console.info('Running all tests...');

run(`rm -rf ${outputDir}`);
run('./node_modules/.bin/nyc bin/readytest -r test/index.js');
run('./node_modules/.bin/nyc bin/readytest -f top test/tests/suite.js');
run('./node_modules/.bin/nyc bin/readytest -f none test/tests/suite.js');
run('./node_modules/.bin/nyc bin/readytest test/tests/canceled-run.js');
run('./node_modules/.bin/nyc bin/readytest test/tests/focused-suite.js');
run('./node_modules/.bin/nyc bin/readytest test/tests/focused-test.js');
run('./node_modules/.bin/nyc bin/readytest test/tests/failure-suite.js');
run('./node_modules/.bin/nyc bin/readytest test/tests/failure-test.js');

// Absolute paths to relative to match browser
const base = process.cwd().replace(/\//g, '\\/');
run(`sed -i '' -e "s/${base}\\///g" ${outputDir}/raw/*`);

console.info('Generating instrumentation...');
run(`./node_modules/.bin/nyc instrument ready-test.js ${outputDir}/instrumented`);
open('./test/coverage/index.html');
console.info('Done! ');
