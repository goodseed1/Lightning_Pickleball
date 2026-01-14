/**
 * Lightning Tennis Landing Page
 * Simple scroll animations and interactions
 */

// Intersection Observer for scroll animations
document.addEventListener('DOMContentLoaded', function () {
  // Add visible class to feature sections when they enter viewport
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15,
  };

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, observerOptions);

  // Observe all feature sections
  document.querySelectorAll('.feature-section').forEach(section => {
    observer.observe(section);
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    });
  });

  // Hide scroll indicator when user scrolls
  const scrollIndicator = document.querySelector('.scroll-indicator');
  if (scrollIndicator) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 100) {
        scrollIndicator.style.opacity = '0';
        scrollIndicator.style.pointerEvents = 'none';
      } else {
        scrollIndicator.style.opacity = '1';
        scrollIndicator.style.pointerEvents = 'auto';
      }
    });
  }

  // Console greeting
  console.log('%c⚡ Lightning Tennis', 'color: #FFD700; font-size: 24px; font-weight: bold;');
  console.log('%c당신이 바로 커뮤니티의 중심입니다.', 'color: #B3B3B3; font-size: 14px;');
});
