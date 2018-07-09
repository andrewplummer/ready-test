'use strict';
var exec = require('child_process').execSync;

console.info('Generating browser instrumentation...');
exec('./node_modules/nyc/bin/nyc.js instrument ready-test.js test/coverage/instrumented');
console.info('Done! Open test/coverage/index.html to download browser coverage file');
