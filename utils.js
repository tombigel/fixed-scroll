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
