runPerfTest = function(iterations) {
  var sum = 0;
  // Up the iterations to
  // get some good results.
  iterations *= 10000;
  while (--iterations) {
    // Don't let JIT optimize
    // if at all possible.
    sum += Math.random();
  }
  return sum;
};
