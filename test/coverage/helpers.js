const opn  = require('opn');
const path = require('path');
const exec = require('child_process').execSync;

module.exports = {
  run: function run(cmd) {
    try {
      exec(cmd, {
        stdio: 'ignore'
      });
    } catch (err) {
      // Do nothing
    }
  },

  open: function(p) {
    opn('file:///' + path.resolve(p), {
      wait: false
    });
  }

};
