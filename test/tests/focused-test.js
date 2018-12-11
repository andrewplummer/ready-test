'use strict';

describe('Focused tests', function() {

  fit('should assert inside focused test', function() {
    assert(true);
  });

  fpit('should assert inside focused perf test', function() {
    assert(true);
  });

});
