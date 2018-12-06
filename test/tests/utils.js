
var wasRunningOutside = ReadyTest.isRunning();
var currentTestOutside = ReadyTest.getCurrentTest();
var currentSuiteOutside = ReadyTest.getCurrentSuite();

describe('Utils', function() {

  it('isRunning', function() {
    assertTrue(ReadyTest.isRunning());
    assertFalse(wasRunningOutside);
  });

  it('getCurrentSuite', function() {
    assertEqual(currentSuiteOutside, null);
    assertEqual(ReadyTest.getCurrentSuite(), 'Utils');
  });

  it('getCurrentTest', function() {
    assertEqual(currentTestOutside, null);
    assertEqual(ReadyTest.getCurrentTest(), 'getCurrentTest');
  });
});
