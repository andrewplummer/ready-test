'use strict';

import { describe, it, assertEqual } from '../../../ready-test';
import async from '../../helpers/async';

describe('should run as a required module', function() {

  it('should run test from a required module', function() {
    assertEqual(1, 1);
  });

});

describe('simple async', function() {

  it('should run test from a required module', function() {
    return wait(function() {
      assertEqual(1, 1);
    });
  });

});
