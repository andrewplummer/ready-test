'use strict';

describe('Performance', function() {

  pdescribe('Suite level', function() {

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

  describe('Test level', function() {

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

    /* istanbul ignore next */
    xpit('should be skipped', function() {
      runPerfTest(1000);
      assert(1, 1);
    });

  });

  pdescribe('Nested', function() {

    describe('Inner suite', function() {

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

  pdescribe('Warnings', function() {

    it('should not display warnings when no assertions', function() {
      runPerfTest(10);
    });

  });


  xpdescribe('Skipped', function() {});

});
