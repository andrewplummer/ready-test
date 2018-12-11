'use strict';

const { run, open } = require('./helpers');

console.info('Generating report...');
run('./node_modules/.bin/nyc report');
open('./test/coverage/output/report/index.html');
console.info('Done!');
