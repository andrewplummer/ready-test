'use strict';

describe('Passing nested suites', function() {

  describe('#indexOf', function() {

    it('should find an existing element index', function() {
      assertEqual([1].indexOf(1), 0);
    });

    it('should not find a missing element index', function() {
      assertEqual([1].indexOf(2), -1);
    });

  });

  describe('#pop', function() {

    it('should return top element', function() {
      assertEqual([1, 2].pop(), 2);
    });

    it('should return undefined when empty', function() {
      assertEqual([].pop(), undefined);
    });

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

xdescribe('Should skip suite', function() {});

describe('Should warn when no tests', function() {});

describe('Should warn when no assertions', function() {
  it('should warn', function() {});
});

describe('Deep nested suites', function() {

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

describe('Async in describe', function() {
  return wait(function() {

    describe('Nested async in describe', function() {
      return wait(function() {

        it('Should run test in nested async describe blocks', function() {
          return wait(function() {
            assert(1,1);
          });
        });

      });
    });

  });

});

describe('Suite helpers', function() {

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

  it('Should have run setup', function() {
    assert(val, 3);
  });

  it('Should have run teardown', function() {
    assert(val, 3);
  });

});

describe('Suite helpers async', function() {

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


  it('Should have run async setup', function() {
    assert(val, 2);
  });

  it('Should have run async teardown', function() {
    assert(val, 2);
  });

});
