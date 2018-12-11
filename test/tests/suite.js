'use strict';

describe('Suites', function() {

  describe('Nested', function() {

    it('should find an existing element index', function() {
      assertEqual([1].indexOf(1), 0);
    });

    it('should not find a missing element index', function() {
      assertEqual([1].indexOf(2), -1);
    });

    it('should return top element', function() {
      assertEqual([1, 2].pop(), 2);
    });

    it('should return undefined when empty', function() {
      assertEqual([].pop(), undefined);
    });

  });

  describe('Mixed', function() {

    it('should pass', function() {
      assertTrue(true);
    });

    xit('should skip', function() {
    });

    it('should warn', function() {
    });

    it('should fail', function() {
      assertTrue(false);
    });

    it('should have mixed assertions', function() {
      assertTrue(false);
      assertTrue(true);
      assertTrue(false);
    });

  });

  xdescribe('Skipped suite', function() {});

  describe('Empty suite', function() {});

  describe('Suite with empty tests', function() {
    it('should warn', function() {});
  });

  describe('Deep nested suite', function() {

    describe('Suite 1', function() {

      it('Test 1a', function() {
        assert(true);
      });

      it('Test 1b', function() {
        assert(false);
      });

      describe('Suite 1-1', function() {

        it('Test 1-1a', function() {
          assert(true);
        });

        it('Test 1-1b', function() {
          assert(false);
        });

      });

    });

    describe('Suite 2', function() {

      it('Test 2a', function() {
        assert(true);
      });

      it('Test 2b', function() {
        assert(false);
      });

    });

    it('Test a', function() {
      assert(true);
    });

    it('Test b', function() {
      assert(false);
    });

  });

  describe('Suite with promise returned', function() {
    return wait(function() {

      describe('Nested async in describe', function() {
        return wait(function() {

          it('should run test in nested async describe blocks', function() {
            return wait(function() {
              assert(1,1);
            });
          });

        });
      });

    });

  });

});
