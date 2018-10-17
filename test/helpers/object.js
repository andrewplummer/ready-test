emptyObject = {};

user1 = {
  name: 'Homer',
  age: 42,
  address: '742 Evergreen Terrace'
};

user2 = {
  name: 'Sherlock',
  age: 38,
  address: '221 B. Baker Street'
};

user3 = {
  name: 'Mr. President',
  age: 15,
  address: '1600 Pennsylvania Ave'
};

complexObject1 = {
  a1: 'a1',
  a2: 'a2',
  str: 'str',
  num: 1,
  obj: {
    str: 'str',
    num: 2,
    arr: [
      {
        name: 'Sharon',
        age: 15
      },
      {
        name: 'Francine',
        age: 38
      }
    ],
    arr2: [
      'a',
      'b',
      'c'
    ]
  },
  wuh: [],
  a3: 'a3',
  a4: 'a4'
};

complexObject2 = {
  a1: 'a1',
  a2: 'a2',
  str: 'str',
  bool: true,
  obj: {
    str: 'foo',
    num: 3,
    arr: [
      {
        name: 'Bob',
        age: 23
      },
      {
        name: 'Francine',
        age: 38
      }
    ],
    arr2: [
      'a',
      'c',
      'b'
    ]
  },
  wuh: {},
  a3: 'a3',
  a4: 'a4'
};

objectNestedFoo1 = {
  foo: {
    foo: 1
  },
  bar: 'bar'
};

objectNestedFoo2 = {
  foo: {
    foo: 2
  },
  whu: 'bar'
};

objectLongFlat1 = {
  a: 'a',
  b: 'b',
  c: 'c',
  d: 'd',
  e: 'e',
  f: 'f',
  g: 'g',
  h: 'h',
  i: 'i',
  j: 'j',
  k: 'k'
};

objectLongFlat2 = {
  a: 'a',
  b: 'b',
  c: 'c',
  d: 'd',
  e: 'e',
  f: 's',
  g: 'g',
  h: 'h',
  i: 'i',
  j: 'j',
  k: 'k'
};

fnObject1 = {
  fn: function fn1() {}
};

fnObject2 = {
  fn: function fn2() {}
};

cyclicObjFoo = {
  'num': 4,
  'str': 'str'
};
cyclicObjFoo.foo = cyclicObjFoo;

cyclicObjFooClone = {
  'num': 4,
  'str': 'str'
};
cyclicObjFooClone.foo = cyclicObjFooClone;

cyclicObjBar = {
  'num': 4,
  'str': 'str'
};
cyclicObjBar.bar = cyclicObjBar;

cyclicObjFooNum = {
  'num': 5,
  'str': 'str'
};
cyclicObjFooNum.foo = cyclicObjFooNum;

cyclicObjFooNested = {
  'num': 4,
  'str': 'str',
  'foo': {}
};
cyclicObjFooNested.foo.foo = cyclicObjFooNested;

cyclicObjFooNestedClone = {
  'num': 4,
  'str': 'str',
  'foo': {}
};
cyclicObjFooNestedClone.foo.foo = cyclicObjFooNestedClone;
