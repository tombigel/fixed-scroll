import { getElementRect } from "./domMeasurements.js";
import { onReady, getWindowSize, getWindowScroll } from "./utils.js";

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
class ScrubAnimations {
  constructor(root) {
    // Flag to know if animation already requested
    this.waitingForNextAF = false;
    // Store for window dimensions and scroll
    this.windowScrollAndSize = {};
    // Store for elements that should animate
    this.elementsWithEffectsMap = [];
    // The animation root scrollable component
    this.root = root;

    // Wait for document ready
    onReady(() => {
      // On scroll do all the things
      window.addEventListener("scroll", () => this.doOnNextRAF());
      // On resize measure window again
      window.addEventListener("resize", () => {
        this.windowScrollAndSize = { ...getWindowSize(), ...getWindowScroll() };
        this.elementsWithEffectsMap = this.getElementsWithEffects();
        this.doOnNextRAF();
      });
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
    this.windowScrollAndSize = { ...getWindowSize(), ...getWindowScroll() };
    this.elementsWithEffectsMap = this.getElementsWithEffects();
    this.doScroll(this.windowScrollAndSize);
    this.doOnNextRAF();
  }

  /**
   * Collect animatable elements
   * Using data-* for annotations:
   * - data-effect is the effect name "doAnimations()" should handle
   * - data-* are animation parameters to expose
   * @returns {Map<HTMLElement, ElementAnimationParameters>}
   */
  getElementsWithEffects() {
    const elements = this.root.querySelectorAll("[data-effect]");
    const entries = [...elements].map(element => [
      element,
      {
        ...getElementRect(element, this.root),
        ...element.dataset
      }
    ]);

    return new Map(entries);
  }

  /**
   * Throttle and debounce scroll and animations to next animation frame
   */
  doOnNextRAF() {
    if (!this.waitingForNextAF) {
      this.waitingForNextAF = true;
      requestAnimationFrame(() => {
        // Remeasure scroll closer to animation
        this.windowScrollAndSize = {
          ...this.windowScrollAndSize,
          ...getWindowScroll()
        };
        // Scroll...
        this.doScroll(this.windowScrollAndSize);
        // ...then animate
        this.doAnimations(this.windowScrollAndSize);
        // Release debounce flag
        this.waitingForNextAF = false;
      });
    }
  }

  /**
   * Logic to execute animations.
   * Supported effects:
   * - parallax: will apply a parallax effect on the first child of an element (speed 0..1)
   * - screen-in: TBD
   * @param {WindowDimensions} params
   */
  doAnimations({ x, y, width, height }) {
    this.elementsWithEffectsMap.forEach((params, element) => {
      switch (params.effect) {
        case "parallax": {
          const bg = element.firstElementChild;
          const { top, speed } = params;
          const distance = (y - top) * speed;
          bg.style.transform = `translateY(${distance}px)`;
        }
        case "slide-in": {
          const { direction, threshold } = params;
        }
      }
    });
  }

  /**
   * Pass scroll position to root element
   * @param {WindowDimensions} params
   */
  doScroll({ x, y, width, height }) {
    this.root.scrollTop = y;
    this.root.scrollLeft = x;
    //root.style.top = `-${y}px`
    //root.style.transform = `translateY(-${y}px)`;
  }
}
window.animation = new ScrubAnimations(document.getElementById("root"));
