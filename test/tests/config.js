'use strict';

describe('Config', function() {

  it('should set autoRun', function() {
    assertTrue(ReadyTest.getAutoRun());
    ReadyTest.setAutoRun(false);
    assertFalse(ReadyTest.getAutoRun());
    ReadyTest.setAutoRun(true);
  });

  it('should set foldMode', function() {
    var init = ReadyTest.getFoldMode();
    ReadyTest.setFoldMode('all');
    assertEqual(ReadyTest.getFoldMode(), 'all');
    ReadyTest.setFoldMode('none');
    assertEqual(ReadyTest.getFoldMode(), 'none');
    ReadyTest.setFoldMode('foobar');
    assertEqual(ReadyTest.getFoldMode(), 'none');
    ReadyTest.setFoldMode(init);
  });

  it('should set randomize', function() {
    assertFalse(ReadyTest.getRandomize());
    ReadyTest.setRandomize(true);
    assertTrue(ReadyTest.getRandomize());
    ReadyTest.setRandomize(false);
  });

  it('should set seed', function() {
    assertEqual(ReadyTest.getSeed(), null);
    ReadyTest.setSeed(1234);
    assertEqual(ReadyTest.getSeed(), 1234);
    ReadyTest.setSeed(null);
  });

});
