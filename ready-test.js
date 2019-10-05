'use strict';
(function(exports) {

  var IS_BROWSER = typeof window !== 'undefined';

  // --- Runner

  var rootSuite;
  var currentSuite;
  var currentTest;
  var runCanceled;

  function run(onRunComplete) {
    if (isRunning()) {
      return;
    }
    reset();
    setState(States.PENDING);
    rootSuite.onRunComplete = onRunComplete;
    openSuiteContext(rootSuite);
    initializeAllSuites();
  }

  function cancel(fn) {

    function onComplete() {
      runCanceled = false;
      if (fn) {
        fn();
      }
    }

    if (isRunning()) {
      runCanceled = true;
      rootSuite.onRunComplete = onComplete;
    } else {
      onComplete();
    }
  }

  function isRunning() {
    return rootSuite &&
      (rootSuite.state === States.PENDING ||
       rootSuite.state === States.RUNNING);
  }

  function onAllSuitesInitialized() {
    setState(States.RUNNING);
    randomizeSuite(rootSuite);
    markBlockStart(rootSuite);
    runAllSuites(onRunComplete);
  }

  function onRunComplete() {
    markBlockEnd(rootSuite);
    outputSuiteFailures(rootSuite);
    outputSuitePerf(rootSuite);
    closeSuiteContext(rootSuite);
    outputStats();
    setResultState();
    if (rootSuite.onRunComplete) {
      rootSuite.onRunComplete(currentSuite.state === States.PASS);
    }
  }

  function getRootSuite() {
    return {
      name: IS_BROWSER ? 'All Tests' : '',
      suites: []
    };
  }

  function setupRunner() {
    clear();
  }

  // --- Reset Helpers

  function clear() {
    rootSuite    = getRootSuite();
    currentSuite = rootSuite;
  }

  function reset() {
    resetStats();
    resetConsole();
    resetBrowser();
    resetRandomize();
    resetSuite(rootSuite);
  }

  function resetSuite(suite) {
    suite.err = null;
    suite.failures = [];
    suite.perfTests = [];
    suite.suites.forEach(resetSuite);
  }

  function resetTest(test) {
    test.err = null;
    test.pass = true;
    test.assertions = [];
  }


  // --- Suite Initialization

  function initializeAllSuites() {
    runQueue(rootSuite.suites, initializeSuite, onAllSuitesInitialized);
  }

  function initializeSuite(suite) {
    if (!suiteCanBeInitialized(suite)) {
      return;
    }
    currentSuite = suite;
    return executeFunction(suite.fn, onSuiteInitError, onSuiteInitNext);
  }

  function onSuiteInitError(err) {
    currentSuite.err = err;
    currentSuite = currentSuite.parent;
  }

  function onSuiteInitNext() {
    return runQueue(currentSuite.suites, initializeSuite, onSuiteInitComplete);
  }

  function onSuiteInitComplete() {
    currentSuite.initialized = true;
    currentSuite = currentSuite.parent;
  }


  // --- Suite Running

  function runAllSuites(onComplete) {
    return runQueue(rootSuite.suites, runSuite, onComplete);
  }

  function runSuite(suite) {
    if (blockIsSkipped(suite)) {
      stats.suitesSkipped++;
      return;
    }
    currentSuite = suite;
    openSuiteContext(suite);
    return runBeforeAll();
  }

  function runBeforeAll() {
    return runQueue(currentSuite.beforeAll, runBeforeAllBlock, onBeforeAllComplete, true);
  }

  function runBeforeAllBlock(fn) {
    return executeFunction(fn, onSuiteHelperBlockError);
  }

  function onBeforeAllComplete() {
    return runSuiteTests();
  }

  function runSuiteTests() {
    openNestedContext('suite__tests');
    return runQueue(currentSuite.tests, runTest, onSuiteTestsComplete);
  }

  function onSuiteTestsComplete() {
    closeNestedContext();
    return runSuiteSubsuites();
  }

  function runSuiteSubsuites() {
    openNestedContext('subsuites');
    return runQueue(currentSuite.suites, runSuite, onSuiteSubsuitesComplete);
  }

  function onSuiteSubsuitesComplete() {
    closeNestedContext();
    return runAfterAll();
  }

  function runAfterAll() {
    return runQueue(currentSuite.afterAll, runAfterAllBlock, onAfterAllComplete, true);
  }

  function runAfterAllBlock(fn) {
    return executeFunction(fn, onSuiteHelperBlockError);
  }

  function onAfterAllComplete() {
    onSuiteRunComplete();
  }

  function onSuiteHelperBlockError(err) {
    currentSuite.err = err;
    // Re-throw the error to stop the helper queue so
    // that other beforeAll/afterAll blocks are not run.
    throw err;
  }

  function onSuiteRunComplete() {
    checkSuiteEmpty(currentSuite);
    checkSuiteErrored(currentSuite);
    outputSuiteFailures(currentSuite);
    outputSuitePerf(currentSuite);
    closeSuiteContext(currentSuite);
    currentSuite = currentSuite.parent;
  }

  function checkSuiteEmpty(suite) {
    if (!suite.err && !suite.tests.length && !suite.suites.length) {
      pushSuiteFailure(suite, 'empty');
    }
  }

  function checkSuiteErrored(suite) {
    if (suite.err) {
      stats.suitesErrored++;
      pushSuiteFailure(suite, 'error');
    }
  }


  // --- Test Running

  function runTest(test) {
    if (blockIsSkipped(test)) {
      stats.testsSkipped++;
      outputTestResult(test);
      return;
    } else if (test.parent.err) {
      return;
    }
    resetTest(test);
    currentTest = test;
    return runBeforeEach();
  }

  function runBeforeEach() {
    return runQueue(currentTest.parent.beforeEach, runBeforeEachBlock, onBeforeEachComplete, true);
  }

  function runBeforeEachBlock(fn) {
    return executeFunction(fn, onTestHelperBlockError);
  }

  function onTestHelperBlockError(err) {
    onTestError(err);
    // Re-throw the error to stop the helper queue so
    // that other beforeAll/afterAll blocks are not run.
    throw err;
  }

  function onBeforeEachComplete() {
    if (currentTest.err) {
      // If the test has errored in the beforeEach
      // phase then immediately move to the end.
      return onTestRunComplete();
    } else if (testIsPerf(currentTest)) {
      // If the test is a perf test then it may take
      // a while to run, so allow painting to catch up.
      return allowPaint(executeTest);
    } else {
      return executeTest();
    }
  }

  function executeTest() {
    markBlockStart(currentTest);
    return executeFunction(currentTest.fn, onTestError, onTestExecuted);
  }

  function onTestError(err) {
    currentTest.err = err;
    stats.testsErrored++;
    pushTestFailure(currentTest, 'error');
  }

  function onTestExecuted() {
    markBlockEnd(currentTest);
    return runAfterEach(currentTest.parent);
  }

  // Note that beforeEach and afterEach have to be handled a bit
  // differently here as the order is important when nesting.
  // beforeEach blocks are run "outside in" while afterEach blocks
  // are run "inside out", however they still have to maintain their
  // internal order for the same nesting level. Handling this by
  // inheriting blocks in the case of beforeEach and running up
  // the chain in the case of afterEach. afterAll does not require
  // this as its execution order is tied to suites, which are
  // already handled in this fashion.
  function runAfterEach(suite) {
    if (suite.afterEach) {
      var onComplete = runAfterEach.bind(null, suite.parent);
      return runQueue(suite.afterEach, runAfterEachBlock, onComplete, true);
    } else {
      return onAfterEachComplete();
    }
  }

  function runAfterEachBlock(fn) {
    return executeFunction(fn, onTestHelperBlockError);
  }

  function onAfterEachComplete() {
    onTestRunComplete();
  }

  function onTestRunComplete() {
    checkTestPerf(currentTest);
    checkTestEmpty(currentTest);
    checkTestFailure(currentTest);
    outputTestResult(currentTest);
    currentTest = null;
  }

  function checkTestFailure(test) {
    if (!test.pass) {
      pushTestFailure(test, 'assertion');
    }
  }

  function checkTestEmpty(test) {
    if (!test.err && !test.assertions.length && !testIsPerf(test)) {
      pushTestFailure(test, 'empty');
    }
  }

  function checkTestPerf(test) {
    if (testIsPerf(test)) {
      getFoldedSuite(currentSuite).perfTests.push(test);
    }
  }


  // --- Test Identity Helpers

  function testIsEmpty(test) {
    return !test.err && !test.assertions.length;
  }

  function testIsPerf(test) {
    return blockImplicitlyHasFlag(test, FLAG_PERF, 'hasPerf');
  }

  function testIsPerfOnly(test) {
    return testIsPerf(test) && !(test.assertions && test.assertions.length);
  }


  // --- Exectution Helpers

  function runQueue(queue, task, onComplete, swallowErrors) {
    return runNextInQueue(queue.concat(), task, onComplete, swallowErrors);
  }

  // Runs the next task in the queue, then moves on. If any task in
  // the queue returns a promise, it will be waited for, otherwise
  // it will move on immediately. If an error is encountered the
  // queue will be halted. The last argument allows a way for tasks
  // that are expected to error to still be able to halt the queue.
  function runNextInQueue(queue, task, onComplete, swallowErrors) {

    function fn() {
      return task(obj);
    }

    function onNext() {
      return runNextInQueue(queue, task, onComplete);
    }

    function onError(err) {
      if (!swallowErrors) {
        throw err;
      }
      return onComplete();
    }

    var obj = queue.shift();

    if (runCanceled || !obj) {
      return onComplete();
    }

    return executeFunction(fn, onError, onNext);
  }

  // Executes a potentially asynchronous function and returns a promise
  // if one is encountered. This method allows functions to run both
  // synchronously or asynchronously simply by returning a promise. Note
  // that we don't want potential errors in the onComplete function to
  // trigger onError, so moving it out of the try block.
  function executeFunction(fn, onError, onComplete) {
    var promise;
    try {
      promise = fn();
    } catch (e) {
      return onError(e);
    }
    if (promise) {
      return setPromiseHandlers(promise, onError, onComplete);
    } else {
      return onComplete && onComplete();
    }
  }


  // --- Perf Helpers

  var HAS_PERF_API = typeof performance !== 'undefined' && performance.now;
  var HAS_HRTIME   = typeof process !== 'undefined' && !!process.hrtime;
  var NS_IN_MS     = 1000000;

  function markBlockStart(block) {
    block.startMark = getPerfMark();
  }

  function markBlockEnd(block) {
    block.runtime = getPerfDelta(block.startMark);
  }

  function getPerfMark(mark) {
    if (HAS_HRTIME) {
      return process.hrtime(mark);
    } else if (HAS_PERF_API) {
      return performance.now();
    } else {
      return Date.now();
    }
  }

  function getPerfDelta(mark) {
    var delta;
    if (HAS_HRTIME) {
      delta = process.hrtime(mark)[1] / NS_IN_MS;
    } else if (HAS_PERF_API) {
      delta = performance.now() - mark;
    } else {
      delta = Date.now() - mark;
    }
    return delta;
  }

  function humanizeTime(time) {
    var suffix;
    if (time > 1000) {
      time = time / 1000;
      suffix = 's';
    } else {
      suffix = 'ms';
    }
    time = Math.round(time * 100) / 100;
    return time + suffix;
  }

  // --- State Helpers

  var stateElement;

  var States = {
    PENDING: {
      name: 'pending',
      text: 'setup...'
    },
    RUNNING: {
      name: 'running',
      text: 'running...'
    },
    PASS: {
      name: 'pass',
      text: 'pass'
    },
    FAIL: {
      name: 'fail',
      text: 'fail'
    },
    EMPTY: {
      name: 'empty',
      text: 'no tests run'
    }
  };

  function setResultState() {
    if (stats.suitesErrored || stats.testsErrored) {
      setState(States.FAIL);
    } else if (stats.assertTotal !== stats.assertPassed) {
      setState(States.FAIL);
    } else if (!stats.assertTotal) {
      setState(States.EMPTY);
    } else {
      setState(States.PASS);
    }
  }

  function setState(state) {
    if (IS_BROWSER) {
      setStateBrowser(state);
    } else {
      setStateConsole(state);
    }
    rootSuite.state = state;
  }

  // --- Stats Helpers

  var stats = {};

  function resetStats() {

    // Assertion stats
    stats.assertTotal  = 0;
    stats.assertFailed = 0;
    stats.assertPassed = 0;

    // Extra stats
    stats.suitesSkipped = 0;
    stats.suitesErrored = 0;
    stats.testsSkipped  = 0;
    stats.testsErrored  = 0;

  }

  // --- Flags

  var FLAG_NONE  = 0;
  var FLAG_PERF  = 1;
  var FLAG_SKIP  = 2;
  var FLAG_FOCUS = 4;

  function blockHasSkippedFlag(block) {
    return blockHasFlag(block, FLAG_SKIP);
  }

  function blockHasFocusedFlag(block) {
    return blockHasFlag(block, FLAG_FOCUS);
  }

  function blockHasPerfFlag(block) {
    return blockHasFlag(block, FLAG_PERF);
  }

  function blockHasFlag(block, flag) {
    return !!(block.flags & flag);
  }

  // --- Focus Helpers

  function suiteCanBeInitialized(suite) {
    // Focus is resolved only after initialization,
    // so we don't have to worry about it at this point.
    return !blockHasSkippedFlag(suite) && !suite.initialized;
  }

  function blockIsSkipped(block) {
    return blockHasSkippedFlag(block) || blockIsImplicitlySkipped(block);
  }

  function blockIsImplicitlySkipped(block) {
    return rootSuite.hasFocused && !blockImplicitlyHasFlag(block, FLAG_FOCUS, 'hasFocused');
  }

  function blockImplicitlyHasFlag(block, flag, prop) {
    // Return true if this block or any of its children have the flag.
    if (blockHasFlag(block, flag) || block[prop]) {
      return true;
    }
    // Otherwise check each parent block to see if it
    // has the flag but with no other children that do.
    while ((block = block.parent)) {
      if (blockHasFlag(block, flag) && !block[prop]) {
        return true;
      }
    }
    return false;
  }


  // --- Fold Mode Helpers

  var FOLD_MODE_ALL  = 'all';
  var FOLD_MODE_TOP  = 'top';
  var FOLD_MODE_NONE = 'none';

  var foldMode = FOLD_MODE_NONE;

  function getFoldMode() {
    return foldMode;
  }

  function setFoldMode(mode) {
    if (isValidFoldMode(mode)) {
      foldMode = mode;
    }
  }

  function isValidFoldMode(mode) {
    return mode === FOLD_MODE_NONE ||
           mode === FOLD_MODE_TOP ||
           mode === FOLD_MODE_ALL;
  }

  function suiteAddsContext(suite) {
    switch (foldMode) {
      case FOLD_MODE_NONE: return suite !== rootSuite;
      case FOLD_MODE_ALL:  return suite === rootSuite;
      case FOLD_MODE_TOP:  return suite.parent && !suite.parent.parent;
    }
  }

  function getFoldedSuite(suite) {
    switch (foldMode) {
      case FOLD_MODE_NONE: return suite;
      case FOLD_MODE_ALL:  return rootSuite;
      case FOLD_MODE_TOP:  return getTopLevelSuite(suite);
    }
  }

  function getTopLevelSuite(suite) {
    while (suite.parent.parent) {
      suite = suite.parent;
    }
    return suite;
  }

  // --- Failure Push Helpers

  function pushTestFailure(test, type) {
    getFoldedSuite(currentSuite).failures.push({
      type: type,
      test: test,
      err: test.err
    });
  }

  function pushSuiteFailure(suite, type) {
    getFoldedSuite(suite).failures.push({
      type: type,
      suite: suite,
      err: suite.err
    });
  }

  // --- Context Helpers

  var contextStack = [];

  function openSuiteContext(suite) {
    if (suiteAddsContext(suite)) {
      openContext('suite');
      output(suite.name, 'suite__name');
    }
  }

  function closeSuiteContext(suite) {
    if (suiteAddsContext(suite)) {
      closeContext();
    }
  }

  function openNestedContext(ctx) {
    if (foldMode === FOLD_MODE_NONE) {
      openContext(ctx);
    }
  }

  function closeNestedContext() {
    if (foldMode === FOLD_MODE_NONE) {
      closeContext();
    }
  }

  function openContext(ctx, meta) {
    if (IS_BROWSER) {
      openContextBrowser(ctx, meta);
    } else {
      openContextConsole(ctx);
    }
  }

  function closeContext() {
    if (IS_BROWSER) {
      closeContextBrowser();
    } else {
      closeContextConsole();
    }
  }

  function withContext(ctx, fn, meta) {
    openContext(ctx, meta);
    fn();
    closeContext();
  }

  function getBaseContext(ctx) {
    return ctx.split('--')[0];
  }

  // --- Output Icons

  var PASS_ICON = '✔';
  var FAIL_ICON = '✖';
  var WARN_ICON = '▲';

  // --- Output Result Helpers

  function outputTestResult(test) {
    if (testIsPerfOnly(test)) {
      return;
    } else if (blockIsSkipped(test)) {
      outputResult(test, '.', 'test--skip', 'skipped');
    } else if (testIsEmpty(test)) {
      outputResult(test, '.', 'test--no-assertions', 'no assertions');
    } else if (test.err) {
      outputResult(test, 'E', 'test--error', 'errored');
    } else if (!test.pass) {
      outputResult(test, 'F', 'test--fail', 'failed');
    } else {
      outputResult(test, '.', 'test--pass', 'passed');
    }
  }

  function outputResult(test, char, ctx, state) {
    var meta = test.name + ' (' + state + ')';
    output(char, ctx, meta);
  }

  // --- Output Failure Helpers

  function outputSuiteFailures(suite) {
    if (suite.failures.length) {
      withContext('failures', function() {
        suite.failures.forEach(function(failure) {
          outputFailure(failure, suite);
        });
      });
    }
  }

  function outputFailure(failure, suite) {
    withContext('failure', function() {
      outputFailureTitle(failure, suite);
      outputFailureBody(failure);
    });
  }

  function outputFailureTitle(failure, suite) {
    var name = getFailureName(failure, suite);
    if (name) {
      withContext('failure__title', function() {
        output(name, 'failure__name');
      });
    }
  }

  function outputFailureBody(failure) {
    withContext('failure__body', function() {
      if (failure.type === 'empty') {
        outputFailureEmpty();
      } else if (failure.type === 'error') {
        outputFailureError(failure);
      } else {
        outputFailureAssertions(failure);
      }
    });
  }

  function outputFailureEmpty() {
    withContext('warning', function() {
      output(WARN_ICON, 'icon--warn');
      output('Nothing asserted!', 'warning__message');
    });
  }

  function outputFailureError(failure) {
    var err, stack;

    // Support for early IE that don't have error stacks.
    err = failure.err || failure.test.err;
    stack = err.stack || (err.name + ': ' + err.message);

    if (!IS_BROWSER) {
      stack = indentStack(stack);
    }
    output(stack, 'stack');

    // Provide a link to rethrow the error to make it easier to debug.
    if (IS_BROWSER) {
      createThrowLink('Throw', 'throw', err);
    }
  }

  function outputFailureAssertions(failure) {
    withContext('assertions', function() {
      failure.test.assertions.forEach(function(ass, i) {
        outputTestAssertion(ass, i + 1);
      });
    });
  }

  function getFailureName(failure, ancestorSuite) {
    var name, suite;

    if (failure.test) {
      name = failure.test.name;
      suite = failure.test.parent;
    } else if (failure.suite) {
      name = '';
      suite = failure.suite;
    }

    while (suite !== ancestorSuite) {
      name = suite.name + (name ? ' | ' + name : '');
      suite = suite.parent;
    }
    return name;
  }

  function indentStack(stack) {
    return stack.split('\n').join('\n' + currentIndent);
  }

  // --- Output Assertion Helpers

  function outputTestAssertion(ass, n) {
    withContext('assertion', function() {
      outputAssertionTitle(ass, n);
      if (!ass.pass && ass.diff) {
        outputAssertionDiff(ass);
      }
    });
  }

  function outputAssertionTitle(ass, n) {
    withContext('assertion__title', function() {
      output(n + '.', 'assertion__num');
      outputAssertionResultIcon(ass.pass);
      withContext('assertion__message', function() {
        outputAssertionMessage(ass.message, ass);
      });
    });
  }

  function outputAssertionDiff(ass) {
    withContext('assertion__diff', function() {
      withContext('diff', function() {
        outputDiffOpenBrace(ass.diff);
        outputDiffProps(ass.diff, '');
        outputDiffCloseBrace(ass.diff);
      });
    });
  }

  function outputAssertionResultIcon(pass) {
    withContext('assertion__result', function() {
      output(pass ? PASS_ICON : FAIL_ICON, 'icon--' + (pass ? 'pass' : 'fail'));
    });
  }

  // --- Output Diff Helpers

  function outputDiffEmptyObject(diff, inline, tab) {
    outputDiffOptionalContainer('diff__line--changed', !inline, function() {
      outputDiffBraceToken(diff.bArr, '[]', '{}', tab, 'diff__token--expected', 'Second');
      output(' ', 'diff__token');
      outputDiffBraceToken(diff.aArr, '[]', '{}', tab, 'diff__token--actual', 'First');
      outputDiffBraceChangeMeta();
    }, 'properties differ');
  }

  function outputDiffProps(diff, tab) {
    tab = tab + '  ';
    diff.lines.forEach(function(entry, i, arr) {
      var last = i < arr.length - 1;
      if (entry.type === 'skip') {
        outputDiffSkipped(tab);
      } else if (entry.type === 'pass') {
        outputDiffPass(diff, entry.key, entry.val, tab, last);
      } else if (entry.type === 'fail') {
        if (!entry.aHas && entry.bHas) {
          outputDiffKeyMissing(diff, entry.key, entry.bVal, tab, last);
        } else if (entry.aHas && !entry.bHas) {
          outputDiffKeyAdded(diff, entry.key, entry.aVal, tab, last);
        } else {
          if (entry.diff) {
            outputDiffNestedObject(diff, entry.diff, entry.key, tab, last);
          } else {
            outputDiffValuesDiffer(diff, entry.key, entry.aVal, entry.bVal, tab, last);
          }
        }
      }
    });
  }

  function outputDiffPass(diff, key, val, tab, last) {
    withContext('diff__line', function() {
      outputDiffKey(diff, key, tab);
      output(dump(val, true), 'diff__token');
      outputDiffTrailingComma(last);
      outputDiffPassMeta('(matched)');
    });
  }

  function outputDiffSkipped(tab) {
    withContext('diff__line', function() {
      output(tab + '...', 'diff__token--skipped');
      outputDiffPassMeta('(matched many)');
    });
  }

  function outputDiffValuesDiffer(diff, key, aVal, bVal, tab, last) {
    withContext('diff__line--changed', function() {
      outputDiffKey(diff, key, tab, 'diff__token--key');
      output(dump(bVal), 'diff__token--expected');
      output(' ', 'diff__token');
      output(dump(aVal), 'diff__token--actual');
      outputDiffTrailingComma(last);
      outputDiffChangeMeta(diff, key, 'differs');
    });
  }

  function outputDiffNestedObject(diff, iDiff, key, tab, last) {
    var ctx = 'diff__line' + (iDiff.sameType ? '' : '--changed');
    openContext(ctx);
    outputDiffKey(diff, key, tab);
    if (!iDiff.lines.length) {
      outputDiffEmptyObject(iDiff, true);
    } else {
      outputDiffOpenBrace(iDiff, true);
      closeContext();
      outputDiffProps(iDiff, tab);
      openContext(ctx);
      outputDiffCloseBrace(iDiff, true, tab);
      outputDiffTrailingComma(last);
    }
    closeContext();
  }

  // --- Output Diff Key Helpers

  function outputDiffKeyAdded(diff, key, val, tab, last) {
    outputDiffKeyChange(diff, 'added', 'actual', key, val, tab, last);
  }

  function outputDiffKeyMissing(diff, key, val, tab, last) {
    outputDiffKeyChange(diff, 'missing', 'expected', key, val, tab, last);
  }

  function outputDiffKeyChange(diff, changeType, tokenType, key, val, tab, last) {
    withContext('diff__line--' + changeType, function() {
      output(tab, 'diff__token');
      withContext('diff__token--' + tokenType, function() {
        outputDiffKey(diff, key, '');
        output(dump(val, true), 'diff__token');
      });
      outputDiffTrailingComma(last);
      outputDiffChangeMeta(diff, key, changeType);
    });
  }

  function outputDiffKey(diff, key, tab, ctx) {
    if (!diff.aArr || !diff.bArr) {
      output(tab + '"' + key + '": ', ctx || 'diff__token');
    } else {
      output(tab, 'diff__token');
    }
  }

  // --- Output Diff Brace Helpers

  function outputDiffOpenBrace(diff, inline, tab) {
    if (diff.sameType) {
      outputDiffBraceSame(diff.aArr, '[', '{', inline, tab);
    } else {
      outputDiffBraceChanged(diff, '[', '{', inline, tab);
    }
  }

  function outputDiffCloseBrace(diff, inline, tab) {
    if (diff.sameType) {
      outputDiffBraceSame(diff.aArr, ']', '}', inline, tab);
    } else {
      outputDiffBraceChanged(diff, ']', '}', inline, tab);
    }
  }

  function outputDiffBraceSame(isArr, arrToken, objToken, inline, tab) {
    outputDiffOptionalContainer('diff__line', !inline, function() {
      outputDiffBraceToken(isArr, arrToken, objToken, tab);
    });
  }

  function outputDiffBraceChanged(diff, arrToken, objToken, inline, tab) {
    outputDiffOptionalContainer('diff__line--changed', !inline, function() {
      outputDiffBraceToken(diff.bArr, arrToken, objToken, tab, 'diff__token--expected');
      output(' ', 'diff__token');
      outputDiffBraceToken(diff.aArr, arrToken, objToken, null, 'diff__token--actual');
      outputDiffBraceChangeMeta();
    });
  }

  function outputDiffBraceToken(isArr, arrToken, objToken, tab, ctx) {
    output(tab || '');
    output(isArr ? arrToken : objToken, ctx || 'diff__token');
  }

  function outputDiffBraceChangeMeta() {
    outputDiffFailMeta('(types differ)');
  }

  // --- Output Diff Misc Helpers

  function outputDiffOptionalContainer(ctx, toggle, fn, meta) {
    if (toggle) {
      withContext(ctx, fn, meta);
    } else {
      fn();
    }
  }

  function outputDiffTrailingComma(last) {
    if (last) {
      output(',', 'diff__token');
    }
  }

  function getDiffMeta(diff, key, verb) {
    if (diff.aArr && diff.bArr) {
      return 'element ' + verb + ' at index ' + key;
    } else {
      return 'property "' + key + '" ' + verb;
    }
  }

  function outputDiffChangeMeta(diff, key, verb) {
    outputDiffFailMeta('(' + getDiffMeta(diff, key, verb) + ')');
  }

  function outputDiffFailMeta(str) {
    output(str, 'diff__meta');
  }

  function outputDiffPassMeta(str) {
    if (IS_BROWSER) {
      output(str, 'diff__meta');
    }
  }

  // --- Output Perf Helpers

  function outputSuitePerf(suite) {
    if (suite.perfTests.length) {
      if (foldMode === FOLD_MODE_NONE) {
        outputPerfTable(suite.perfTests);
      } else {
        outputPerfTableGrouped(suite.perfTests);
      }
    }
  }

  function outputPerfTable(tests, caption) {
    calculatePerfResults(tests);
    var data = buildTableData(tests, {
      headers: [
        getPerfHeaderContext('Test'),
        getPerfHeaderContext('Runtime'),
        getPerfHeaderContext('')
      ],
      fetchers: [
        getPerfTestName,
        getPerfTestRuntime,
        getPerfTestResult
      ],
      rowModifier: function(test) {
        return test.winner ? 'winner' : null;
      }
    });
    outputTable(data, caption, 'perf');
  }

  function outputPerfTableGrouped(tests) {
    var groups = tests.reduce(function(groups, test) {
      var suiteName = test.parent.name;
      groups[suiteName] = (groups[suiteName] || []).concat(test);
      return groups;
    }, {});
    Object.keys(groups).forEach(function(suiteName) {
      outputPerfTable(groups[suiteName], suiteName);
    });
  }

  function getPerfTestName(test) {
    return getContextObj(test.name);
  }

  function getPerfTestRuntime(test) {
    return getContextObj(humanizeTime(test.runtime));
  }

  function getPerfTestResult(test) {
    if (test.winner) {
      return getContextObj(PASS_ICON, 'icon--pass');
    } else {
      return getContextObj('');
    }
  }

  function getPerfHeaderContext(text) {
    return getContextObj(text, 'perf__header-text');
  }

  function getContextObj(text, ctx) {
    return {
      ctx: ctx,
      text: text
    };
  }

  function calculatePerfResults(tests) {
    var winners = [], fastTime = Infinity;

    tests.forEach(function(test) {
      if (test.runtime === fastTime) {
        winners.push(test);
      } else if (test.runtime < fastTime) {
        winners = [test];
        fastTime = test.runtime;
      }
    });

    winners.forEach(function(test) {
      test.winner = true;
    });
  }

  // --- Output Table Helpers

  function outputTable(rows, caption, ctx) {
    withContext(ctx, function() {
      outputTableCaption(rows, caption, ctx);
      outputTableHead(rows, ctx);
      outputTableBody(rows, ctx);
    });
  }

  function outputTableCaption(rows, caption, ctx) {
    if (caption) {
      output(caption, ctx + '__title');
    }
  }

  function outputTableHead(rows, ctx) {
    withContext(ctx + '__head', function() {
      outputTableRow(rows, 'header', ctx, 0);
    });
  }

  function outputTableBody(rows, ctx) {
    withContext(ctx + '__body', function() {
      for (var i = 1; i < rows.length; i++) {
        outputTableRow(rows, 'cell', ctx, i);
      }
    });
  }

  function outputTableRow(rows, cellType, base, rowIndex) {
    var row = rows[rowIndex];
    var ctx = base + '__row' + (row.modifier ? '--' + row.modifier : '');
    withContext(ctx, function() {
      row.cells.forEach(function(obj, colIndex, arr) {
        if (obj) {
          withContext(base + '__' + cellType, function() {
            outputTableCell(rows, colIndex, obj.text, obj.ctx);
          });
        }
        if (!IS_BROWSER && colIndex < arr.length - 1) {
          output('    ');
        }
      });
    });
  }

  function outputTableCell(rows, colIndex, text, ctx) {
    output(text, ctx);
    if (!IS_BROWSER) {
      outputTableCellPadding(rows, colIndex, text, ctx);
    }
  }

  function outputTableCellPadding(rows, colIndex, text) {
    var colLen = 0, padLen, padding = '';
    for (var rowIndex = 0, obj; rowIndex < rows.length; rowIndex++) {
      obj = rows[rowIndex].cells[colIndex];
      colLen = Math.max(colLen, obj && obj.text && obj.text.length || 0);
    }
    padLen = colLen - text.length;
    while (padding.length < padLen) {
      padding += ' ';
    }
    output(padding, 'padding');
  }

  function buildTableData(arr, opt) {
    arr = arr.map(function(el) {
      var cells = opt.fetchers.map(function(fn) {
        return fn(el);
      });
      return buildTableRow(cells, opt.rowModifier(el));
    });
    return [buildTableRow(opt.headers)].concat(arr);
  }

  function buildTableRow(cells, modifier) {
    return {
      cells: cells,
      modifier: modifier
    };
  }

  // --- Output Stats Helpers

  function outputStats() {
    withContext('stats', function() {
      outputTotals();
      outputExtraStats();
    });
  }

  function outputTotals() {
    withContext('stats__totals', function() {
      outputStat(stats.assertTotal, 'assertions');
      outputComma();
      outputStat(stats.assertPassed,   'passed');
      outputComma();
      outputStat(stats.assertFailed,   'failed');
      outputOptionalStats(stats.suitesErrored, stats.testsErrored, 'errored');
      outputOptionalStats(stats.suitesSkipped, stats.testsSkipped, 'skipped');
    });
  }

  function outputStat(stat, suffix, ctx) {
    var str = stat + ' ' + suffix;
    ctx = 'stat--' + (ctx || suffix);
    output(str, ctx);
  }

  function outputOptionalStats(suiteStat, testsStat, verb) {
    if (!suiteStat && !testsStat) {
      return;
    }

    var str = [
      getOptionalStat(suiteStat, 'suite', verb),
      getOptionalStat(testsStat, 'test', verb)
    ].filter(function(s) {
      return s;
    }).join(', ');

    outputComma();
    output(str, 'stat--' + verb);
  }

  function outputExtraStats() {
    var msg = 'Tests ran in ' + humanizeTime(rootSuite.runtime);
    if (runSeed) {
      msg += ', randomized with seed ' + runSeed;
    }
    output(msg, 'stats__extra');
  }

  function getOptionalStat(stat, type, verb) {
    if (stat) {
      return stat + ' ' + pluralize(stat, type) + ' ' + verb;
    }
  }

  function pluralize(n, str) {
    return str + (n === 1 ? '' : 's');
  }

  // --- Output Link Helpers

  function createThrowLink(text, ctx, err) {
    openContext(ctx);
    outputBrowser(text);
    addEventListener(getContextElement(), 'click', function() {
      throw err;
    });
    closeContext();
  }

  // --- Output Base Helpers

  var TOKEN_REG = /([^{}]+)|{(.+?)}/g;

  function output(text, ctx, meta) {
    if (IS_BROWSER && !text) {
      return;
    }
    ctx = ctx || 'text';
    openContext(ctx, meta);
    if (IS_BROWSER) {
      outputBrowser(text);
    } else {
      outputConsole(text, ctx, meta);
    }
    closeContext();
  }

  function outputComma() {
    output(', ');
  }

  function outputAssertionMessage(message, obj) {
    if (typeof message === 'object') {
      obj = message;
      // Fall back to object if no message could be
      // extracted in case the wrong object is passed.
      message = obj.message || obj;
    }
    return String(message).replace(TOKEN_REG, function(m, text, key) {
      output(text);
      if (hasProp(obj, key)) {
        output(dump(obj[key]), 'token');
      }
    });
  }

  // --- Browser Init Helpers

  function setupBrowser() {
    if (IS_BROWSER) {
      loadFavicon();
      loadScriptAttributes();
      setupWindowLoad();

      // Local storage overrides data attributes
      // so make sure it comes after script setup.
      setFoldModeFromStorage();

      createFoldModeDropdown();
      setupStateElement();
    }
  }

  function loadScriptAttributes() {

    // Note IE may not handle currentScript or have dataset.
    var el = document.currentScript;
    var dataset = el && el.dataset;

    if (dataset) {

      if (hasProp(dataset, 'foldMode')) {
        setFoldMode(dataset.foldMode);
      }
      if (hasProp(dataset, 'seed')) {
        setSeed(+dataset.seed);
      }

      // Boolean flags are always true unless explicitly "false"
      if (hasProp(dataset, 'autoRun')) {
        setAutoRun(dataset.autoRun !== 'false');
      }
      if (hasProp(dataset, 'randomize')) {
        setRandomize(dataset.randomize !== 'false');
      }

    }
  }

  function loadFavicon() {
    var script = document.currentScript, link;
    // IE may not have currentScript or querySelector.
    if (!script || !document.querySelector) {
      return;
    }
    link = document.querySelector("link[rel*='icon']");
    if (!link) {
      var url = script.src.replace(/ready-test\.js$/, 'ready-test.ico');
      if (url !== script.src) {
        link = document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        link.href = url;
        document.querySelector('head').appendChild(link);
      }
    }

  }

  function setupWindowLoad() {
    addEventListener(window, 'load', onWindowLoaded);
  }

  function onWindowLoaded() {
    if (autoRun !== false) {
      run();
    }
  }

  // --- Browser Fold Mode Helpers

  var HAS_LOCAL_STORAGE = typeof localStorage !== 'undefined';
  var LOCAL_STORAGE_KEY = 'foldMode';

  var FOLD_MODES = [
    {
      label: 'All',
      value: FOLD_MODE_ALL
    },
    {
      label: 'Top',
      value: FOLD_MODE_TOP
    },
    {
      label: 'None',
      value: FOLD_MODE_NONE
    }
  ];

  function createFoldModeDropdown() {

    openContext('fold-mode');
    output('Fold:', 'fold-mode__title');
    openContext('fold-mode__select');

    FOLD_MODES.forEach(function(mode) {
      var option;
      openContext('fold-mode__option');
      option = getContextElement();
      option.value = mode.value;
      setTextContent(option, mode.label);
      option.selected = option.value === foldMode;
      closeContext();
    });

    addEventListener(getContextElement(), 'change', function(evt) {
      var select = evt.target || evt.srcElement;
      var mode = select.options[select.selectedIndex].value;
      storageSet(LOCAL_STORAGE_KEY, mode);
      cancel(function() {
        setFoldMode(mode);
        run();
      });
    });

    closeContext();
    closeContext();
  }

  function setFoldModeFromStorage() {
    var mode = storageGet(LOCAL_STORAGE_KEY);
    if (mode) {
      setFoldMode(mode);
    }
  }

  function storageSet(key, val) {
    if (HAS_LOCAL_STORAGE) {
      return localStorage.setItem(key, val);
    }
  }

  function storageGet(key) {
    if (HAS_LOCAL_STORAGE) {
      return localStorage.getItem(key);
    }
  }

  // --- Browser Output Helpers

  function outputBrowser(text) {
    setTextContent(getContextElement(), text);
  }

  function getContextElement() {
    if (contextStack.length) {
      return contextStack[contextStack.length - 1];
    } else {
      return document.body;
    }
  }

  function getElementForContext(ctx, meta) {
    var baseCtx, modifier, el;

    baseCtx = getBaseContext(ctx);

    if (baseCtx !== ctx) {
      modifier = ctx;
    }

    el = document.createElement(getTagForContext(baseCtx));
    el.className = modifier ? [baseCtx, modifier].join(' ') : baseCtx;
    if (meta) {
      el.title = meta;
    }
    return el;
  }

  function getTagForContext(baseCtx) {
    switch (baseCtx) {

      case 'state':            return 'h1';
      case 'suite__name':      return 'h2';
      case 'stats':            return 'h3';

      case 'failure':          return 'dl';
      case 'failure__title':   return 'dt';
      case 'failure__body':    return 'dd';
      case 'failure__name':    return 'h4';

      case 'assertions':       return 'ul';
      case 'assertion':        return 'li';

      case 'perf':          return 'table';
      case 'perf__row':     return 'tr';
      case 'perf__header':  return 'th';
      case 'perf__cell':    return 'td';
      case 'perf__head':    return 'thead';
      case 'perf__body':    return 'tbody';
      case 'perf__title':   return 'caption';

      case 'fold-mode__title':  return 'h6';
      case 'fold-mode__select': return 'select';
      case 'fold-mode__option': return 'option';

      case 'diff':
      case 'token':
      case 'stack':
        return 'code';

      case 'throw':
        return 'button';

      case 'test':
      case 'text':
      case 'stat':
      case 'icon':
      case 'diff__meta':
      case 'diff__token':
      case 'warning__message':
      case 'assertion__num':
      case 'assertion__result':
      case 'assertion__message':
        return 'span';
      default:
        return 'div';
    }
  }


  // --- Browser Context Helpers

  var resultElements = [];

  // Allowing contexts to open and close freely greatly simplifies the queueing
  // logic, however we also want to flush results to the browser as soon as
  // possible, so append the element as soon as the context opens, but remove
  // if when it closes if it is empty.

  function openContextBrowser(ctx, meta) {
    var el = getElementForContext(ctx, meta);
    getContextElement().appendChild(el);
    if (ctx === 'suite' || ctx === 'stats') {
      resultElements.push(el);
    }
    contextStack.push(el);
  }

  function closeContextBrowser() {
    var el = contextStack.pop();
    // Empty table cells will throw off table alignment so leave them in.
    if (!el.childNodes.length && !isTableCell(el)) {
      el.parentNode.removeChild(el);
    }
  }

  function isTableCell(el) {
    return el.nodeName === 'TD' || el.nodeName === 'TH';
  }

  // --- Browser State Helpers

  var documentTitle = IS_BROWSER && document.title;

  function setStateBrowser(state) {
    stateElement.className = 'state state--' + state.name;
    setTextContent(stateElement, state.text);
    setPageTitle(state);
  }

  function setupStateElement() {
    var el = getElementForContext('state');
    document.body.appendChild(el);

    // Set id so that element is easily accessible.
    el.id = 'state';

    stateElement = el;
  }

  function setPageTitle(state) {
    var title = '';
    var failures = stats.assertFailed + stats.testsErrored;
    if (failures) {
      title += '(' + failures + ') ';
    }
    title += (documentTitle || 'ReadyTest') + ' | ' + state.text;
    document.title = title;
  }

  // --- Browser Reset Helpers

  function resetBrowser() {
    if (IS_BROWSER) {
      clearBrowserResults();
    }
  }

  function clearBrowserResults() {
    while (resultElements.length) {
      var el = resultElements.pop();
      el.parentNode.removeChild(el);
    }
  }

  // --- Browser Misc Helpers

  var HAS_PROMISES = typeof Promise !== 'undefined';

  // Waits for a single frame to allow DOM
  // painting to catch up before continuing.
  function allowPaint(fn) {
    if (IS_BROWSER && HAS_PROMISES) {
      return new Promise(function(resolve) {
        setTimeout(resolve, 16);
      }).then(fn);
    } else {
      fn();
    }
  }

  // --- Browser Compat Helpers

  function addEventListener(obj, name, fn) {
    if (obj.attachEvent) {
      obj.attachEvent('on' + name, fn);
    } else {
      obj.addEventListener(name, fn);
    }
  }

  function setTextContent(el, text) {
    if ('textContent' in el) {
      el.textContent = text;
    } else {
      // In early IEs the error object "name" property appears to throw
      // errors when passed to innerText, even though it reports back
      // as a string. An extra call to toString seems to prevent this.
      el.innerText = text.toString();
    }
  }

  // --- Console Helpers

  var TAB = '  ';
  var currentIndent;
  var currentNewLines;

  function resetConsole() {
    currentIndent = '';
    currentNewLines = 0;
  }

  function setStateConsole(state) {
    if (state === States.PASS) {
      output(state.text, 'state--pass');
    } else if (state === States.FAIL) {
      output(state.text, 'state--fail');
    }
  }

  function outputConsole(text, ctx) {
    var style = getStyleForContext(ctx);
    consoleWrite(style ? style(text) : text);
    currentNewLines = 0;
  }

  function openContextConsole(ctx) {
    var baseCtx = getBaseContext(ctx);
    contextStack.push({
      ctx: ctx,
      baseCtx: baseCtx,
      style: getStyleForContext(ctx)
    });
    if (consoleContextHasIndent(baseCtx)) {
      currentIndent += TAB;
    }
    if (consoleContextIsLine(baseCtx)) {
      consoleWriteNewLine(currentIndent);
    }
    if (consoleContextIsInline(baseCtx)) {
      consoleWrite(' ');
    }
  }

  function consoleWriteNewLine(indent) {
    if (currentNewLines < 2) {
      consoleWrite('\n' + (indent || ''));
      currentNewLines++;
    }
  }

  function consoleWrite(str) {
    process.stdout.write(str);
  }

  function closeContextConsole() {
    var obj = contextStack.pop();
    if (consoleContextHasIndent(obj.baseCtx)) {
      currentIndent = currentIndent.slice(TAB.length);
    }
    if (consoleContextIsTrailing(obj.baseCtx)) {
      consoleWriteNewLine();
    }
  }

  function consoleContextIsLine(baseCtx) {
    return getConsoleBlockType(baseCtx) === 'line';
  }

  function consoleContextIsTrailing(baseCtx) {
    return getConsoleBlockType(baseCtx) === 'trailing';
  }

  function consoleContextIsInline(baseCtx) {
    return getConsoleBlockType(baseCtx) === 'inline';
  }

  function getConsoleBlockType(baseCtx) {
    switch (baseCtx) {
      case 'diff':
        return 'trailing';
      case 'diff__meta':
      case 'warning__message':
      case 'assertion__result':
      case 'assertion__message':
        return 'inline';
      case 'state':
      case 'stack':
      case 'suite':
      case 'suite__name':
      case 'suite__tests':
      case 'failure':
      case 'failure__title':
      case 'failure__body':
      case 'assertion':
      case 'warning':
      case 'perf':
      case 'perf__title':
      case 'perf__head':
      case 'perf__body':
      case 'perf__row':
      case 'diff__line':
      case 'stats':
      case 'stats__totals':
      case 'stats__extra':
        return 'line';
    }
  }

  function consoleContextHasIndent(baseCtx) {
    if (foldMode === FOLD_MODE_ALL) {
      return false;
    }
    switch (baseCtx) {
      case 'suite':
      case 'failures':
        return true;
      default:
        return false;
    }
  }

  // --- Styler Helpers

  var styler;

  function setStyler(s) {
    styler = s;
  }

  function getStyleForContext(ctx) {
    if (styler) {
      var style = getParentContextStyle();
      switch (ctx) {
        case 'stack':
        case 'icon--fail':
        case 'test--fail':
        case 'test--error':
        case 'state--fail':
        case 'diff__token--actual':
          return style.red;
        case 'icon--pass':
        case 'test--pass':
        case 'state--pass':
        case 'diff__token--expected':
          return style.green;
        case 'icon--warn':
        case 'test--no-assertions':
          return style.yellow;
        case 'suite__name':
        case 'failure__name':
        case 'perf__header-text':
          return style.underline;
        case 'diff__meta':
        case 'diff__line':
        case 'test--skip':
          return style.dim;
        case 'perf__title':
          return style.cyan;
        default:
          return style;
      }
    }
  }

  function getParentContextStyle() {
    var style;
    if (contextStack.length) {
      style = contextStack[contextStack.length - 1].style;
    }
    return style || styler;
  }

  // --- Block Declaration Helpers

  function pushSuite(name, fn, flags) {
    var suite = {
      fn: fn,
      name: name,
      tests: [],
      suites: [],
      beforeAll: [],
      afterAll: [],
      failures: [],
      perfTests: [],
      flags: flags,
      parent: currentSuite,
      // See runAfterEach
      beforeEach: cloneArray(currentSuite.beforeEach),
      afterEach: []

    };
    setBranchFlags(suite);
    currentSuite.suites.push(suite);
  }

  function pushTest(name, fn, flags) {
    assertCurrentSuite();
    var test = {
      fn: fn,
      name: name,
      flags: flags,
      parent: currentSuite
    };
    setBranchFlags(test);
    currentSuite.tests.push(test);
  }

  function assertCurrentSuite() {
    if (!currentSuite || currentSuite === rootSuite) {
      throw new Error('it called outside of describe block');
    }
  }

  function assertCurrentTest() {
    if (!currentTest) {
      throw new Error('assertion called outside of it block');
    }
  }

  function setBranchFlags(block) {
    if (blockHasFocusedFlag(block)) {
      setParentsFocused(block);
    }
    if (blockHasPerfFlag(block)) {
      setParentsPerf(block);
    }
  }

  function setParentsFocused(block) {
    while ((block = block.parent)) {
      block.hasFocused = true;
    }
  }

  function setParentsPerf(block) {
    while ((block = block.parent)) {
      block.hasPerf = true;
    }
  }

  // --- Suite Public Methods

  function describe(name, fn) {
    pushSuite(name, fn, FLAG_NONE);
  }

  function fdescribe(name, fn) {
    pushSuite(name, fn, FLAG_FOCUS);
  }

  function xdescribe(name, fn) {
    pushSuite(name, fn, FLAG_SKIP);
  }

  function pdescribe(name, fn) {
    pushSuite(name, fn, FLAG_PERF);
  }

  function fpdescribe(name, fn) {
    pushSuite(name, fn, FLAG_FOCUS | FLAG_PERF);
  }

  function xpdescribe(name, fn) {
    pushSuite(name, fn, FLAG_SKIP | FLAG_PERF);
  }

  // --- Test Public Methods

  function it(name, fn) {
    pushTest(name, fn, FLAG_NONE);
  }

  function fit(name, fn) {
    pushTest(name, fn, FLAG_FOCUS);
  }

  function xit(name, fn) {
    pushTest(name, fn, FLAG_SKIP);
  }

  function pit(name, fn) {
    pushTest(name, fn, FLAG_PERF);
  }

  function fpit(name, fn) {
    pushTest(name, fn, FLAG_FOCUS | FLAG_PERF);
  }

  function xpit(name, fn) {
    pushTest(name, fn, FLAG_SKIP | FLAG_PERF);
  }

  // --- Test Helper Public Methods

  function beforeEach(fn) {
    currentSuite.beforeEach.push(fn);
  }

  function afterEach(fn) {
    currentSuite.afterEach.push(fn);
  }

  function beforeAll(fn) {
    currentSuite.beforeAll.push(fn);
  }

  function afterAll(fn) {
    currentSuite.afterAll.push(fn);
  }

  // --- Assertion Public Methods

  function assert(a, b, msg) {
    if (arguments.length === 1) {
      assertTruthy(a);
    } else {
      assertEqual(a, b, msg);
    }
  }

  function assertTrue(a, msg) {
    assertEqual(a, true, msg);
  }

  function assertFalse(a, msg) {
    assertEqual(a, false, msg);
  }

  function assertNull(a, msg) {
    assertEqual(a, null, msg);
  }

  function assertNaN(a, msg) {
    assertEqual(a, NaN, msg);
  }

  function assertUndefined(a, msg) {
    assertEqual(a, undefined, msg);
  }

  function assertTruthy(a, msg) {
    buildAssertion(!!a, msg, '{a} should be truthy', a);
  }

  function assertFalsy(a, msg) {
    buildAssertion(!a, msg, '{a} should be falsy', a);
  }

  function assertType(a, b, msg) {
    buildAssertion(typeof a === b, msg, '{a} should be of type {b}', a, b);
  }

  function assertInstanceOf(a, b, msg) {
    buildAssertion(isInstanceOf(a, b), msg, '{a} should be an instance of {b}', a, b);
  }

  function assertEqual(a, b, msg) {
    buildAssertion(isEqual(a, b), msg, '{a} should equal {b}', a, b);
  }

  function assertNotEqual(a, b, msg) {
    buildAssertion(!isEqual(a, b), msg, '{a} should not equal {b}', a, b);
  }

  function assertError() {
    runErrorAssert(arguments, true);
  }

  function assertNoError() {
    runErrorAssert(arguments, false);
  }

  function assertMatch(str, reg, msg) {
    if (runTypeCheck(reg, isRegExp, 'a regex', msg)) {
      buildAssertion(reg.test(str), msg, '{a} should match {reg}', str, reg);
    }
  }

  function assertNoMatch(str, reg, msg) {
    if (runTypeCheck(reg, isRegExp, 'a regex', msg)) {
      buildAssertion(!reg.test(str), msg, '{a} should not match {reg}', str, reg);
    }
  }

  function assertArrayEqual(a, b, msg) {
    runArrayAssert(a, b, msg);
  }

  function assertObjectEqual(a, b, msg) {
    runObjectAssert(a, b, msg);
  }

  function assertDateEqual(a, b, msg) {
    runDateAssert(a, b, msg);
  }

  function assertRegExpEqual(a, b, msg) {
    runRegExpAssert(a, b, msg);
  }

  function assertOneOf(a, list, msg) {
    runOneOfAssert(a, list, msg);
  }

  // --- Error Assertion Helpers

  function runErrorAssert(args, expected) {
    var err;
    args = collectErrorArgs(args);
    try {
      args.fn();
    } catch (e) {
      err = e;
    }
    buildErrorAssertion(args, err, expected);
  }

  function collectErrorArgs(args) {
    var fn, err, msg;
    if (args.length === 1 || isString(args[1])) {
      fn  = args[0];
      msg = args[1];
    } else {
      fn  = args[0];
      err = args[1];
      msg = args[2];
    }
    return {
      fn: fn,
      err: err,
      msg: msg
    };
  }

  function buildErrorAssertion(args, tErr, expected) {
    var eErr, tName, eName, pass, msg;

    eErr   = args.err && new args.err();
    eName  = eErr && eErr.name;
    tName  = tErr && tErr.name;

    if (expected) {
      pass = tErr && (!eName || (eName === tName));
    } else {
      pass = !tErr || (eName && (eName !== tName));
    }

    msg = getFunctionName(args.fn) ? '{fn} ' : '';

    if (args.msg) {
      msg = args.msg;
    } else if (!pass && tErr && eName && eName !== tName) {
      msg += 'should throw {expected} but threw {thrown}';
    } else if (eName && !expected) {
      msg += 'should not throw {thrown}';
    } else if (eName && expected) {
      msg += 'should throw {expected}';
    } else if (!expected) {
      msg += 'should not throw an error';
    } else if (expected) {
      msg += 'should throw an error';
    }

    pushAssertion({
      fn: args.fn,
      pass: pass,
      thrown: tErr,
      expected: eErr,
      message: msg
    });
  }

  // --- Object Assertion Helpers


  function runObjectAssert(a, b, msg) {
    if (runMatchingTypeCheck(a, b, isObject, 'an object', msg)) {
      pushAssertion({
        diff: createDiff(a, b),
        message: msg || 'objects should be equal'
      });
    }
  }

  function runArrayAssert(a, b, msg) {
    if (runMatchingTypeCheck(a, b, isArray, 'an array', msg)) {
      if (a.length !== b.length) {
        buildAssertion(false, msg, {
          a: a.length,
          b: b.length,
          message: 'array length should be {b} but was {a}'
        });
      } else {
        pushAssertion({
          diff: createDiff(a, b),
          message: msg || 'arrays should be equal'
        });
      }
    }
  }

  function createDiff(a, b, aStack, bStack) {
    var diff, iDiff, keys, comparedKeys = {};

    if (!aStack) aStack = [];
    if (!bStack) bStack = [];

    diff = {
      lines: [],
      aArr: isArray(a),
      bArr: isArray(b)
    };

    diff.sameType = diff.aArr === diff.bArr;
    diff.pass = diff.sameType;

    keys = Object.keys(a).concat(Object.keys(b));

    for (var i = 0, len = keys.length; i < len; i++) {
      var key = keys[i];

      if (comparedKeys[key]) {
        continue;
      }

      var aHas = hasProp(a, key);
      var bHas = hasProp(b, key);
      var aVal = a[key];
      var bVal = b[key];

      if (aHas !== bHas || aVal !== bVal) {

        if (isObjectOrArray(aVal, aStack) && isObjectOrArray(bVal, bStack)) {

          if (isCyclicObject(aVal, aStack) || isCyclicObject(bVal, bStack)) {
            // Cyclic objects will be traversed once before they are pushed to
            // the stack. If we are still encountering them at this point it
            // means they have already passed their checks, so don't step into
            // them anymore.
            pushDiffPass(diff, key, aVal);
            continue;
          }

          aStack.push(aVal);
          bStack.push(bVal);

          iDiff = createDiff(aVal, bVal, aStack, bStack);

          aStack.pop();
          bStack.pop();

          if (iDiff.pass) {
            pushDiffPass(diff, key, aVal);
          } else {
            pushDiffFail(diff, key, aHas, bHas, aVal, bVal, iDiff);
          }
        } else {
          pushDiffFail(diff, key, aHas, bHas, aVal, bVal);
        }
      } else {
        pushDiffPass(diff, key, aVal);
      }
      comparedKeys[key] = true;
    }

    foldDiffLines(diff);

    return diff;
  }

  function isCyclicObject(obj, stack) {
    var i = stack.length;
    while (i--) {
      if (stack[i] === obj) {
        return true;
      }
    }
    return false;
  }

  function pushDiffPass(diff, key, val) {
    diff.lines.push({
      type: 'pass',
      key: key,
      val: val
    });
  }

  function pushDiffFail(diff, key, aHas, bHas, aVal, bVal, iDiff) {
    diff.lines.push({
      type: 'fail',
      key: key,
      aHas: aHas,
      bHas: bHas,
      aVal: aVal,
      bVal: bVal,
      diff: iDiff
    });
    diff.pass = false;
  }

  function foldDiffLines(diff) {
    var passing = 0, spans = [];

    diff.lines.forEach(function(line, i, arr) {
      var pass = line.type === 'pass';
      var last = i === arr.length - 1;
      if (last && passing > 0) {
        spans.push([i - passing, i - (pass ? 0 : 1)]);
      } else if (!pass && passing > 1) {
        spans.push([i - passing, i - 1]);
      }
      passing = pass ? passing + 1 : 0;
    });

    // Reverse so that splice doesn't affect order.
    spans.reverse().forEach(function(span) {
      var start, end, num;

      start = span[0];
      end   = span[1];

      // Include the first and last lines in the fold
      if (start === 0) {
        start -= 1;
      }
      if (end === diff.lines.length - 1) {
        end += 1;
      }

      num = end - start;
      if (num > 1) {
        diff.lines.splice(start + 1, num - 1, {
          type: 'skip'
        });
      }
    });
  }

  // --- Builtin Assertion Helpers

  function runDateAssert(a, b, msg) {
    if (runMatchingTypeCheck(a, b, isDate, 'a date', msg)) {
      buildAssertion(a.getTime() === b.getTime(), msg, '{a} should equal {b}', a, b);
    }
  }

  function runRegExpAssert(a, b, msg) {
    if (runMatchingTypeCheck(a, b, isRegExp, 'a regex', msg)) {
      buildAssertion(a.toString() === b.toString(), msg, '{a} should equal {b}', a, b);
    }
  }

  // --- assertOneOf Helpers

  function runOneOfAssert(a, list, msg) {
    var pass = false;
    for (var i = 0; i < list.length; i++) {
      if (a === list[i]) {
        pass = true;
        break;
      }
    }
    buildAssertion(pass, msg, '{a} should be one of {b}', a, list);
  }

  // --- Create Assertion Helpers

  function createAssertion(fn) {
    return function() {
      var assertion = fn.apply(this, arguments);
      pushAssertion(assertion);
    };
  }

  // --- Misc Assertion Helpers

  var EPSILON = Number.EPSILON || Math.pow(2, -52);

  function pushAssertion(assertion) {
    assertCurrentTest();
    currentTest.assertions.push(assertion);

    if (!hasProp(assertion, 'pass') && assertion.diff) {
      assertion.pass = assertion.diff.pass;
    }

    if (assertion.pass) {
      stats.assertPassed++;
    } else {
      currentTest.pass = false;
      stats.assertFailed++;
    }
    stats.assertTotal++;
  }

  function buildAssertion(pass, msg, message, a, b) {
    var assertion = {
      pass: pass
    };
    assertion.message = msg || message;
    if (arguments.length > 3) {
      assertion.a = a;
    }
    if (arguments.length > 4) {
      assertion.b = b;
    }
    pushAssertion(assertion);
  }

  function isEqual(a, b) {
    if (a === b) {
      return true;
    }
    if (a !== a) {
      // NaN should be equal to NaN
      return b !== b;
    }
    if (isNumber(a) && isNumber(b)) {
      // Handle floating point issues.
      return Math.abs(a - b) < EPSILON;
    }
    return false;
  }

  function runTypeCheck(obj, checkFn, type, msg) {
    if (!checkFn(obj)) {
      buildAssertion(false, msg, '{a} should be ' + type, obj);
      return false;
    }
    return true;
  }

  function runMatchingTypeCheck(a, b, checkFn, type, msg) {
    return runTypeCheck(a, checkFn, type, msg) &&
           runTypeCheck(b, checkFn, type, msg);
  }

  // --- Identity Helpers

  function isInstanceOf(obj, klass) {
    // Note that instanceof can fail on built-ins so fall back to
    // Object.prototype.toString checking. Intentionally excluding inherited
    // error types like TypeError and RangeError to prevent false positives
    // with error inheritance. https://goo.gl/QVZi4j
    if (isRootBuiltInClass(klass)) {
      var str = toStringInternal(obj);
      try {
        return str === toStringInternal(new klass());
      } catch (e) {
        // Note that the check below is ideal as built-ins constructors
        // like Promise error without arguments, however older IEs return
        // [object Object] for prototypes so the initial check is required.
        return str === toStringInternal(klass.prototype);
      }
    } else {
      return obj instanceof klass;
    }
  }

  function toStringInternal(obj) {
    return Object.prototype.toString.call(obj);
  }

  function isBuiltInClass(klass) {
    return BUILT_INS.indexOf(klass) !== -1;
  }

  function isRootBuiltInClass(klass) {
    return isBuiltInClass(klass) && !isInheritedError(klass);
  }

  function isInheritedError(klass) {
    return klass.prototype.name && klass.prototype.name !== 'Error';
  }

  function isNumber(obj) {
    return typeof obj === 'number';
  }

  function isString(obj) {
    return typeof obj === 'string';
  }

  function isFunction(obj) {
    return typeof obj === 'function';
  }

  function isArray(obj) {
    return isInstanceOf(obj, Array);
  }

  function isObject(obj) {
    return obj && (!obj.constructor || obj.constructor === Object);
  }

  function isDate(obj) {
    return isInstanceOf(obj, Date);
  }

  function isRegExp(obj) {
    return isInstanceOf(obj, RegExp);
  }

  function isError(obj) {
    return isInstanceOf(obj, Error);
  }

  function isObjectOrArray(obj) {
    return isObject(obj) || isArray(obj);
  }

  function isCustomObject(obj) {
    return obj && obj.constructor && !isBuiltInClass(obj.constructor);
  }

  function isWrappedPrimitive(obj) {
    return obj && typeof obj === 'object' && isPrimitiveConstructor(obj.constructor);
  }

  function isPrimitiveConstructor(fn) {
    return fn === String || fn === Number || fn === Boolean;
  }

  // --- Misc Helpers

  function hasOwnToString(obj) {
    return obj.constructor.prototype.toString !== Object.prototype.toString;
  }

  function hasProp(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }

  function cloneArray(arr) {
    return arr ? arr.slice() : [];
  }

  // --- Stringify helpers

  function dump(obj, short) {
    if (obj === '') {
      return '""';
    } else if (isString(obj)) {
      return '"' + obj + '"';
    } else if (isFunction(obj)) {
      return getFunctionName(obj) || 'function';
    } else if (isError(obj)) {
      return obj.name;
    } else if (isCustomObject(obj) && !hasOwnToString(obj)) {
      return '[object ' + getFunctionName(obj.constructor) + ']';
    } else if (isWrappedPrimitive(obj)) {
      return '[' + getFunctionName(obj.constructor) + ': ' + dump(obj.valueOf()) + ']';
    } else if (short && isArray(obj)) {
      return '[...]';
    } else if (short && isObject(obj)) {
      return '{...}';
    } else if (isObjectOrArray(obj)) {
      return JSON.stringify(obj);
    }
    return String(obj);
  }

  // --- Built-in Helpers

  var BUILT_INS = getBuiltIns('Array,Boolean,Date,Float32Array,Float64Array,Function,Int16Array,Int32Array,Int8Array,Map,Number,Object,Promise,RegExp,Set,String,Symbol,Uint16Array,Uint32Array,Uint8Array,Uint8ClampedArray,WeakMap,WeakSet,Error,TypeError,RangeError,ReferenceError,URIError,SyntaxError,EvalError');

  function getBuiltIns(str) {
    var global = getGlobalContext();
    return str.split(',').map(function(name) {
      return global[name];
    }).filter(function(obj) {
      return obj;
    });
  }

  function getGlobalContext() {
    // Get global context by keyword here to avoid issues with libraries
    // that can potentially alter this script's context object.
    return (typeof global !== 'undefined' && global) ||
           (typeof window !== 'undefined' && window) ||
           (typeof self   !== 'undefined' && self);
  }

  // --- Legacy Helpers

  var HAS_FUNCTION_NAMES = !!Function.name;
  var FUNCTION_NAME_REG = /function\s*([^(]*)\(/i;

  function getFunctionName(fn) {
    if (HAS_FUNCTION_NAMES) {
      return fn.name;
    } else {
      // Older IEs report TypeError.toString() as
      // "TypeError" but fortunately have a name.
      return fn.name || fn.toString().match(FUNCTION_NAME_REG)[1];
    }
  }

  // Older IEs treat .catch as a syntax error, so being careful of that
  // here. Also note that the order is very subtle here. In our case
  // we don't want errors in the thenFn to trigger the catchFn error
  // handler so we *must* set it first, or it will result in unexpected
  // behavior.
  function setPromiseHandlers(promise, catchFn, thenFn) {
    return promise['catch'](catchFn).then(thenFn);
  }

  // --- Auto Run Helpers

  var autoRun = true;

  function getAutoRun() {
    return autoRun;
  }

  function setAutoRun(on) {
    autoRun = on;
  }

  // --- Randomization Helpers

  var RANDOMIZE_SEED_MAX = 10000;

  var startSeed = null;
  var randomize = false;

  var runSeed;
  var currentSeed;

  function getSeed() {
    return startSeed;
  }

  function setSeed(seed) {
    startSeed = seed;
  }

  function getRandomize() {
    return randomize;
  }

  function setRandomize(on) {
    randomize = on;
  }

  function resetRandomize() {
    if (canShuffle()) {
      runSeed = startSeed || generateSeed();
      currentSeed = runSeed;
    }
  }

  function canShuffle() {
    return randomize || startSeed;
  }

  function randomizeSuite(suite) {
    if (canShuffle()) {
      shuffleArray(suite.tests);
      shuffleArray(suite.suites);
      suite.suites.forEach(randomizeSuite);
    }
  }

  function shuffleArray(arr) {
    var currentIndex, nextIndex, tmp;
    if (!arr) {
      return;
    }
    currentIndex = arr.length;
    while (currentIndex !== 0) {
      nextIndex = Math.floor(random() * currentIndex);
      currentIndex -= 1;
      tmp = arr[currentIndex];
      arr[currentIndex] = arr[nextIndex];
      arr[nextIndex] = tmp;
    }
  }

  function generateSeed() {
    return Math.floor(Math.random() * RANDOMIZE_SEED_MAX);
  }

  function random() {
    var x = Math.sin(currentSeed++) * RANDOMIZE_SEED_MAX;
    return x - Math.floor(x);
  }

  // --- Misc Helpers

  function getCurrentSuite() {
    return currentSuite && currentSuite !== rootSuite ? currentSuite.name : null;
  }

  function getCurrentTest() {
    return currentTest ? currentTest.name : null;
  }

  // --- Export Helpers

  function createExports() {
    exportFunctions(exports);
    exportUtils();
  }

  function exportGlobals() {
    if (!IS_BROWSER) {
      exportFunctions(getGlobalContext());
    }
  }

  function exportFunctions(target) {

    // Test
    target.it         = it;
    target.xit        = xit;
    target.fit        = fit;
    target.pit        = pit;
    target.xpit       = xpit;
    target.fpit       = fpit;

    // Helpers
    target.afterAll   = afterAll;
    target.beforeAll  = beforeAll;
    target.afterEach  = afterEach;
    target.beforeEach = beforeEach;

    // Suite
    target.describe   = describe;
    target.xdescribe  = xdescribe;
    target.fdescribe  = fdescribe;
    target.pdescribe  = pdescribe;
    target.fpdescribe = fpdescribe;
    target.xpdescribe = xpdescribe;

    // Aliases
    target.pxit       = xpit;
    target.pfit       = fpit;
    target.pfdescribe = fpdescribe;
    target.pxdescribe = xpdescribe;
    target.setup      = beforeEach;
    target.teardown   = afterEach;

    // Assert
    target.assert            = assert;
    target.assertTrue        = assertTrue;
    target.assertFalse       = assertFalse;
    target.assertEqual       = assertEqual;
    target.assertNotEqual    = assertNotEqual;
    target.assertNull        = assertNull;
    target.assertNaN         = assertNaN;
    target.assertUndefined   = assertUndefined;
    target.assertTruthy      = assertTruthy;
    target.assertFalsy       = assertFalsy;
    target.assertError       = assertError;
    target.assertNoError     = assertNoError;
    target.assertObjectEqual = assertObjectEqual;
    target.assertArrayEqual  = assertArrayEqual;
    target.assertDateEqual   = assertDateEqual;
    target.assertRegExpEqual = assertRegExpEqual;
    target.assertOneOf       = assertOneOf;
    target.assertMatch       = assertMatch;
    target.assertNoMatch     = assertNoMatch;
    target.assertType        = assertType;
    target.assertInstanceOf  = assertInstanceOf;
    target.createAssertion   = createAssertion;
    target.createDiff        = createDiff;

  }

  function exportUtils() {

    var target = IS_BROWSER ? exports.ReadyTest = {} : exports;

    // Configs

    target.getSeed      = getSeed;
    target.setSeed      = setSeed;
    target.getRandomize = getRandomize;
    target.setRandomize = setRandomize;
    target.getAutoRun   = getAutoRun;
    target.setAutoRun   = setAutoRun;
    target.getFoldMode  = getFoldMode;
    target.setFoldMode  = setFoldMode;

    // Runner Utils

    target.run             = run;
    target.clear           = clear;
    target.cancel          = cancel;
    target.isRunning       = isRunning;
    target.setStyler       = setStyler;
    target.exportGlobals   = exportGlobals;
    target.getCurrentTest  = getCurrentTest;
    target.getCurrentSuite = getCurrentSuite;

  }

  // --- Setup

  createExports();
  setupRunner();
  setupBrowser();

})(this);
