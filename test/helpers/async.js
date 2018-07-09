wait = function(fn) {
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
      try {
        resolve(fn());
      } catch(e) {
        reject(e);
      }
    }, 200);
  });
};
