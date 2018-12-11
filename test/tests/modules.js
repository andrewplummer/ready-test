import { describe, it, assertEqual } from '../../ready-test';

describe('Modules', function() {

  it('should run', function() {
    assertEqual(1, 1);
  });

  it('should run async', function() {
    return wait(function() {
      assertEqual(1, 1);
    });
  });

});
