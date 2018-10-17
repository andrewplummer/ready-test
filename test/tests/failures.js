'use strict';

describe('Should fail', function() {

  it('assert', function() {
    assert(null);
    assert(undefined);
    assert(0, 1);
    assert(1, 0);
  });

  it('assertEqual', function() {
    assertEqual(0, 1);
    assertEqual(1, 0);
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
    assertObjectEqual(fnObject1, fnObject2);
    assertObjectEqual(complexObject1, complexObject2);
    assertObjectEqual(objectNestedFoo1, objectNestedFoo2);
    assertObjectEqual(objectLongFlat1, objectLongFlat2);
    assertObjectEqual({a:['a']}, {a:{0:'a'}});
    assertObjectEqual({a:{0:'a'}}, {a:['a']});
    assertObjectEqual(cyclicObjFoo, cyclicObjFooNum);
    assertObjectEqual(cyclicObjFoo, cyclicObjBar);
    assertObjectEqual(cyclicObjFoo, cyclicObjFooNested);
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
    assertArrayEqual(deepNestedArray, deepNestedArray2);
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
    assertInstanceOf(new Date, Number);
    assertInstanceOf(Promise.resolve(), Date);
    assertInstanceOf(new CustomClass, OtherCustomClass);
    assertInstanceOf(new OtherCustomClass, CustomClass);
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

  it('custom assertions', function() {
    assertNumberEven(3);
    assertObjectsHaveIntersectingKey({foo:'bar'}, {'bar':'foo'});
    assertAllArgumentsEqualLast(1, 1, 1, 1, 2);
  });

});

describe('Should fail async', function() {

  it('Should support async via promises', function() {
    return wait(function() {
      assertEqual(5, 6);
    });
  });

});
