function getBorderSizes(element) {
    const computedStyle = window.getComputedStyle(element)
    return {
        top: parseFloat(computedStyle.getPropertyValue('border-top-width'), 10),
        left: parseFloat(computedStyle.getPropertyValue('border-left-width'), 10)
    }
}

const hasOverflow = child => window.getComputedStyle(child).getPropertyValue('overflow') === 'visible'

const getChildren = (element, tagName) => Array.from(element.children).filter(child => child.tagName.toLowerCase() === tagName)

/**
 * Get an element dimensions and position relative to the *document* root and while ignoring all transforms
 * NOTE: To calculate relative to window, use getBoundingRect
 * @param {HTMLElement} element
 * @param {HTMLElement} [offsetParent] the topmost offset parent to calculate position against, if passed an element which is not an offset parent or not a parent of element will be ignored.
 * @returns {{top: number, left: number, width: number, height: number, bottom: number, right: number}}
 */
function getElementRect(element, offsetParent) {
    let top = element.offsetTop
    let left = element.offsetLeft

    const width = element.offsetWidth
    const height = element.offsetHeight

    while (element.offsetParent) {
        element = element.offsetParent
        const border = getBorderSizes(element)
        top += border.top
        left += border.left

        if (offsetParent && element === offsetParent) {
            break
        }

        top += element.offsetTop
        left += element.offsetLeft
    }

    return {
        top,
        left,
        width,
        height,
        bottom: top + height,
        right: left + width
    }
}

/**
 * Get an element dimensions and position relative to the *window* and while ignoring all transforms
 * @param {HTMLElement} element
 * @param {HTMLElement} [offsetParent] optional topmost offset parent to calculate position against, if passed an element which is not an offset parent or not a parent of element will be ignored.
 * @param {window|HTMLElement} [scrollContainer] optional alternative element to calculate scroll from. Can also be used to mock window
 * @returns {{top: number, left: number, width: number, height: number, bottom: number, right: number}}
 */
function getBoundingRect(element, offsetParent, scrollContainer) {
    scrollContainer = scrollContainer || typeof window !== 'undefined' && window
    const elementRect = getElementRect(element, offsetParent)
    if (scrollContainer) {
        const scrollY = scrollContainer.scrollY || scrollContainer.scrollTop || 0
        const scrollX = scrollContainer.scrollX || scrollContainer.scrollLeft || 0

        elementRect.top -= scrollY
        elementRect.bottom -= scrollY
        elementRect.left -= scrollX
        elementRect.right -= scrollX
    }
    return elementRect
}

/**
 * Get an element and all it's children dimensions and position relative to the *document* root and while ignoring all transforms
 * @param {HTMLElement} element
 * @param {Array<HTMLElement>} [elementChildren] for recursion
 * @param {HTMLElement} [offsetParent] the topmost offset parent to calculate position against, if passed an element which is not an offset parent or not a parent of element will be ignored.
 * @param {{top: number, left: number, width: number, height: number, bottom: number, right: number}} [contentRect] for recursion
 * @returns {{top: number, left: number, width: number, height: number, bottom: number, right: number}}
 */
function getContentRect(element, offsetParent, elementChildren, contentRect) {
    // If this is the firs time we run, calculate this element's bounds
    contentRect = contentRect || getElementRect(element, offsetParent)
    // Get all 'div' immediate children if not passed by the function
    elementChildren = elementChildren || getChildren(element, 'div')

    elementChildren.forEach(child => {
        const rect = getElementRect(child, offsetParent)
        // If child has no size, meaning it is hidden, don't calculate it
        if (rect.width > 0 && rect.height > 0) {
            if (rect.left < contentRect.left) {
                contentRect.left = rect.left
            }
            if (rect.right > contentRect.right) {
                contentRect.right = rect.right
            }
            if (rect.top < contentRect.top) {
                contentRect.top = rect.top
            }
            if (rect.bottom > contentRect.bottom) {
                contentRect.bottom = rect.bottom
            }
        }

        const grandChildren = getChildren(child, 'div')
        // if a child has children and it's overflow value is not 'hidden', calculate their sizes too
        if (grandChildren.length && hasOverflow(child)) {
            getContentRect(child, offsetParent, grandChildren, contentRect)
        }
    })
    contentRect.width = contentRect.right - contentRect.left
    contentRect.height = contentRect.bottom - contentRect.top

    return contentRect
}

/**
 * Get an element and all it's children dimensions and position relative to the *window* and while ignoring all transforms
 * @param {HTMLElement} element
 * @param {HTMLElement} [offsetParent] the topmost offset parent to calculate position against, if passed an element which is not an offset parent or not a parent of element will be ignored.
 * @param {window|HTMLElement} [scrollContainer] optional alternative element to calculate scroll from. Can also be used to mock window
 * @returns {{top: number, left: number, width: number, height: number, bottom: number, right: number}}
 */
function getBoundingContentRect(element, offsetParent, scrollContainer) {
    scrollContainer = scrollContainer || typeof window !== 'undefined' && window
    const elementRect = getContentRect(element, offsetParent)
    if (scrollContainer) {
        const scrollY = scrollContainer.pageYOffset || scrollContainer.scrollTop || 0
        const scrollX = scrollContainer.pageXOffset || scrollContainer.scrollLeft || 0

        elementRect.top -= scrollY
        elementRect.bottom -= scrollY
        elementRect.left -= scrollX
        elementRect.right -= scrollX
    }
    return elementRect
}

export {
    getElementRect,
    getBoundingRect,
    getContentRect,
    getBoundingContentRect
}
