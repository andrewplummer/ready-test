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
  return new Promise(errors);
};
