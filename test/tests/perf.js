'use strict';

pdescribe('Should analyze all perf tests', function() {

  it('should be average', function() {
    runPerfTest(100);
    assert(1, 1);
  });

  it('should be very fast', function() {
    runPerfTest(1);
    assert(1, 1);
  });

  it('should be slow', function() {
    runPerfTest(1000);
    assert(1, 1);
  });

  it('should be very slow', function() {
    runPerfTest(2000);
    assert(1, 1);
  });

  it('should be fast', function() {
    runPerfTest(50);
    assert(1, 1);
  });

});

describe('Should analyze specific perf tests', function() {

  pit('should be fast', function() {
    runPerfTest(10);
    assert(1, 1);
  });

  pit('should be slow', function() {
    runPerfTest(1000);
    assert(1, 1);
  });

  it('should be average', function() {
    runPerfTest(100);
    assert(1, 1);
  });

  pit('should be very fast', function() {
    runPerfTest(1);
    assert(1, 1);
  });

  it('should be very slow', function() {
    runPerfTest(2000);
    assert(1, 1);
  });

  xpit('should be skipped', function() {
    runPerfTest(1000);
    assert(1, 1);
  });

});

pdescribe('Should not display warnings when perf tests run only', function() {

  it('should be fast', function() {
    runPerfTest(10);
  });

  it('should be slow', function() {
    runPerfTest(1000);
  });

  it('should be average', function() {
    runPerfTest(100);
  });

});

pdescribe('Should run perf tests deeply nested', function() {

  describe('inner perf suite', function() {

    it('should be fast', function() {
      runPerfTest(10);
    });

    it('should be slow', function() {
      runPerfTest(1000);
    });

    it('should be average', function() {
      runPerfTest(100);
    });

  });

});

xpdescribe('Should skip perf suite', function() {
});
