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

    describe('Nested', function() {

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

  });

  describe('Order', function() {

    var values;
    var previousValues;

    function onSuiteStart() {
      values = [];
    }

    function onSuiteEnd() {
      previousValues = values;
      values = null;
    }

    function push(arg) {
      return function() {
        values.push(arg);
      };
    }

    beforeAll(onSuiteStart);

    beforeAll(push('Outer beforeAll 1'));
    beforeAll(push('Outer beforeAll 2'));
    beforeEach(push('Outer beforeEach 1'));
    beforeEach(push('Outer beforeEach 2'));

    afterEach(push('Outer afterEach 1'));
    afterEach(push('Outer afterEach 2'));
    afterAll(push('Outer afterAll 1'));
    afterAll(push('Outer afterAll 2'));

    afterAll(onSuiteEnd);

    describe('Nested', function() {

      var testRan = false;

      beforeAll(push('Inner beforeAll 1'));
      beforeAll(push('Inner beforeAll 2'));
      beforeEach(push('Inner beforeEach 1'));
      beforeEach(push('Inner beforeEach 2'));

      afterAll(push('Inner afterAll 1'));
      afterAll(push('Inner afterAll 2'));
      afterEach(push('Inner afterEach 1'));
      afterEach(push('Inner afterEach 2'));

      var expectedBeforeAll = [
        'Outer beforeAll 1',
        'Outer beforeAll 2',
        'Inner beforeAll 1',
        'Inner beforeAll 2'
      ];

      var expectedBeforeEach = [
        'Outer beforeEach 1',
        'Outer beforeEach 2',
        'Inner beforeEach 1',
        'Inner beforeEach 2'
      ];

      var expectedAfterAll = [
        'Inner afterAll 1',
        'Inner afterAll 2',
        'Outer afterAll 1',
        'Outer afterAll 2'
      ];

      var expectedAfterEach = [
        'Inner afterEach 1',
        'Inner afterEach 2',
        'Outer afterEach 1',
        'Outer afterEach 2'
      ];

      function assertPreviousRun() {
        var expected = [].concat(
          expectedBeforeAll,
          expectedBeforeEach,
          expectedAfterEach,
          expectedBeforeEach,
          expectedAfterEach,
          expectedAfterAll
        );
        assertArrayEqual(previousValues, expected);
      }

      function assertCurrentRun() {
        var expected = expectedBeforeAll.concat(expectedBeforeEach);
        if (testRan) {
          expected = expected.concat(expectedAfterEach);
          expected = expected.concat(expectedBeforeEach);
        }
        assertArrayEqual(values, expected);
        // Don't add more tests!
        testRan = !testRan;
      }

      function assertHelperOrder() {
        if (previousValues) {
          assertPreviousRun();
        }
        assertCurrentRun();
      }

      it('should have executed helpers in correct order', assertHelperOrder);
      it('should not get confused by multiple runs', assertHelperOrder);

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
