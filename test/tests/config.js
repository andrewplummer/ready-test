'use strict';

describe('Config', function() {

  it('Should set autoRun', function() {
    assertTrue(ReadyTest.getAutoRun());
    ReadyTest.setAutoRun(false);
    assertFalse(ReadyTest.getAutoRun());
    ReadyTest.setAutoRun(true);
  });

  it('Should set foldMode', function() {
    var init = ReadyTest.getFoldMode();
    ReadyTest.setFoldMode('all');
    assertEqual(ReadyTest.getFoldMode(), 'all');
    ReadyTest.setFoldMode('none');
    assertEqual(ReadyTest.getFoldMode(), 'none');
    ReadyTest.setFoldMode('foobar');
    assertEqual(ReadyTest.getFoldMode(), 'none');
    ReadyTest.setFoldMode(init);
  });

  it('Should set randomize', function() {
    assertFalse(ReadyTest.getRandomize());
    ReadyTest.setRandomize(true);
    assertTrue(ReadyTest.getRandomize());
    ReadyTest.setRandomize(false);
  });

  it('Should set seed', function() {
    assertEqual(ReadyTest.getSeed(), null);
    ReadyTest.setSeed(1234);
    assertEqual(ReadyTest.getSeed(), 1234);
    ReadyTest.setSeed(null);
  });

});
