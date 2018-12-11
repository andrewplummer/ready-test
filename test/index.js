'use strict';

// Required for config tests
global.ReadyTest = require('../ready-test');

// Helpers
require('./helpers/functions');
require('./helpers/custom');
require('./helpers/object');
require('./helpers/class');
require('./helpers/array');
require('./helpers/perf');

// Tests
require('./tests/pass');
require('./tests/fail');
require('./tests/config');
require('./tests/errors');
require('./tests/suite');
require('./tests/helpers');
require('./tests/utils');
require('./tests/perf');

// Node specific usage
require('./tests/modules');
require('./tests/requires');
