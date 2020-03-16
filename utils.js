/**
 * @module utils
 */

/**
 * Call a function on document ready, or immediately if already ready
 * @param {function} func
 */
export function onReady(func) {
  if (document.readyState === 'loading') {
    // Loading hasn't finished yet
    document.addEventListener('DOMContentLoaded', () => func());
  } else {
    // `DOMContentLoaded` has already fired
    func();
  }
}

/**
 * Return window inner width and height
 * @returns {{width: number, height: number}}
 */
export function getWindowSize() {
  return {
    width: window.innerWidth,
    height: window.innerHeight
  };
}
/**
 * Return window scroll position
 * @returns {{x: number, y: number}}
 */
export function getWindowScroll() {
  return {
    y: window.pageYOffset,
    x: window.pageXOffset
  };
}

/**
 * Test if this is a mobile device (by useragent)
 * @returns {Boolean}
 */
export function isMobile() {
  return /Mobi|Android/i.test(navigator.userAgent)
}

/**
 * Check if an a set of dimensions is in the window bounds
 * @param {DomDimensions} boundingRect
 * @param {WindowDimensions} windowDimensions
 * @returns
 */
export function isInViewport({top, left, bottom, right}, {width, height, x, y}) {
  const vertical = (top - y) >= 0 && (top - y) <= height || (bottom - y) >= 0 && (bottom - y) <= height || (top - y) < 0 && (bottom - y) > height;
  const horizontal = (left - x) >= 0 && (left - x) <= width || (right - x) >= 0 && (right - x) <= width || (left - x) < 0 && (right - x) > width;
  return vertical && horizontal;
}