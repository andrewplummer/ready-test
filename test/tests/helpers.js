'use strict';

describe('Helpers', function() {

  describe('Basic', function() {

    var val = 0;

    function incrementValue() {
      val++;
    }

    function decrementValue() {
      val--;
    }

    beforeAll(incrementValue);
    beforeEach(incrementValue);
    setup(incrementValue);

    teardown(decrementValue);
    afterEach(decrementValue);
    afterAll(decrementValue);

    it('should have run setup', function() {
      assert(val, 3);
    });

    it('should have run teardown', function() {
      assert(val, 3);
    });

    describe('Inside nested suite', function() {

      beforeAll(incrementValue);
      beforeEach(incrementValue);
      setup(incrementValue);

      teardown(decrementValue);
      afterEach(decrementValue);
      afterAll(decrementValue);

      it('should inherit from parent helper blocks', function() {
        assert(val, 6);
      });

      it('should not get confused with multiple nested tests', function() {
        assert(val, 6);
      });

    });

    describe('Helper order', function() {

      beforeEach(function() {
        val *= 2;
      });

      afterEach(function() {
        // Reset to 1 as we need to match the state
        // just after the suite beforeAll ran.
        val = 1;
      });

      it('should execute innermost helper block last', function() {
        assert(val, 6);
      });

      it('should not get confused with multiple nested tests', function() {
        assert(val, 6);
      });

    });

  });

  describe('Async', function() {

    var val = 0;

    function incrementValueAsync() {
      return wait(function() {
        val++;
      });
    }

    function decrementValueAsync() {
      return wait(function() {
        val--;
      });
    }

    beforeAll(incrementValueAsync);
    beforeEach(incrementValueAsync);

    afterAll(decrementValueAsync);
    afterEach(decrementValueAsync);


    it('should have run async setup', function() {
      assert(val, 2);
    });

    it('should have run async teardown', function() {
      assert(val, 2);
    });

  });

});
