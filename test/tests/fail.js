'use strict';

describe('Failing Assertions', function() {

  it('assert', function() {
    assert(null);
    assert(undefined);
    assert(0, 1);
    assert(1, 0);
  });

  it('assertEqual', function() {
    assertEqual(0, 1);
    assertEqual(1, 0);
    assertEqual(1, '1');
    assertEqual('1', 1);
    assertEqual('str', new String('str'));
    assertEqual(new String('str'), 'str');
    assertEqual(8, new Number(8));
    assertEqual(new Number(8), 8);
    assertEqual(true, new Boolean(true));
    assertEqual(new Boolean(true), true);
    assertEqual([], []);
  });

  it('assertNotEqual', function() {
    assertNotEqual(NaN, NaN);
  });

  it('assertTrue', function() {
    assertTrue(false);
    assertTrue('true');
  });

  it('assertFalse', function() {
    assertFalse(true);
    assertFalse('false');
  });

  it('assertTruthy', function() {
    assertTruthy(0);
    assertTruthy('');
    assertTruthy(false);
  });

  it('assertFalsy', function() {
    assertFalsy(1);
    assertFalsy('a');
    assertFalsy(true);
  });

  it('assertError', function() {
    assertError(noop);
    assertError(noop, TypeError);
    assertError(throwsTypeError, RangeError);
  });

  it('assertNoError', function() {
    assertNoError(throwsError);
    assertNoError(throwsTypeError, TypeError);
  });

  it('assertMatch', function() {
    assertMatch('foo', /bar/);
    assertMatch('foo', null);
    assertMatch('foo', 'foo');
  });

  it('assertNoMatch', function() {
    assertNoMatch('foo', /foo/);
    assertNoMatch('foo', null);
    assertNoMatch('foo', 'foo');
  });

  it('assertObjectEqual', function() {
    assertObjectEqual(null);
    assertObjectEqual(null, {});
    assertObjectEqual({}, null);
    assertObjectEqual({a:''}, {});
    assertObjectEqual({a:''}, {a:null});
    assertObjectEqual({a:''}, {a:undefined});
    assertObjectEqual({a:null}, {});
    assertObjectEqual({a:null}, {a:''});
    assertObjectEqual({a:null}, {a:undefined});
    assertObjectEqual({a:undefined}, {});
    assertObjectEqual({a:undefined}, {a:''});
    assertObjectEqual({a:undefined}, {a:null});
    assertObjectEqual(user1, user2);
    assertObjectEqual(fnObj1, fnObj2);
    assertObjectEqual(complexObj1, complexObj2);
    assertObjectEqual(nestedObjFoo1, nestedObjFoo2);
    assertObjectEqual(longFlatObj1, longFlatObj2);
    assertObjectEqual({a:['a']}, {a:{0:'a'}});
    assertObjectEqual({a:{0:'a'}}, {a:['a']});
    assertObjectEqual(cyclicObjFoo, cyclicObjFooNum);
    assertObjectEqual(cyclicObjFoo, cyclicObjBar);
    assertObjectEqual(cyclicObjFoo, cyclicObjFooNested);
    assertObjectEqual({a: new Date(2020, 9, 11)}, {a: new Date(2020, 9, 12)});
    assertObjectEqual({a: new Set([1,2,3])}, {a: new Set([1,2,4])});
    assertObjectEqual({a: new Map([[1,2]])}, {a: new Map([[1,3]])});
    assertObjectEqual({a: new Uint8Array([1])}, {a: new Uint8Array([2])});
    assertObjectEqual({a: new Uint8Array([1])}, {a: new Uint16Array([1])});
  });

  it('assertArrayEqual', function() {
    assertArrayEqual([], {});
    assertArrayEqual({}, []);
    assertArrayEqual(['a','b','c'], ['a','c','b']);
    assertArrayEqual([1], [0]);
    assertArrayEqual([0], [1]);
    assertArrayEqual([''], [' ']);
    assertArrayEqual([' '], ['']);
    assertArrayEqual([null], [undefined]);
    assertArrayEqual([undefined], [null]);
    assertArrayEqual([user1], [user2]);
    assertArrayEqual([user1], [user1, user2]);
    assertArrayEqual([user1, user2], [user1]);
    assertArrayEqual(deepNestedArrayHi, deepNestedArrayHu);
    assertArrayEqual(sparseArray2, sparseArray3);
  });

  it('assertInstanceOf', function() {
    assertInstanceOf(3, String);
    assertInstanceOf(true, Number);
    assertInstanceOf('foo', Boolean);
    assertInstanceOf([], Object);
    assertInstanceOf({}, Array);
    assertInstanceOf(function() {}, Number);
    assertInstanceOf(new Error(), TypeError);
    assertInstanceOf(new TypeError(), RangeError);
    assertInstanceOf(/foo/, Function);
    assertInstanceOf(new Date(), Number);
    assertInstanceOf(Promise.resolve(), Date);
    assertInstanceOf(new CustomClass(), OtherCustomClass);
    assertInstanceOf(new OtherCustomClass(), CustomClass);
  });

  it('assertType', function() {
    assertType(3, 'string');
    assertType('foo', 'number');
    assertType(true, 'string');
    assertType({}, 'number');
    assertType(null, 'undefined')
  });

  it('assertDateEqual', function() {
    assertDateEqual(1, 1);
    assertDateEqual(null, null);
    assertDateEqual(new Date(1), new Date(2));
    assertDateEqual(new Date(1), new Date(1).toString());
  });

  it('assertRegExpEqual', function() {
    assertRegExpEqual(1, 1);
    assertRegExpEqual(null, null);
    assertRegExpEqual(/foo/, /bar/);
    assertRegExpEqual(/foo/, '/bar/');
  });

  it('other assertions', function() {
    assertNull(undefined);
    assertUndefined(null);
    assertNaN(null);
    assertNaN('');
    assertOneOf(4, [5,6,7]);
    assertOneOf({}, []);
    assertOneOf({}, [{},{},{}]);
  });

  it('custom assertions', function() {
    assertHasFooOrBar({});
  });

  it('custom messages', function() {
    assert(true, false, 'assert custom message');
    assertEqual(true, false, 'assertEqual custom message');
    assertTrue(false, 'assertTrue custom message');
    assertFalse(true, 'assertFalse custom message');
    assertTruthy(false, 'assertTruthy custom message');
    assertFalsy(true, 'assertFalsy custom message');
    assertError(noop, 'assertError custom message');
    assertError(noop, Error, 'assertError with type custom message');
    assertNoError(throwsError, 'assertNoError custom message');
    assertNoError(throwsError, Error, 'assertNoError with type custom message');
    assertObjectEqual({}, {a:1}, 'assertObjectEqual custom message');
    assertArrayEqual([], [1], 'assertArrayEqual custom message');
    assertInstanceOf(3, String, 'assertInstanceOf custom message');
    assertNull(undefined, 'assertNull custom message');
    assertUndefined(null, 'assertUndefined custom message');
    assertDateEqual(new Date(1), new Date(2), 'assertDateEqual custom message');
    assertRegExpEqual(/foo/, /bar/, 'assertRegExpEqual custom message');
    assertOneOf({}, [], 'assertOneOf custom message');
  });

  it('custom messages as object', function() {
    assertTrue(false, {
      message: '{var} should be true',
      var: false
    });
  });

  it('custom assertions', function() {
    assertNumberEven(3);
    assertObjectsHaveIntersectingKey({foo:'bar'}, {'bar':'foo'});
    assertAllArgumentsEqualLast(1, 1, 1, 1, 2);
  });

  it('should fail async', function() {
    return wait(function() {
      assertEqual(5, 6);
    });
  });

});
