'use strict';

var cancelCallbackRun = false;

// Note the runner is exporting globals,
// so we don't need to require here.
ReadyTest.cancel();

ReadyTest.cancel(function() {
  cancelCallbackRun = true;
});

describe('Cancel', function() {
  it('should do nothing if suite is already running', function() {
    ReadyTest.run();
  });
});

describe('Cancel', function() {
  it('should have run the cancel callback', function() {
    assertTrue(cancelCallbackRun);
  });
});

describe('Cancelling in the middle of a run', function() {

  beforeEach(function() {
    // Canceling the test here means that we can't randomize!
    ReadyTest.cancel();
  });

  it('should not be reachable', function() {
    assertTrue(false);
  });
});
