'use strict';
(function() {

  var HAS_LOCAL_STORAGE = typeof localStorage !== 'undefined';
  var LOCAL_STORAGE_KEY = 'foldMode';

  var MODES = ['all', 'top', 'none'];

  var currentMode;

  function getElement(tag, className, parent) {
    var el = document.createElement(tag);
    el.className = className;
    parent.appendChild(el);
    return el;
  }

  function createDropdown() {
    var el = getElement('div', 'fold-mode', document.body);
    createTitle(el);
    createSelect(el);
  }

  function createTitle(el) {
    var title = getElement('h6', 'fold-mode__title', el);
    title.textContent = 'Fold:';
  }

  function createSelect(el) {
    var select = getElement('select', 'fold-mode__select', el);
    MODES.forEach(function(text) {
      var name = text.charAt(0).toUpperCase() + text.slice(1);
      var option = getElement('option', 'fold-mode__option', select);
      option.value = text.toLowerCase();
      option.textContent = name;
      select.appendChild(option);
    });
    select.selectedIndex = getIndexForMode(currentMode);
    select.addEventListener('change', onSelectChange);
  }

  function onSelectChange(evt) {
    var select = evt.target;
    currentMode = select.options[select.selectedIndex].value;
    store(LOCAL_STORAGE_KEY, currentMode);
    ReadyTest.cancel(function() {
      ReadyTest.setFoldMode(currentMode);
      ReadyTest.run();
    });
  }

  function initCurrentMode() {
    currentMode = retrieve(LOCAL_STORAGE_KEY) || 'none';
    ReadyTest.setFoldMode(currentMode);
  }

  function getIndexForMode(mode) {
    return MODES.indexOf(mode);
  }

  function store(key, val) {
    if (HAS_LOCAL_STORAGE) {
      return localStorage.setItem(key, val);
    }
  }

  function retrieve(key) {
    if (HAS_LOCAL_STORAGE) {
      return localStorage.getItem(key);
    }
  }

  initCurrentMode();
  createDropdown();

})();
