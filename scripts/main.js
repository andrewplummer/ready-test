(function() {

  function highlightHtmlBlocks() {
    var els = document.querySelectorAll('.language-html,.language-js');
    Array.from(els).forEach(highlightHtmlBlock);
  }

  function highlightHtmlBlock(el) {
    var highlight = false;

    el.childNodes.forEach(node => {
      if (!highlight && node.nodeType === Node.ELEMENT_NODE) {
        node.classList.add('dim');
      }
      node.textContent = node.textContent.replace(/\*/g, () => {
        highlight = !highlight;
        return '';
      });
    });
  }

  // Hide one element based on the visibility of another
  function setupVisibilityToggle(srcSelector, targetSelector) {
    var hidden, srcElement, targetElement;

    srcElement    = document.querySelector(srcSelector);
    targetElement = document.querySelector(targetSelector);

    if (!srcElement) {
      return;
    }

    function checkElementVisible() {
      var check = elementIsOffscreen(srcElement);
      if (check !== hidden) {
        hidden = check;
        if (hidden) {
          show();
        } else {
          hide();
        }
      }
    }

    function show() {
      targetElement.classList.remove('invisible');
      targetElement.tabIndex = 0;
    }

    function hide() {
      targetElement.classList.add('invisible');
      targetElement.tabIndex = -1;
    }

    function elementIsOffscreen(el) {
      var rect, doc;
      rect = el.getBoundingClientRect();
      return rect.bottom < 0 ||
             rect.right < 0 ||
             rect.top > window.innerHeight ||
             rect.left > window.innerWidth;
    }

    setScrollHandler(checkElementVisible);
  }

  function setupSearchFilter() {
    var container, icon, input, dropdown, links, filteredLinks, empty, isMobile;

    container = document.querySelector('.search');
    icon      = container.querySelector('.search__icon');
    input     = container.querySelector('.search__input');
    dropdown  = container.querySelector('.search__dropdown');

    if (!dropdown) {
      return;
    }

    filteredLinks = [];
    links = getAllLinks();
    empty = getEmptyItem();

    function getAllLinks() {
      var els = dropdown.querySelectorAll('a');
      for (var i = 0; i < els.length; i++) {
        els[i].addEventListener('blur', onControlBlur);
      }
      return els;
    }

    function getEmptyItem() {
      return dropdown.querySelector('.search__dropdown-item--empty');
    }

    function filterLinks() {
      var q = input.value, reg;

      if (!q) {
        if (isMobile) {
          hide(empty);
          show(dropdown);
        } else {
          hide(dropdown);
        }
        return;
      }

      reg = RegExp(q, 'i');
      filteredLinks = [];

      for (var i = 0, link; i < links.length; i++) {
        link = links[i];
        link.classList.remove('search__dropdown-link--focused');
        if (reg.test(link.dataset.name)) {
          filteredLinks.push(link);
          show(link.parentElement);
        } else {
          hide(link.parentElement);
        }
      }

      if (!filteredLinks.length) {
        show(empty);
      } else {
        filteredLinks[0].classList.add('search__dropdown-link--focused');
        hide(empty);
      }

      show(dropdown);
    }

    function onDocumentKeyDown(evt) {
      if (evt.key === 'f' && evt.shiftKey && (evt.ctrlKey || evt.metaKey)) {
        evt.preventDefault();
        input.select();
      } else if (evt.key === 'Escape') {
        input.blur();
      }
    }

    function onContainerKeyDown(evt) {
      if (evt.key === 'ArrowDown') {
        handleDownKey();
        evt.preventDefault();
      } else if (evt.key === 'ArrowUp') {
        handleUpKey();
        evt.preventDefault();
      }
    }

    function onInputKeyDown(evt) {
      if (evt.key === 'Enter' && filteredLinks.length) {
        // Scrolling will not occur unless input is blurred first!
        input.blur();
        filteredLinks[0].click();
      }
    }

    function handleDownKey() {
      if (!filteredLinks.length) {
        filterLinks();
      } else if (document.activeElement === input) {
        filteredLinks[0].focus();
      } else {
        var index = getFocusedLinkIndex();
        if (index >= 0 && index < filteredLinks.length - 1) {
          filteredLinks[index + 1].focus();
        }
      }
    }

    function handleUpKey() {
      var index = getFocusedLinkIndex();
      if (index === 0) {
        input.focus();
      } else if (index > 0) {
        filteredLinks[index - 1].focus();
      }
    }

    function getFocusedLinkIndex() {
      return filteredLinks.findIndex(function(link) {
        return document.activeElement === link;
      });
    }

    function onIconClick() {
      input.select();
    }

    function onInputFocus() {
      setActive(true);
      filterLinks();
    }

    function onInputBlur() {
      if (filteredLinks.length) {
        filteredLinks[0].classList.remove('search__dropdown-link--focused');
      }
      onControlBlur();
    }

    function onControlBlur() {
      // Defer to ensure the next focus element is set.
      defer(function() {
        if (!searchHasFocus()) {
          hide(dropdown);
          setActive(false);
          filteredLinks = [];
        }
      });
    }

    function searchHasFocus() {
      return document.activeElement === input || (getFocusedLinkIndex() !== -1);
    }

    function setActive(on) {
      container.classList.toggle('search--active', on);
    }

    function show(el) {
      el.classList.remove('hidden');
    }

    function hide(el) {
      el.classList.add('hidden');
    }

    function onResize() {
      isMobile = window.innerWidth <= 767;
    }

    setResizeHandler(onResize, true);
    document.documentElement.addEventListener('keydown', onDocumentKeyDown);
    container.addEventListener('keydown', onContainerKeyDown);
    icon.addEventListener('click', onIconClick);
    input.addEventListener('keydown', onInputKeyDown);
    input.addEventListener('input', throttle(filterLinks, 100));
    input.addEventListener('focus', onInputFocus);
    input.addEventListener('blur', onInputBlur);
  }

  function setupScrollLink(containerSelector, srcSelector, targetSelector, margin) {
    var container, srcEls, targetEls, waypoints, scrollLocked;

    container    = document.querySelector(containerSelector);
    srcEls       = document.querySelectorAll(srcSelector);
    targetEls    = document.querySelectorAll(targetSelector);

    if (!container) {
      return;
    }

    function calculateDimensions() {
      waypoints = Array.from(srcEls).map(function(el) {
        var rect, style, paddingTop, paddingBottom;

        rect = el.getBoundingClientRect();
        style = window.getComputedStyle(el);
        paddingTop = parseInt(style.paddingTop);
        paddingBottom = parseInt(style.paddingBottom);

        return {
          top: rect.top + window.scrollY + paddingTop,
          bottom: rect.bottom + window.scrollY - paddingBottom
        };
      });
    }

    function setFocusedWaypoints() {
      var minY, maxY, focused = [];

      minY = window.scrollY + margin;
      maxY = minY + window.innerHeight - margin;

      for (var i = 0, len = targetEls.length, el, waypoint; i < len; i++) {
        el = targetEls[i];
        waypoint = waypoints[i];
        if (rectIsVisible(waypoint, minY, maxY)) {
          el.classList.add('docs-index__item--focused');
          focused.push(el);
        } else {
          el.classList.remove('docs-index__item--focused');
        }
      }

      scrollFocusedIntoView(focused);
    }

    // Element#scrollIntoView is showing some weird behavior
    // here with scroll-behavior: smooth, so rolling our own.
    function scrollFocusedIntoView(focused) {
      if (!focused.length || scrollLocked) {
        return;
      }
      var first = focused[0];
      var last  = focused[focused.length - 1];
      if (first.offsetTop < container.scrollTop) {
        container.scrollTo(0, Math.max(0, first.offsetTop - margin));
      } else if (last.offsetTop + last.clientHeight > container.scrollTop + container.clientHeight) {
        container.scrollTo(0, last.offsetTop + last.clientHeight - container.clientHeight + margin);
      }
    }

    function rectIsVisible(rect, min, max) {
      // Check if either the top or bottom of the rect is inside
      // the bounds or if the bounds are contained by the rect.
      return pointIsInsideBounds(rect.top, min, max) ||
             pointIsInsideBounds(rect.bottom, min, max) ||
             boundsAreInsideRect(rect, min, max);
    }

    function pointIsInsideBounds(p, min, max) {
      return p > min && p < max;
    }

    function boundsAreInsideRect(rect, min, max) {
      return min > rect.top && max < rect.bottom;
    }

    function onMouseWheel(evt) {
      if (wheelPastEdge(evt)) {
        evt.preventDefault();
      }
    }

    function wheelPastEdge(evt) {
      return wheelPastTop(evt) || wheelPastBottom(evt);
    }

    function wheelPastTop(evt) {
      return evt.deltaY < 0 && container.scrollTop === 0;
    }

    function wheelPastBottom(evt) {
      return evt.deltaY > 0 && container.scrollTop === container.scrollHeight - container.offsetHeight;
    }

    function onResize() {
      calculateDimensions();
      setFocusedWaypoints();
    }

    function onHashChange() {
      // Chrome is exhibiting some strange behavior when trying to
      // scroll an unrelated element while transitioning to a hash
      // link with scroll-behavior: smooth enabled at the same time,
      // so lock the scroll when the hash changes and unlock when
      // the scroll has finished.
      scrollLocked = true;
    }

    function onScrollEnd() {
      scrollLocked = false;
    }

    calculateDimensions();
    container.addEventListener('mousewheel', onMouseWheel);
    setScrollHandler(setFocusedWaypoints);
    setResizeHandler(onResize);
    window.addEventListener('hashchange', onHashChange);
    window.addEventListener('scrollend', onScrollEnd);
  }

  function defer(fn) {
    setTimeout(fn, 1);
  }

  function throttle(fn, ms) {
    var last, timer;
    return function() {
      var t = new Date();
      if (!last || (t - last) > ms) {
        fn.apply(this, arguments);
        last = t;
        clearTimeout(timer);
        timer = setTimeout(fn, ms);
      }
    };
  }

  function debounce(fn, ms) {
    var timer;
    return function() {
      clearTimeout(timer);
      var applyFn = fn.bind.apply(fn, [this].concat(Array.from(arguments)));
      timer = setTimeout(applyFn, ms);
    };
  }

  function setScrollHandler(fn) {

    function onScrollEnd() {
      window.dispatchEvent(new Event('scrollend'));
    }

    function handler() {
      onDispatched();
      fn();
    }

    var throttleDelay  = 100;
    var scrollEndDelay = 200;

    onDispatched = debounce(onScrollEnd, scrollEndDelay);

    window.addEventListener('scroll', throttle(handler, throttleDelay));

    // Fire the handler once even if we're scrolled as there are cases
    // where the initial scroll event on page load can't be trusted.
    fn();
  }

  function setResizeHandler(fn, immediate) {
    window.addEventListener('resize', debounce(fn, 200));
    if (immediate) {
      fn();
    }
  }

  highlightHtmlBlocks();
  setupSearchFilter();
  setupScrollLink('.docs-index', '.docs__block', '.docs-index__item', 40);
  setupVisibilityToggle('.logo--hero', '.header-logo');

})();
