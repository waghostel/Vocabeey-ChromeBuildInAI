// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      const navHeight = document.querySelector('.sticky-nav').offsetHeight;
      const targetPosition = target.offsetTop - navHeight - 20;
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth',
      });
    }
  });
});

// Back to top button
const backToTopButton = document.getElementById('back-to-top');

window.addEventListener('scroll', () => {
  if (window.pageYOffset > 300) {
    backToTopButton.classList.add('visible');
  } else {
    backToTopButton.classList.remove('visible');
  }
});

backToTopButton.addEventListener('click', () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
});

// FAQ accordion
const faqItems = document.querySelectorAll('.faq-item');

faqItems.forEach(item => {
  const question = item.querySelector('.faq-question');

  question.addEventListener('click', () => {
    const isActive = item.classList.contains('active');

    // Close all FAQ items
    faqItems.forEach(faq => {
      faq.classList.remove('active');
    });

    // Open clicked item if it wasn't active
    if (!isActive) {
      item.classList.add('active');
    }
  });
});

// Highlight active navigation link on scroll
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');

function highlightNavigation() {
  const scrollPosition = window.pageYOffset + 100;

  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.offsetHeight;
    const sectionId = section.getAttribute('id');

    if (
      scrollPosition >= sectionTop &&
      scrollPosition < sectionTop + sectionHeight
    ) {
      navLinks.forEach(link => {
        link.style.color = '';
        if (link.getAttribute('href') === `#${sectionId}`) {
          link.style.color = 'var(--primary-color)';
        }
      });
    }
  });
}

window.addEventListener('scroll', highlightNavigation);

// Add animation on scroll
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px',
};

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

// Observe elements for animation
const animateElements = document.querySelectorAll(
  '.step, .mode-card, .tip-card, .privacy-card, .learning-mode, .shortcut-category, .feature-card, .additional-feature-card'
);
animateElements.forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
  observer.observe(el);
});

// Demo navigation buttons (just for visual effect)
const navButtons = document.querySelectorAll('.nav-btn');
navButtons.forEach(button => {
  button.addEventListener('click', e => {
    e.preventDefault();
    // Just visual feedback, no actual navigation
    button.style.transform = 'scale(0.95)';
    setTimeout(() => {
      button.style.transform = '';
    }, 150);
  });
});

// Add keyboard shortcut hints animation
const kbdElements = document.querySelectorAll('kbd');
kbdElements.forEach((kbd, index) => {
  kbd.style.animationDelay = `${index * 0.05}s`;
});

// Mobile menu toggle (if needed in future)
const createMobileMenu = () => {
  const nav = document.querySelector('.nav-container');
  const navLinks = document.querySelector('.nav-links');

  if (
    window.innerWidth <= 768 &&
    !document.querySelector('.mobile-menu-toggle')
  ) {
    const menuToggle = document.createElement('button');
    menuToggle.className = 'mobile-menu-toggle';
    menuToggle.innerHTML = '☰';
    menuToggle.style.cssText = `
            display: block;
            background: none;
            border: none;
            font-size: 1.5rem;
            color: var(--primary-color);
            cursor: pointer;
        `;

    menuToggle.addEventListener('click', () => {
      navLinks.style.display =
        navLinks.style.display === 'flex' ? 'none' : 'flex';
      if (navLinks.style.display === 'flex') {
        navLinks.style.cssText = `
                    position: absolute;
                    top: 70px;
                    left: 0;
                    right: 0;
                    background: white;
                    flex-direction: column;
                    padding: 20px;
                    box-shadow: var(--shadow-lg);
                    gap: 16px;
                `;
      }
    });

    nav.insertBefore(menuToggle, navLinks);
  }
};

// Initialize mobile menu on load and resize
window.addEventListener('load', createMobileMenu);
window.addEventListener('resize', createMobileMenu);

// Add subtle parallax effect to hero section
const hero = document.querySelector('.hero');
if (hero) {
  window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallax = scrolled * 0.5;
    hero.style.transform = `translateY(${parallax}px)`;
  });
}

// Add copy functionality to code blocks
const codeBlocks = document.querySelectorAll('code');
codeBlocks.forEach(code => {
  if (code.textContent.includes('chrome://')) {
    code.style.cursor = 'pointer';
    code.title = 'Click to copy';

    code.addEventListener('click', () => {
      navigator.clipboard.writeText(code.textContent).then(() => {
        const originalText = code.textContent;
        code.textContent = 'Copied!';
        code.style.background = '#d1fae5';

        setTimeout(() => {
          code.textContent = originalText;
          code.style.background = '';
        }, 1500);
      });
    });
  }
});

// Add hover effect to feature cards
const featureCards = document.querySelectorAll(
  '.feature-card, .additional-feature-card'
);
featureCards.forEach(card => {
  card.addEventListener('mouseenter', () => {
    card.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
  });
});

// Console easter egg
console.log(
  '%c🐝 Vocabeey User Guide',
  'font-size: 20px; font-weight: bold; color: #6366f1;'
);
console.log(
  '%cThanks for checking out the console! 👋',
  'font-size: 14px; color: #6b7280;'
);
console.log(
  "%cIf you're interested in contributing, visit: https://github.com/yourusername/vocabeey",
  'font-size: 12px; color: #8b5cf6;'
);

// Track scroll depth (for analytics if needed)
let maxScrollDepth = 0;
window.addEventListener('scroll', () => {
  const scrollDepth =
    ((window.pageYOffset + window.innerHeight) /
      document.documentElement.scrollHeight) *
    100;
  if (scrollDepth > maxScrollDepth) {
    maxScrollDepth = scrollDepth;
    // Could send to analytics here
    if (maxScrollDepth > 25 && maxScrollDepth < 30) {
      console.log('User scrolled 25% of the page');
    }
    if (maxScrollDepth > 50 && maxScrollDepth < 55) {
      console.log('User scrolled 50% of the page');
    }
    if (maxScrollDepth > 75 && maxScrollDepth < 80) {
      console.log('User scrolled 75% of the page');
    }
    if (maxScrollDepth > 95) {
      console.log('User reached the bottom of the page');
    }
  }
});

// Add loading animation
window.addEventListener('load', () => {
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.5s ease-in';

  setTimeout(() => {
    document.body.style.opacity = '1';
  }, 100);
});

// Prevent default behavior on demo buttons
document.querySelectorAll('.browser-mockup, .navigation-demo').forEach(demo => {
  demo.addEventListener('click', e => {
    e.preventDefault();
  });
});

// Handle "Coming soon" alerts for Chrome Web Store buttons
const comingSoonButtons = document.querySelectorAll('.coming-soon-btn');
comingSoonButtons.forEach(button => {
  button.addEventListener('click', e => {
    e.preventDefault();
    alert(
      'Coming soon! 🚀\n\nVocabeey will be available on the Chrome Web Store soon.\n\nFor now, you can install it from the GitHub repository.'
    );
  });
});

// Handle nav install button
const navInstallBtn = document.getElementById('nav-install-btn');
if (navInstallBtn) {
  navInstallBtn.addEventListener('click', e => {
    // Scroll to install section first
    const installSection = document.getElementById('install');
    if (installSection) {
      const navHeight = document.querySelector('.sticky-nav').offsetHeight;
      const targetPosition = installSection.offsetTop - navHeight - 20;
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth',
      });
    }
  });
}
