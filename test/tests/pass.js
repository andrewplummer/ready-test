'use strict';

describe('Assertions', function() {

  it('assert', function() {
    assert(1);
    assert(0, 0);
    assert(1, 1);
  });

  it('assertEqual', function() {
    assertEqual(0, 0);
    assertEqual(1, 1);
    assertEqual('', '');
    assertEqual('a', 'a');
    assertEqual(true, true);
    assertEqual(false, false);
    assertEqual(null, null);
    assertEqual(undefined, undefined);
    assertEqual(NaN, NaN);
    assertEqual(Infinity, Infinity);
    assertEqual(0.1 + 0.2, 0.3);
    assertEqual(-0.1 + -0.2, -0.3);
  });

  it('assertNotEqual', function() {
    assertNotEqual(0, 1);
    assertNotEqual(0, '1');
    assertNotEqual(1, 0);
    assertNotEqual('1', 0);
    assertNotEqual(true, false);
    assertNotEqual(false, true);
    assertNotEqual(null, undefined);
    assertNotEqual(undefined, null);
    assertNotEqual(NaN, null);
    assertNotEqual(NaN, undefined);
    assertNotEqual(NaN, false);
    assertNotEqual(NaN, '');
    assertNotEqual(Infinity, -Infinity);
    assertNotEqual([], []);
    assertNotEqual({}, {});
    assertNotEqual(0.0000000005, 0.0000000006);
    assertNotEqual(-0.0000000005, -0.0000000006);
  });

  it('assertTrue', function() {
    assertTrue(true);
  });

  it('assertFalse', function() {
    assertFalse(false);
  });

  it('assertTruthy', function() {
    assertTruthy(1);
    assertTruthy('a');
    assertTruthy(true);
    assertTruthy([]);
    assertTruthy({});
  });

  it('assertFalsy', function() {
    assertFalsy(0);
    assertFalsy('');
    assertFalsy(false);
  });

  it('assertError', function() {
    assertError(throwsError);
    assertError(throwsTypeError, TypeError);
  });

  it('assertNoError', function() {
    assertNoError(noop);
    assertNoError(throwsTypeError, RangeError);
  });

  it('assertMatch', function() {
    assertMatch('foo', /foo/);
    assertMatch('foo', /\w+/);
    assertMatch('4', /^\d$/);
    assertMatch(4, /4/);
    assertMatch(null, /null/);
  });

  it('assertNoMatch', function() {
    assertNoMatch('foo', /bar/);
    assertNoMatch(null, /foo/);
  });

  it('assertObjectEqual', function() {
    assertObjectEqual({}, {});
    assertObjectEqual({a:''}, {a:''});
    assertObjectEqual({a:null}, {a:null});
    assertObjectEqual({a:undefined}, {a:undefined});
    assertObjectEqual({a:noop}, {a:noop});
    assertObjectEqual(user1, user1);
    assertObjectEqual(cyclicObjFoo, cyclicObjFoo);
    assertObjectEqual(cyclicObjFoo, cyclicObjFooCopy);
    assertObjectEqual(cyclicObjFooNested, cyclicObjFooNestedCopy);
    assertObjectEqual({a: new Date(2020, 9, 11)}, {a: new Date(2020, 9, 11)});
    assertObjectEqual({a: new Uint8Array([1])}, {a: new Uint8Array([1])});
    assertObjectEqual({a: new Set([1,2,3])}, {a: new Set([1,2,3])});
    assertObjectEqual({a: new Map([[1,2]])}, {a: new Map([[1,2]])});
    // Note: cannot test WeakSet or WeakMap as they are not enumerable
  });

  it('assertArrayEqual', function() {
    assertArrayEqual([], []);
    assertArrayEqual(['a','b','c'], ['a','b','c']);
    assertArrayEqual([1], [1]);
    assertArrayEqual([0], [0]);
    assertArrayEqual([''], ['']);
    assertArrayEqual([NaN], [NaN]);
    assertArrayEqual([null], [null]);
    assertArrayEqual([undefined], [undefined]);
    assertArrayEqual(users, users.concat());
    assertArrayEqual(deepNestedArrayHi, deepNestedArrayHiCopy);
    assertArrayEqual(sparseArray3, sparseArray3Copy);
  });

  it('assertInstanceOf', function() {
    assertInstanceOf(3, Number);
    assertInstanceOf(true, Boolean);
    assertInstanceOf('foo', String);
    assertInstanceOf([], Array);
    assertInstanceOf({}, Object);
    assertInstanceOf(function() {}, Function);
    assertInstanceOf(new Error(), Error);
    assertInstanceOf(new TypeError(), TypeError);
    assertInstanceOf(/foo/, RegExp);
    assertInstanceOf(new Date(), Date);
    assertInstanceOf(Promise.resolve(), Promise);
    assertInstanceOf(new CustomClass(), CustomClass);
  });

  it('assertType', function() {
    assertType(3, 'number');
    assertType('foo', 'string');
    assertType(true, 'boolean');
    assertType({}, 'object');
    assertType(null, 'object')
  });

  it('assertOneOf', function() {
    var obj = {};
    assertOneOf(4, [3,4,5]);
    assertOneOf(0, [0]);
    assertOneOf(obj, [{},obj,{}]);
  });

  it('other assertions', function() {
    assertNull(null);
    assertNaN(NaN);
    assertUndefined(undefined);
    assertDateEqual(new Date(1), new Date(1));
    assertRegExpEqual(/foo/, /foo/);
  });

  it('custom assertions', function() {
    assertNumberEven(2);
    assertObjectsHaveIntersectingKey({foo:'bar'}, {'foo':'baz'});
    assertAllArgumentsEqualLast(1, 1, 1, 1, 1);
    assertHasFooOrBar({foo:1});
    assertHasFooOrBar({bar:1});
  });

  describe('Async', function() {

    function assertAfterWait() {
      return wait(function() {
        assertEqual(5, 5);
      });
    }

    it('should assert after wait 1', assertAfterWait);
    it('should assert after wait 2', assertAfterWait);
    it('should assert after wait 3', assertAfterWait);

    it('should not have an issue with nested promises', function() {
      return wait(function() {
        return wait(function() {
          return wait(function() {
            assertEqual(5, 5);
          });
        });
      });
    });

    it('should catch a rejected promise', function() {
      return Promise.reject()['catch'](function() {
        assert(true);
      });
    });

    it('should assert after a resolved promise', function() {
      return Promise.resolve().then(function() {
        assert(true);
      });
    });

  });

});

