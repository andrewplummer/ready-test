'use strict';

var ReadyTest = require('../../../ready-test');
var cancelCallbackRun = false;

ReadyTest.cancel();

ReadyTest.cancel(function() {
  cancelCallbackRun = true;
});

describe('Cancel', function() {
  it('Should do nothing if suite is already running', function() {
    ReadyTest.run();
  });
});

describe('Cancel', function() {
  it('Should have run the cancel callback', function() {
    assertTrue(cancelCallbackRun);
  });
});

describe('Cancelling in the middle of a run', function() {

  beforeEach(function() {
    // Canceling the test here means that we can't randomize!
    ReadyTest.cancel();
  });

  it('Should not be reachable', function() {
    assertTrue(false);
  });
});
