import {getElementRect} from './domMeasurements.js'

function onReady(func) {
  if (document.readyState === "loading") {
    // Loading hasn't finished yet
    document.addEventListener("DOMContentLoaded", () => func());
  } else {
    // `DOMContentLoaded` has already fired
    func();
  }
}

function getWindowSize() {
  return {
    width: window.innerWidth,
    height: window.innerHeight
  };
}

function getWindowScroll() {
  return {
    y: window.pageYOffset,
    x: window.pageXOffset
  };
}

function getElementsWithEffects(root) {
  return new Map(
    [...root.querySelectorAll("[data-effect]")].map(element => {
      return [
        element,
        {
          ...getElementRect(element, root),
          ...element.dataset
        }
      ];
    })
  );
}

class AnimationManager {
  constructor(root) {
    this.waitingForNextAF = null;
    this.windowScrollAndSize = {};
    this.elementsWithEffectsMap = [];
    this.root = root;

    onReady(() => {
      window.addEventListener("scroll", this.doOnNextRAF.bind(this));
      window.addEventListener("resize", this.init.bind(this));
      this.init();
    });
  }

  init() {
    this.windowScrollAndSize = { ...getWindowSize(), ...getWindowScroll() };
    this.elementsWithEffectsMap = getElementsWithEffects(this.root);
    this.doScroll(this.windowScrollAndSize);
    this.doOnNextRAF();
  }

  doOnNextRAF() {
    if (!this.waitingForNextAF) {
      this.waitingForNextAF = true;
      requestAnimationFrame(() => {
        this.windowScrollAndSize = { ...this.windowScrollAndSize, ...getWindowScroll() };
        this.doScroll(this.windowScrollAndSize);
        this.doAnimations(this.windowScrollAndSize);
        this.waitingForNextAF = false;
      });
    }
  }

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

  doScroll({ x, y }) {
    this.root.scrollTop = y;
    this.root.scrollLeft = x;
    //root.style.top = `-${y}px`
    //root.style.transform = `translateY(-${y}px)`;
  }
}
const animation = new AnimationManager(document.getElementById('root'))