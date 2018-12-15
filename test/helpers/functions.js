noop = function() {};

throwsError = function() {
  throw new Error('Bad!');
};

throwsTypeError = function() {
  null.foo();
};

throwsRangeError = function() {
  new Array(-1);
};

throwsReferenceError = function() {
  foo();
};

throwsErrorInPromise = function() {
  return new Promise(throwsError);
};

wait = function(fn) {
  return new Promise(function(resolve) {
    setTimeout(function() {
      resolve(fn());
    }, 200);
  });
};
