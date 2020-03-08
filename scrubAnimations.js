import { getElementRect } from './domMeasurements.js';
import { onReady, getWindowSize, getWindowScroll, isInViewport } from './utils.js';

/**
 * Window dimensions in pixels
 * @typedef {Object} WindowDimensions
 * @property {Number} x scrollX
 * @property {Number} y scrollY
 * @property {Number} width
 * @property {Number} height
 */

/**
 * Parameters of element animations.
 * @mixes DomDimensions
 * @typedef {Object} ElementAnimationParameters
 * @property {Number} top
 * @property {Number} left
 * @property {Number} bottom
 * @property {Number} right
 * @property {Number} width
 * @property {Number} height
 * @property {String} effect
 * @property {String} [*]
 */

/**
 * Manage page animations and throttle scroll
 * @param {HTMLElement} root The fixed element to use as a scroll parent
 */
class ScrubEffects {
  constructor(root) {
    // Flag to know if animation already requested
    this.nextFrameCallbackId = undefined;
    // Store for elements that should animate
    this.elementsWithEffectsMap = [];
    // The animation root scrollable component
    this.root = root;

    // Wait for document ready
    onReady(() => {
      // On scroll do all the things
      window.addEventListener('scroll', () => this.registerNextAF());
      // On resize init again
      window.addEventListener('resize', () => this.init());
      // Calculate and initialize scroll position
      this.init();
    });
  }

  /**
   * Initialize the animations
   * - Measure window and scroll
   * - Measure animatable comps positioning info
   * - Set initial scroll
   * - Call animations for initial viewport
   */
  init() {
    const windowScrollAndSize = { ...getWindowSize(), ...getWindowScroll() };
    this.elementsWithEffectsMap = this.getElementsWithEffects();
    this.initDocument();
    this.propagateScroll(windowScrollAndSize);
    this.registerNextAF();
  }

  /**
   * Set body height and make root fixed
   */
  initDocument() {
    // Set body height
    document.body.style.height = `${this.root.scrollHeight}px`;
    // Add scroll class to root
    this.root.classList.add('scrub-root');
  }

  /**
   * Collect animatable elements
   * - measure the elements while ignoring transformations
   * - data-effect is the effect name "doAnimations()" should handle
   * - data-* are animation parameters to expose
   * @returns {Map<HTMLElement, ElementAnimationParameters>}
   */
  getElementsWithEffects() {
    const elements = this.root.querySelectorAll('[data-effect]');
    const entries = [...elements].map(element => [
      element,
      {
        inViewport: false,
        ...getElementRect(element, this.root),
        ...element.dataset
      }
    ]);

    return new Map(entries);
  }

  /**
   * Throttle and debounce scroll and animations to next animation frame
   */
  registerNextAF() {
    if (!this.nextFrameCallbackId) {
      this.nextFrameCallbackId = requestAnimationFrame(() => {
        // Remeasure scroll and size closer to animation
        // Will cause layout thrashing, but I think it is the right place for it
        // see this gist by Paul Irish: https://gist.github.com/paulirish/5d52fb081b3570c81e3a
        const windowScrollAndSize = { ...getWindowSize(), ...getWindowScroll() };
        // Scroll...
        this.propagateScroll(windowScrollAndSize);
        // ...then animate
        this.applyEffects(windowScrollAndSize);
        // Release debounce flag
        this.nextFrameCallbackId = undefined;
      });
    }
  }

  /**
   * Logic to execute animations.
   * Supported effects:
   * - parallax: will apply a parallax effect on the first child of an element (speed 0..1)
   * - screen-in: TBD
   * @param {WindowDimensions} windowDimensions
   */
  applyEffects(windowDimensions) {
    for (const [element, params] of this.elementsWithEffectsMap) {
      // Handle viewport:
      // 1. Is the element in viewport (by saved measures, not dom lookup)?
      // 2. If it is not in viewport now, and wasn't in viewport the last time we checked, skip.
      //    We do this to avoid frame skips and miss the last animation in the viewport.
      // 3. save viewport state for next time.
      const inViewport = isInViewport(params, windowDimensions);
      if (!params.inViewport && !inViewport) {
        continue;
      }
      params.inViewport = inViewport;

      switch (params.effect) {
        // 'parallax':
        // -----------
        //  bg - the first child of a strip which its children are animated
        //  top - the element top
        //  speed - a number between 1 to 0 to indicate parallax speed, where 0 is static and 1 is fixed
        case 'parallax': {
          const bg = element.firstElementChild;
          const children = bg && bg.children || [];
          const { top, speed } = params;
          const distance = (windowDimensions.y - top) * speed;
          for (const child of children) {
            child.style.transform = `translateY(${distance}px)`;
          }
          break;
        }
        // 'slide-in':
        // -----------
        // direction - slide from [top, left, bottom, right]
        // top - the element top
        // left - the element left
        // bottom - the element bottom
        // right - the element right
        // threshold - a number between 1 to 0 to indicate where in the viewport the element should be back in its place, where 0 is bottom and 1 is top
        case 'slide-in': {
          const { top, left, bottom, right, direction, threshold } = params;
          const end = windowDimensions.height * threshold; // the y position where element should be with translateX(0)
          const current = windowDimensions.y + windowDimensions.height - top; // the current y position of the element
          const progress = Math.max(Math.min(current / end, 1), 0) // the percent of the animation we should be in, normalized
          const transforms = {
            top: `translateY(${-bottom * (1 - progress)}px)`,
            left: `translateX(${-right * (1 - progress)}px)`,
            bottom: `translateY(${(windowDimensions.height - (top - windowDimensions.y)) * (1 - progress)}px)`,
            right: `translateX(${(windowDimensions.width - left) * (1 - progress)}px)`
          };
          element.style.transform = transforms[direction] || '';
          break;
        }
      }
    };
  }

  /**
   * Pass scroll position to root element
   * @param {WindowDimensions} params
   */
  propagateScroll({ x, y }) {
    this.root.scrollTop = y;
    this.root.scrollLeft = x;

    // this.root.style.top = `${-y}px`;
    // this.root.style.left = `${-x}px`;

    //this.root.style.transform = `translateY(${-y}px) translateX(${-x}px)`;
  }
}
window.scrubEffects = new ScrubEffects(document.getElementById('root'));
