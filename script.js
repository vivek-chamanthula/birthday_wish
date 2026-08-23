// Global variables
let audioContext;
let analyser;
let microphone;
let isBlowing = false;
let blowThreshold = 40; // Adjust this sensitivity if needed (0-255)
const bgMusic = document.getElementById('bg-music');

// Transition Helper
function switchPhase(hideId, showId, onComplete) {
  const hidePhase = document.getElementById(hideId);
  const showPhase = document.getElementById(showId);
  
  gsap.to(hidePhase, {
    opacity: 0,
    duration: 1,
    onComplete: () => {
      hidePhase.classList.remove('active-phase');
      hidePhase.classList.add('hidden-phase');
      
      showPhase.classList.remove('hidden-phase');
      showPhase.classList.add('active-phase');
      
      gsap.to(showPhase, {
        opacity: 1,
        duration: 1,
        onComplete: onComplete
      });
    }
  });
}

// ==============================================
// PHASE 1 -> PHASE 2
// ==============================================
function startJourney() {
  // Start audio on first interaction (browser requirement)
  bgMusic.volume = 0.5;
  bgMusic.play().catch(e => console.log("Audio play failed:", e));
  
  // Heart explode animation
  gsap.to('.glowing-heart', {
    scale: 5,
    opacity: 0,
    duration: 1,
    ease: "power2.inOut",
    onComplete: () => {
      switchPhase('phase-1', 'phase-2', startTypewriter);
    }
  });
  gsap.to('.hint-text', { opacity: 0, duration: 0.5 });
}

function startTypewriter() {
  const lines = [
    { id: 'line1', text: "They say some people come into our lives and change everything..." },
    { id: 'line2', text: "For me..." },
    { id: 'line3', text: "That person is YOU." }
  ];
  
  let tl = gsap.timeline();
  
  lines.forEach((line, index) => {
    const el = document.getElementById(line.id);
    el.innerHTML = "";
    el.style.opacity = 1; // GSAP opacity fix
    
    // Typewriter effect using GSAP TextPlugin is best, but pure JS string manipulation is safer without extra plugins
    let splitText = line.text.split("");
    let duration = splitText.length * 0.05;
    
    tl.to(el, { opacity: 1, duration: 0.1 }); // just to make sure it's visible
    
    // Simple custom typewriter logic inside timeline via onStart/onUpdate
    tl.add(() => {
      let i = 0;
      let interval = setInterval(() => {
        el.innerHTML += splitText[i];
        i++;
        if(i === splitText.length) {
          clearInterval(interval);
        }
      }, 50);
    }, `+=${index === 0 ? 0 : 1}`);
    
    // Wait for typing to finish
    tl.to({}, { duration: duration + 1 });
  });
  
  // Show continue arrow
  tl.add(() => {
    const arrow = document.getElementById('continue-arrow');
    arrow.classList.remove('hidden-element');
    gsap.fromTo(arrow, {opacity: 0}, {opacity: 0.7, duration: 1});
  });
}

// ==============================================
// PHASE 2 -> PHASE 3
// ==============================================
function goToPhase3() {
  switchPhase('phase-2', 'phase-3', initPhotoStack);
}

function initPhotoStack() {
  gsap.to('.section-title', { opacity: 1, y: -20, duration: 1, ease: "power2.out" });
  
  const cards = document.querySelectorAll('.memory-card');
  // Stacking logic
  cards.forEach((card, i) => {
    // i=4 is bottom, i=0 is top
    let zIndex = cards.length - i;
    card.style.zIndex = zIndex;
    
    // Initial animation
    gsap.fromTo(card, 
      { y: 500, rotation: Math.random() * 20 - 10, opacity: 0 },
      { 
        y: i * -15, // stack them slightly upwards
        scale: 1 - (i * 0.05),
        rotation: (Math.random() * 6 - 3), // slight random rotation
        opacity: 1 - (i * 0.1),
        duration: 1, 
        delay: (cards.length - i) * 0.2, // bottom to top
        ease: "back.out(1.2)"
      }
    );
  });
  
  // Add touch/click event to top card to throw it away
  setupCardInteractions();
}

let currentCardIndex = 0;
function setupCardInteractions() {
  const container = document.getElementById('photo-stack');
  
  container.addEventListener('click', () => {
    const cards = document.querySelectorAll('.memory-card');
    if(currentCardIndex >= cards.length) return;
    
    const topCard = cards[currentCardIndex];
    
    // Throw away animation
    gsap.to(topCard, {
      x: (Math.random() > 0.5 ? 1 : -1) * 300,
      y: -200,
      rotation: (Math.random() > 0.5 ? 1 : -1) * 45,
      opacity: 0,
      duration: 0.8,
      ease: "power2.in"
    });
    
    currentCardIndex++;
    
    // Animate rest of cards up
    for(let i = currentCardIndex; i < cards.length; i++) {
      let indexInStack = i - currentCardIndex;
      gsap.to(cards[i], {
        y: indexInStack * -15,
        scale: 1 - (indexInStack * 0.05),
        opacity: 1 - (indexInStack * 0.1),
        duration: 0.5,
        ease: "power2.out"
      });
    }
    
    // If all cards gone, show button to next phase
    if(currentCardIndex >= cards.length) {
      document.getElementById('swipe-instruction').classList.add('hidden-element');
      const btn = document.getElementById('btn-to-letter');
      btn.classList.remove('hidden-element');
      gsap.fromTo(btn, {opacity: 0, y: 20}, {opacity: 1, y: 0, duration: 1});
    }
  });
}

// ==============================================
// PHASE 3 -> PHASE 4
// ==============================================
function goToPhase4() {
  switchPhase('phase-3', 'phase-4');
}

function openLetter() {
  const env = document.getElementById('envelope-wrapper');
  
  // Envelope opening animation
  gsap.to(env, {
    scale: 2,
    opacity: 0,
    duration: 1,
    onComplete: () => {
      env.classList.add('hidden-element');
      const letter = document.getElementById('letter-content');
      letter.classList.remove('hidden-element');
      
      // Fade in letter
      gsap.fromTo(letter, 
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 1.5 }
      );
    }
  });
}

// ==============================================
// PHASE 4 -> PHASE 5
// ==============================================
function goToPhase5() {
  switchPhase('phase-4', 'phase-5', requestMicAccess);
}

async function requestMicAccess() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    microphone = audioContext.createMediaStreamSource(stream);
    
    microphone.connect(analyser);
    analyser.fftSize = 256;
    
    // Start listening loop
    checkAudioLevel();
    
  } catch (err) {
    console.warn("Microphone access denied or not available.", err);
    // User can still tap the backup button
  }
}

function checkAudioLevel() {
  if (isBlowing) return; // Stop checking if already blown
  
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(dataArray);
  
  // Calculate average volume
  let sum = 0;
  for (let i = 0; i < bufferLength; i++) {
    sum += dataArray[i];
  }
  let average = sum / bufferLength;
  
  // If blowing detected (loud low frequency noise usually triggers this)
  if (average > blowThreshold) {
    forceBlowCandles();
  } else {
    requestAnimationFrame(checkAudioLevel);
  }
}

function forceBlowCandles() {
  if (isBlowing) return;
  isBlowing = true;
  
  const candles = document.querySelectorAll('.m-candle');
  candles.forEach((candle, i) => {
    gsap.to(candle, {
      opacity: 0,
      y: -20,
      duration: 0.5,
      delay: i * 0.1
    });
  });
  
  // Show smoke
  const smoke = document.getElementById('m-smoke');
  smoke.classList.remove('hidden-element');
  smoke.classList.add('show');
  
  // Pause Music to create silence effect
  gsap.to(bgMusic, { volume: 0, duration: 1, onComplete: () => bgMusic.pause() });
  
  // Transition to final phase after 2 seconds of silence
  setTimeout(() => {
    switchPhase('phase-5', 'phase-6', triggerFinale);
  }, 2500);
}

// ==============================================
// PHASE 6: FINALE
// ==============================================
function triggerFinale() {
  // Fire insane confetti
  var duration = 5 * 1000;
  var animationEnd = Date.now() + duration;
  var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  var interval = setInterval(function() {
    var timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    var particleCount = 50 * (timeLeft / duration);
    confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
    confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
  }, 250);
  
  // Animate elements in
  gsap.to('.pop-in', {
    scale: 1,
    opacity: 1,
    duration: 1,
    stagger: 0.3,
    ease: "back.out(1.5)"
  });
  
  // Play triumphant song or restart bgm loud
  bgMusic.volume = 1;
  bgMusic.play();
}
