'use strict';

const { describe, it, assertEqual } = require('../../ready-test');

describe('CommonJS', function() {

  it('should run', function() {
    assertEqual(1, 1);
  });

  it('should run async', function() {
    return wait(function() {
      assertEqual(1, 1);
    });
  });

});
