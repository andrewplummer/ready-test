assertNumberEven = createAssertion(function(arg) {
  return {
    num: arg,
    pass: typeof arg === 'number' && arg % 2 === 0,
    message: '{num} should be an even number'
  };
});

assertObjectsHaveIntersectingKey = createAssertion(function(arg1, arg2) {
  var pass = false;
  for (var key in arg1) {
    if(!arg1.hasOwnProperty(key)) continue;
    if (arg2.hasOwnProperty(key)) {
      pass = true;
    }
  }
  return {
    pass: pass,
    message: 'objects should have intersecting key'
  };
});

assertAllArgumentsEqualLast = createAssertion(function() {
  var pass = true;
  var args = arguments;
  var len = args.length - 1;
  var last = args[len];
  for (var i = 0; i < len; i++) {
    if (args[i] !== last) {
      pass = false;
    }
  }
  return {
    pass: pass,
    last: last,
    message: 'preceeding arguments should equal {last}'
  };
});

