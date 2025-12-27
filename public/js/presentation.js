// Presentation JavaScript

// State
let slides = [];
let currentSlideIndex = 0;
let settings = {};
let isMusicPlaying = false;
let musicStarted = false;
let touchStartX = 0;
let touchEndX = 0;
let autoAdvanceTimer = null;
let autoAdvanceDelay = 6000; // 6 seconds per slide

// Romantic transition types
const romanticTransitions = [
  'fade-scale',    // Dreamy fade with scale
  'slide-left',    // Classic slide
  'slide-up',      // Rising love
  'zoom',          // Heartbeat zoom
  'rotate',        // Waltz rotation
  'blur',          // Soft focus
  'flip',          // Page turn
  'crossfade',     // Gentle crossfade
  'diagonal',      // Playful diagonal
  'expand',        // Heart growing
  'curtain',       // Reveal curtain
  'float'          // Ascending float
];

let currentTransition = romanticTransitions[0];

// DOM Elements
const loadingScreen = document.getElementById('loadingScreen');
const noContentScreen = document.getElementById('noContentScreen');
const presentationContainer = document.getElementById('presentationContainer');
const progressBar = document.getElementById('progressBar');
const progressContainer = document.getElementById('progressContainer');
const musicToggle = document.getElementById('musicToggle');
const musicIcon = document.getElementById('musicIcon');
const backgroundMusic = document.getElementById('backgroundMusic');
const navHint = document.getElementById('navHint');
const confettiCanvas = document.getElementById('confettiCanvas');

// Initialize
document.addEventListener('DOMContentLoaded', init);

async function init() {
  await fetchData();
  
  if (slides.length === 0) {
    loadingScreen.classList.add('hide');
    noContentScreen.style.display = 'flex';
    progressContainer.style.display = 'none';
    return;
  }

  renderSlides();
  setupEventListeners();
  setupMusic();
  setRandomTransition();
  
  // Hide loading screen and start auto-advance
  setTimeout(() => {
    loadingScreen.classList.add('hide');
    updateProgress();
    startAutoAdvance();
    // Auto-start music when presentation begins
    tryStartMusic();
  }, 1500);
}

async function fetchData() {
  try {
    const [slidesRes, settingsRes] = await Promise.all([
      fetch('/api/slides'),
      fetch('/api/settings')
    ]);

    slides = await slidesRes.json();
    settings = await settingsRes.json();

    // Update page title
    if (settings.siteTitle) {
      document.title = settings.siteTitle;
    }
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

function renderSlides() {
  presentationContainer.innerHTML = slides.map((slide, index) => {
    const activeClass = index === 0 ? 'active' : '';
    return generateSlideHTML(slide, index, activeClass);
  }).join('');
}

function generateSlideHTML(slide, index, activeClass) {
  const bgClass = slide.imageUrl && ['cover', 'photo'].includes(slide.type) 
    ? 'has-bg-image' 
    : slide.backgroundColor || 'gradient-1';

  switch (slide.type) {
    case 'cover':
      return `
        <div class="slide ${bgClass} ${activeClass}" data-index="${index}">
          ${slide.imageUrl ? `
            <div class="slide-image-container">
              <img src="${slide.imageUrl}" alt="" class="slide-image" loading="lazy">
              <div class="slide-image-overlay"></div>
            </div>
          ` : ''}
          <div class="slide-content">
            <h1 class="slide-title">${slide.title || ''}</h1>
            <p class="slide-subtitle">${slide.subtitle || ''}</p>
          </div>
        </div>
      `;

    case 'photo':
      return `
        <div class="slide has-bg-image ${activeClass}" data-index="${index}">
          <div class="slide-image-container">
            <img src="${slide.imageUrl || ''}" alt="" class="slide-image" loading="lazy">
            <div class="slide-image-overlay"></div>
          </div>
          <div class="slide-caption">
            <h2 class="slide-title">${slide.title || ''}</h2>
            <p class="slide-subtitle">${slide.subtitle || ''}</p>
          </div>
        </div>
      `;

    case 'stat':
      return `
        <div class="slide ${bgClass} ${activeClass}" data-index="${index}">
          <div class="slide-content">
            <h1 class="slide-title">${slide.title || 'Our Numbers'}</h1>
            <p class="slide-subtitle">${slide.subtitle || ''}</p>
            <div class="stats-grid">
              ${(slide.stats || []).map(stat => `
                <div class="stat-item">
                  <div class="stat-value">${stat.value}</div>
                  <div class="stat-label">${stat.label}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;

    case 'quote':
      return `
        <div class="slide ${bgClass} ${activeClass}" data-index="${index}">
          <div class="slide-content">
            <div class="quote-container">
              <span class="quote-mark">"</span>
              <p class="quote-text">${slide.content || slide.title || ''}</p>
            </div>
            ${slide.subtitle ? `<p class="slide-subtitle" style="margin-top: 20px;">— ${slide.subtitle}</p>` : ''}
          </div>
        </div>
      `;

    case 'message':
      return `
        <div class="slide ${bgClass} ${activeClass}" data-index="${index}">
          <div class="slide-content">
            <div class="message-content">
              ${slide.imageUrl ? `<img src="${slide.imageUrl}" alt="" class="message-image" loading="lazy">` : ''}
              <h2 class="slide-title">${slide.title || ''}</h2>
              <p class="message-text">${slide.content || ''}</p>
            </div>
          </div>
        </div>
      `;

    case 'closing':
      return `
        <div class="slide ${bgClass} ${activeClass}" data-index="${index}" data-closing="true">
          <div class="slide-content">
            <div class="closing-content">
              <div class="closing-heart">💕</div>
              <h1 class="closing-title">${slide.title || 'Thank You'}</h1>
              <p class="closing-message">${slide.content || ''}</p>
            </div>
          </div>
        </div>
      `;

    default:
      return `
        <div class="slide ${bgClass} ${activeClass}" data-index="${index}">
          <div class="slide-content">
            <h1 class="slide-title">${slide.title || ''}</h1>
            <p class="slide-text">${slide.content || slide.subtitle || ''}</p>
          </div>
        </div>
      `;
  }
}

function setupEventListeners() {
  // Click/tap to advance
  // Click/tap to advance (optional manual control)
  presentationContainer.addEventListener('click', handleTap);
  
  // Touch events for swipe
  presentationContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
  presentationContainer.addEventListener('touchend', handleTouchEnd, { passive: true });
  
  // Keyboard navigation
  document.addEventListener('keydown', handleKeydown);
  
  // Music toggle
  musicToggle.addEventListener('click', handleMusicToggleClick);
  
  // Hide nav hint after a few seconds
  setTimeout(() => {
    navHint.style.opacity = '0';
    setTimeout(() => { navHint.style.display = 'none'; }, 500);
  }, 4000);
}

function handleMusicToggleClick(e) {
  e.stopPropagation(); // Don't trigger slide advance
  toggleMusic();
}

function handleTap(e) {
  // Start music on first interaction (browsers require user gesture)
  tryStartMusic();
  
  // Visual feedback
  const slide = document.querySelector('.slide.active');
  slide.classList.add('touched');
  setTimeout(() => slide.classList.remove('touched'), 300);

  // Determine direction based on tap position
  const tapX = e.clientX;
  const screenWidth = window.innerWidth;
  
  if (tapX < screenWidth * 0.3) {
    prevSlide();
    resetAutoAdvance();
  } else {
    nextSlide();
    resetAutoAdvance();
  }
}

function handleTouchStart(e) {
  touchStartX = e.changedTouches[0].screenX;
}

function handleTouchEnd(e) {
  touchEndX = e.changedTouches[0].screenX;
  handleSwipe();
}

function handleSwipe() {
  const swipeThreshold = 50;
  const diff = touchStartX - touchEndX;

  if (Math.abs(diff) > swipeThreshold) {
    // Start music on first interaction
    tryStartMusic();
    
    if (diff > 0) {
      nextSlide();
      resetAutoAdvance();
    } else {
      prevSlide();
      resetAutoAdvance();
    }
  }
}

function handleKeydown(e) {
  // Start music on first interaction
  tryStartMusic();
  
  switch (e.key) {
    case 'ArrowRight':
    case ' ':
      e.preventDefault();
      nextSlide();
      resetAutoAdvance();
      break;
    case 'ArrowLeft':
      e.preventDefault();
      prevSlide();
      resetAutoAdvance();
      break;
  }
}

function nextSlide() {
  if (currentSlideIndex < slides.length - 1) {
    goToSlide(currentSlideIndex + 1);
  } else {
    // Stop auto-advance at the end
    stopAutoAdvance();
  }
}

function prevSlide() {
  if (currentSlideIndex > 0) {
    goToSlide(currentSlideIndex - 1);
  }
}

function goToSlide(index) {
  const slideElements = document.querySelectorAll('.slide');
  
  // Set a new random transition for this slide change
  setRandomTransition();
  
  // Remove active and add exit class to current slide
  slideElements[currentSlideIndex].classList.remove('active');
  slideElements[currentSlideIndex].classList.add('exit');

  // Update index
  currentSlideIndex = index;

  // Add active class to new slide
  slideElements[currentSlideIndex].classList.remove('exit');
  slideElements[currentSlideIndex].classList.add('active');

  // Update progress
  updateProgress();

  // Check for closing slide (confetti and stop auto-advance)
  const currentSlide = slideElements[currentSlideIndex];
  if (currentSlide.dataset.closing === 'true') {
    setTimeout(triggerConfetti, 500);
    stopAutoAdvance();
  }

  // Clean up exit classes after animation
  setTimeout(() => {
    slideElements.forEach((slide, i) => {
      if (i !== currentSlideIndex) {
        slide.classList.remove('exit');
      }
    });
  }, 900);
}

function updateProgress() {
  const progress = ((currentSlideIndex + 1) / slides.length) * 100;
  progressBar.style.width = `${progress}%`;
}

// Auto-advance Functions
function startAutoAdvance() {
  stopAutoAdvance(); // Clear any existing timer
  autoAdvanceTimer = setInterval(() => {
    nextSlide();
  }, autoAdvanceDelay);
}

function stopAutoAdvance() {
  if (autoAdvanceTimer) {
    clearInterval(autoAdvanceTimer);
    autoAdvanceTimer = null;
  }
}

function resetAutoAdvance() {
  // Reset timer when user manually navigates
  if (autoAdvanceTimer) {
    startAutoAdvance();
  }
}

// Transition Functions
function setRandomTransition() {
  // Remove previous transition class
  presentationContainer.classList.forEach(cls => {
    if (cls.startsWith('transition-')) {
      presentationContainer.classList.remove(cls);
    }
  });
  
  // Pick a random transition
  const randomIndex = Math.floor(Math.random() * romanticTransitions.length);
  currentTransition = romanticTransitions[randomIndex];
  presentationContainer.classList.add(`transition-${currentTransition}`);
}

// Music Functions
function setupMusic() {
  if (settings.backgroundMusicEnabled && settings.backgroundMusicUrl) {
    musicToggle.style.display = 'flex';
    backgroundMusic.src = settings.backgroundMusicUrl;
    
    // Try to autoplay (will likely fail due to browser policy, but worth trying)
    backgroundMusic.play().then(() => {
      isMusicPlaying = true;
      musicStarted = true;
      musicIcon.textContent = '🔊';
      musicToggle.classList.add('playing');
    }).catch(() => {
      // Autoplay blocked - will start on first user interaction
      console.log('Autoplay blocked - music will start on first interaction');
    });
  }
}

// Try to start music on first user interaction
function tryStartMusic() {
  if (!musicStarted && settings.backgroundMusicEnabled && settings.backgroundMusicUrl) {
    musicStarted = true;
    backgroundMusic.play().then(() => {
      isMusicPlaying = true;
      musicIcon.textContent = '🔊';
      musicToggle.classList.add('playing');
    }).catch(console.error);
  }
}

function toggleMusic() {
  if (isMusicPlaying) {
    backgroundMusic.pause();
    musicIcon.textContent = '🔇';
    musicToggle.classList.remove('playing');
  } else {
    backgroundMusic.play().catch(console.error);
    musicIcon.textContent = '🔊';
    musicToggle.classList.add('playing');
  }
  isMusicPlaying = !isMusicPlaying;
}

// Confetti Animation
function triggerConfetti() {
  const ctx = confettiCanvas.getContext('2d');
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;

  const confettiPieces = [];
  const colors = ['#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#00bcd4', '#4caf50', '#ffeb3b', '#ff9800', '#f44336'];

  // Create confetti pieces
  for (let i = 0; i < 150; i++) {
    confettiPieces.push({
      x: Math.random() * confettiCanvas.width,
      y: Math.random() * confettiCanvas.height - confettiCanvas.height,
      size: Math.random() * 10 + 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedY: Math.random() * 3 + 2,
      speedX: Math.random() * 2 - 1,
      rotation: Math.random() * 360,
      rotationSpeed: Math.random() * 10 - 5
    });
  }

  let animationFrame;
  
  function animate() {
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    let stillAnimating = false;

    confettiPieces.forEach(piece => {
      piece.y += piece.speedY;
      piece.x += piece.speedX;
      piece.rotation += piece.rotationSpeed;

      if (piece.y < confettiCanvas.height + 50) {
        stillAnimating = true;
      }

      ctx.save();
      ctx.translate(piece.x, piece.y);
      ctx.rotate(piece.rotation * Math.PI / 180);
      ctx.fillStyle = piece.color;
      ctx.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size * 0.6);
      ctx.restore();
    });

    if (stillAnimating) {
      animationFrame = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(animationFrame);
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
  }

  animate();
}

// Handle window resize
window.addEventListener('resize', () => {
  if (confettiCanvas.getContext) {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }
});
