'use strict';

// Required for helper tests
global.ReadyTest = require('../ready-test');

require('./helpers/function');
require('./helpers/custom');
require('./helpers/object');
require('./helpers/async');
require('./helpers/class');
require('./helpers/array');
require('./helpers/error');
require('./helpers/perf');

require('./tests/assertions');
require('./tests/failures');
require('./tests/suites');
require('./tests/config');
require('./tests/errors');
require('./tests/utils');
require('./tests/perf');
