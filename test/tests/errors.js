'use strict';

describe('Errors', function() {

  describe('Suite', throwsError);

  describe('Test', function() {

    it('should throw Error', throwsError);
    it('should throw TypeError', throwsTypeError);
    it('should throw RangeError', throwsRangeError);
    it('should throw ReferenceError', throwsReferenceError);
    it('should throw error in Promise', function() {
      return wait(throwsErrorInPromise);
    });

  });

  describe('Helper', function() {

    function basicTest() {
      assertTrue(true);
    }

    describe('Error inside beforeAll', function() {
      beforeAll(throwsError);
      it('should catch error in beforeAll block', basicTest);
    });

    describe('Error inside afterAll', function() {
      afterAll(throwsError);
      it('should catch error in afterAll block', basicTest);
    });

    describe('Error inside multiple beforeAll', function() {
      beforeAll(throwsError);
      beforeAll(throwsError);
      it('should catch error in beforeAll block', basicTest);
    });

    describe('Error inside multiple afterAll', function() {
      afterAll(throwsError);
      afterAll(throwsError);
      it('should catch error in afterAll block', basicTest);
    });

    describe('Error inside beforeEach', function() {
      beforeEach(throwsError);
      it('should catch error in beforeEach block', basicTest);
    });

    describe('Error inside afterEach', function() {
      afterEach(throwsError);
      it('should catch error in afterEach block', basicTest);
    });

    describe('Error inside multiple beforeEach', function() {
      beforeEach(throwsError);
      beforeEach(throwsError);
      it('should catch error in beforeEach blocks', basicTest);
    });

    describe('Error inside multiple afterEach', function() {
      afterEach(throwsError);
      afterEach(throwsError);
      it('should catch error in afterEach blocks', basicTest);
    });

  });

});
