/**
 * Ueno Website - Main JavaScript Module
 * Handles all interactive functionality for the website
 */

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Debounce function to limit the rate of function execution
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Check if element is in viewport
 * @param {Element} element - Element to check
 * @param {number} threshold - Threshold percentage (0-1)
 * @returns {boolean} True if element is in viewport
 */
function isInViewport(element, threshold = 0.1) {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;
    
    return (
        rect.top <= windowHeight * (1 - threshold) &&
        rect.bottom >= windowHeight * threshold &&
        rect.left <= windowWidth &&
        rect.right >= 0
    );
}

// ========================================
// HAMBURGER MENU MODULE
// ========================================

class HamburgerMenu {
    constructor(element) {
        this.element = element;
        this.isActive = false;
        this.init();
    }

    init() {
        if (!this.element) return;
        
        this.bindEvents();
        this.setupAccessibility();
    }

    bindEvents() {
        this.element.addEventListener('click', this.handleClick.bind(this));
        this.element.addEventListener('keydown', this.handleKeydown.bind(this));
    }

    setupAccessibility() {
        this.element.setAttribute('aria-expanded', 'false');
        this.element.setAttribute('role', 'button');
    }

    handleClick(event) {
        event.preventDefault();
        this.toggle();
        this.addClickAnimation();
    }

    handleKeydown(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.toggle();
        }
    }

    toggle() {
        this.isActive = !this.isActive;
        this.element.classList.toggle('active');
        this.element.setAttribute('aria-expanded', this.isActive.toString());
        
        // Emit custom event for other modules to listen to
        this.element.dispatchEvent(new CustomEvent('menuToggle', {
            detail: { isActive: this.isActive }
        }));
    }

    addClickAnimation() {
        this.element.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.element.style.transform = 'scale(1)';
        }, 150);
    }
}

// ========================================
// SCROLL ANIMATION MODULE
// ========================================

class ScrollAnimations {
    constructor() {
        this.elements = [];
        this.observer = null;
        this.init();
    }

    init() {
        this.setupIntersectionObserver();
        this.bindScrollEvents();
    }

    setupIntersectionObserver() {
        const options = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateElement(entry.target);
                }
            });
        }, options);
    }

    bindScrollEvents() {
        // Debounced scroll handler for performance
        const handleScroll = debounce(() => {
            this.checkElementsInView();
        }, 16); // ~60fps

        window.addEventListener('scroll', handleScroll, { passive: true });
    }

    addElement(element, animationType = 'fadeInScale') {
        if (!element) return;
        
        this.elements.push({
            element,
            animationType,
            animated: false
        });
        
        this.observer.observe(element);
    }

    animateElement(element) {
        const elementData = this.elements.find(item => item.element === element);
        if (!elementData || elementData.animated) return;

        elementData.animated = true;
        element.classList.add('animate');
        
        // Remove from observer after animation
        this.observer.unobserve(element);
    }

    checkElementsInView() {
        this.elements.forEach(item => {
            if (!item.animated && isInViewport(item.element)) {
                this.animateElement(item.element);
            }
        });
    }
}

// ========================================
// SMOOTH SCROLL MODULE
// ========================================

class SmoothScroll {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Handle all anchor links
        document.addEventListener('click', this.handleLinkClick.bind(this));
    }

    handleLinkClick(event) {
        const link = event.target.closest('a[href^="#"]');
        if (!link) return;

        event.preventDefault();
        this.scrollToTarget(link.getAttribute('href'));
    }

    scrollToTarget(targetId) {
        const targetElement = document.querySelector(targetId);
        if (!targetElement) return;

        const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
        const targetPosition = targetElement.offsetTop - headerHeight - 20;

        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }
}

// ========================================
// PERFORMANCE MONITORING
// ========================================

class PerformanceMonitor {
    constructor() {
        this.init();
    }

    init() {
        // Monitor page load performance
        window.addEventListener('load', () => {
            this.logPerformanceMetrics();
        });
    }

    logPerformanceMetrics() {
        if ('performance' in window) {
            const perfData = performance.getEntriesByType('navigation')[0];
            console.log('Page Load Performance:', {
                domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
                loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
                totalTime: perfData.loadEventEnd - perfData.fetchStart
            });
        }
    }
}

// ========================================
// MAIN APPLICATION CLASS
// ========================================

class UenoApp {
    constructor() {
        this.modules = {};
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeModules());
        } else {
            this.initializeModules();
        }
    }

    initializeModules() {
        try {
            // Initialize all modules
            this.modules.hamburgerMenu = new HamburgerMenu(
                document.getElementById('hamburgerMenu')
            );
            
            this.modules.scrollAnimations = new ScrollAnimations();
            this.modules.smoothScroll = new SmoothScroll();
            this.modules.performanceMonitor = new PerformanceMonitor();

            // Add diagram circles to scroll animations
            const circles = document.querySelectorAll('.venn-diagram__circle--left, .venn-diagram__circle--right');
            circles.forEach(circle => {
                this.modules.scrollAnimations.addElement(circle, 'fadeInScale');
            });

            // Setup global error handling
            this.setupErrorHandling();

            console.log('Ueno App initialized successfully');
        } catch (error) {
            console.error('Error initializing Ueno App:', error);
        }
    }

    setupErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
        });
    }
}

// ========================================
// INITIALIZE APPLICATION
// ========================================

// Initialize the application
const app = new UenoApp();

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UenoApp, HamburgerMenu, ScrollAnimations, SmoothScroll };
}
