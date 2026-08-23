import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import confetti from 'canvas-confetti';
import './index.css';

import img1 from './assets/image.png';
import img2 from './assets/image copy.png';
import img3 from './assets/image copy 2.png';
import img4 from './assets/image copy 3.png';
import img5 from './assets/image copy 4.png';

function App() {
  const [phase, setPhase] = useState(1);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isBlowing, setIsBlowing] = useState(false);
  
  const bgMusicRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneRef = useRef(null);
  const animationFrameRef = useRef(null);
  
  const blowThreshold = 40;
  
  const switchPhase = (nextPhase, onComplete) => {
    const currentEl = document.getElementById(`phase-${phase}`);
    const nextEl = document.getElementById(`phase-${nextPhase}`);
    
    gsap.to(currentEl, {
      opacity: 0,
      duration: 1,
      onComplete: () => {
        setPhase(nextPhase);
        // Wait for React to render the next phase active
        setTimeout(() => {
          gsap.to(document.getElementById(`phase-${nextPhase}`), {
            opacity: 1,
            duration: 1,
            onComplete
          });
        }, 50);
      }
    });
  };

  // Phase 1 -> 2
  const startJourney = () => {
    if (bgMusicRef.current) {
      bgMusicRef.current.volume = 0.5;
      bgMusicRef.current.play().catch(e => console.log("Audio play failed:", e));
    }
    
    gsap.to('.glowing-heart', {
      scale: 5,
      opacity: 0,
      duration: 1,
      ease: "power2.inOut",
      onComplete: () => {
        switchPhase(2, startTypewriter);
      }
    });
    gsap.to('.hint-text', { opacity: 0, duration: 0.5 });
  };

  const startTypewriter = () => {
    const lines = [
      { id: 'line1', text: "They say some people come into our lives and change everything..." },
      { id: 'line2', text: "For me..." },
      { id: 'line3', text: "That person is YOU." }
    ];
    
    let tl = gsap.timeline();
    
    lines.forEach((line, index) => {
      const el = document.getElementById(line.id);
      if(!el) return;
      el.innerHTML = "";
      el.style.opacity = 1;
      
      let splitText = line.text.split("");
      let duration = splitText.length * 0.05;
      
      tl.to(el, { opacity: 1, duration: 0.1 });
      
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
      
      tl.to({}, { duration: duration + 1 });
    });
    
    tl.add(() => {
      const arrow = document.getElementById('continue-arrow');
      if(arrow) {
        arrow.classList.remove('hidden-element');
        gsap.fromTo(arrow, {opacity: 0}, {opacity: 0.7, duration: 1});
      }
    });
  };

  // Phase 2 -> 3
  const goToPhase3 = () => {
    switchPhase(3, initPhotoStack);
  };

  const initPhotoStack = () => {
    gsap.to('.section-title', { opacity: 1, y: -20, duration: 1, ease: "power2.out" });
    
    const cards = document.querySelectorAll('.memory-card');
    cards.forEach((card, i) => {
      let zIndex = cards.length - i;
      card.style.zIndex = zIndex;
      
      gsap.fromTo(card, 
        { y: 500, rotation: Math.random() * 20 - 10, opacity: 0 },
        { 
          y: i * -15,
          scale: 1 - (i * 0.05),
          rotation: (Math.random() * 6 - 3),
          opacity: 1 - (i * 0.1),
          duration: 1, 
          delay: (cards.length - i) * 0.2,
          ease: "back.out(1.2)"
        }
      );
    });
  };

  const handleCardClick = () => {
    const cards = document.querySelectorAll('.memory-card');
    if(currentCardIndex >= cards.length) return;
    
    const topCard = cards[currentCardIndex];
    
    gsap.to(topCard, {
      x: (Math.random() > 0.5 ? 1 : -1) * 300,
      y: -200,
      rotation: (Math.random() > 0.5 ? 1 : -1) * 45,
      opacity: 0,
      duration: 0.8,
      ease: "power2.in"
    });
    
    const nextIndex = currentCardIndex + 1;
    setCurrentCardIndex(nextIndex);
    
    for(let i = nextIndex; i < cards.length; i++) {
      let indexInStack = i - nextIndex;
      gsap.to(cards[i], {
        y: indexInStack * -15,
        scale: 1 - (indexInStack * 0.05),
        opacity: 1 - (indexInStack * 0.1),
        duration: 0.5,
        ease: "power2.out"
      });
    }
    
    if(nextIndex >= cards.length) {
      document.getElementById('swipe-instruction')?.classList.add('hidden-element');
      const btn = document.getElementById('btn-to-letter');
      if(btn) {
        btn.classList.remove('hidden-element');
        gsap.fromTo(btn, {opacity: 0, y: 20}, {opacity: 1, y: 0, duration: 1});
      }
    }
  };

  // Phase 3 -> 4
  const goToPhase4 = () => switchPhase(4);

  const openLetter = () => {
    const env = document.getElementById('envelope-wrapper');
    gsap.to(env, {
      scale: 2,
      opacity: 0,
      duration: 1,
      onComplete: () => {
        env.classList.add('hidden-element');
        const letter = document.getElementById('letter-content');
        if(letter) {
          letter.classList.remove('hidden-element');
          gsap.fromTo(letter, 
            { opacity: 0, y: 50 },
            { opacity: 1, y: 0, duration: 1.5 }
          );
        }
      }
    });
  };

  // Phase 4 -> 5
  const goToPhase5 = () => {
    switchPhase(5, requestMicAccess);
  };

  const requestMicAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      
      microphoneRef.current.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      
      checkAudioLevel();
    } catch (err) {
      console.warn("Microphone access denied or not available.", err);
    }
  };

  const checkAudioLevel = () => {
    if (isBlowing) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    let average = sum / bufferLength;
    
    if (average > blowThreshold) {
      forceBlowCandles();
    } else {
      animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
    }
  };

  const forceBlowCandles = () => {
    if (isBlowing) return;
    setIsBlowing(true);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    
    const candles = document.querySelectorAll('.m-candle');
    candles.forEach((candle, i) => {
      gsap.to(candle, {
        opacity: 0,
        y: -20,
        duration: 0.5,
        delay: i * 0.1
      });
    });
    
    const smoke = document.getElementById('m-smoke');
    if(smoke) {
      smoke.classList.remove('hidden-element');
      smoke.classList.add('show');
    }
    
    if (bgMusicRef.current) {
      gsap.to(bgMusicRef.current, { volume: 0, duration: 1, onComplete: () => bgMusicRef.current.pause() });
    }
    
    setTimeout(() => {
      switchPhase(6, triggerFinale);
    }, 2500);
  };

  const triggerFinale = () => {
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
    
    gsap.to('.pop-in', {
      scale: 1,
      opacity: 1,
      duration: 1,
      stagger: 0.3,
      ease: "back.out(1.5)"
    });
    
    if (bgMusicRef.current) {
      bgMusicRef.current.volume = 1;
      bgMusicRef.current.play().catch(e => console.log(e));
    }
  };

  return (
    <>
      <audio ref={bgMusicRef} id="bg-music" loop>
        <source src="https://cdn.pixabay.com/download/audio/2022/03/24/audio_349d5b78e2.mp3?filename=emotional-piano-108343.mp3" type="audio/mpeg" />
      </audio>

      {/* PHASE 1 */}
      <section id="phase-1" className={`fullscreen flex-center ${phase === 1 ? 'active-phase' : 'hidden-phase'}`}>
        <div className="heart-container" onClick={startJourney}>
          <div className="glowing-heart">❤️</div>
          <p className="hint-text">Tap the heart to unlock a secret...</p>
        </div>
      </section>

      {/* PHASE 2 */}
      <section id="phase-2" className={`fullscreen flex-center starry-bg ${phase === 2 ? 'active-phase' : 'hidden-phase'}`}>
        <div className="intro-text-container">
          <p id="line1" className="typewriter-line"></p>
          <p id="line2" className="typewriter-line mt-2"></p>
          <p id="line3" className="typewriter-line mt-2 text-highlight"></p>
        </div>
        <div id="continue-arrow" className="swipe-indicator hidden-element" onClick={goToPhase3}>
          <span>Tap to Continue</span>
          <div className="arrow-down">↓</div>
        </div>
      </section>

      {/* PHASE 3 */}
      <section id="phase-3" className={`fullscreen mist-bg ${phase === 3 ? 'active-phase' : 'hidden-phase'}`}>
        <h2 className="section-title fade-in-title">Our Journey ✨</h2>
        
        <div className="card-stack-container" id="photo-stack" onClick={handleCardClick}>
          <div className="memory-card">
            <img src={img5} alt="Memory 5" onError={(e) => e.target.src='https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=400&auto=format&fit=crop'} />
            <p className="caption">And today is all about YOU. 👑</p>
          </div>
          <div className="memory-card">
            <img src={img4} alt="Memory 4" onError={(e) => e.target.src='https://images.unsplash.com/photo-1563241527-3004b7be0ffd?q=80&w=400&auto=format&fit=crop'} />
            <p className="caption">You are my favorite everything... 🥺</p>
          </div>
          <div className="memory-card">
            <img src={img3} alt="Memory 3" onError={(e) => e.target.src='https://images.unsplash.com/photo-1518199266791-5375a83164ba?q=80&w=400&auto=format&fit=crop'} />
            <p className="caption">Through every high and low... 🎢</p>
          </div>
          <div className="memory-card">
            <img src={img2} alt="Memory 2" onError={(e) => e.target.src='https://images.unsplash.com/photo-1530103862676-de8892b12a15?q=80&w=400&auto=format&fit=crop'} />
            <p className="caption">The moments I cherish the most... 📸</p>
          </div>
          <div className="memory-card top-card">
            <img src={img1} alt="Memory 1" onError={(e) => e.target.src='https://images.unsplash.com/photo-1529156069898-49953eb1b5ae?q=80&w=400&auto=format&fit=crop'} />
            <p className="caption">The smile that lights up my world... ✨</p>
          </div>
        </div>

        <div className="instruction-text" id="swipe-instruction">
          Tap on the photo to see the next memory 👆
        </div>

        <button id="btn-to-letter" className="action-btn hidden-element" onClick={goToPhase4}>Read My Heart 💌</button>
      </section>

      {/* PHASE 4 */}
      <section id="phase-4" className={`fullscreen romantic-bg flex-center ${phase === 4 ? 'active-phase' : 'hidden-phase'}`}>
        <div id="envelope-wrapper" className="envelope-wrapper" onClick={openLetter}>
          <div className="envelope-icon">💌</div>
          <p>A message just for you...</p>
          <small>(Tap to open)</small>
        </div>

        <div id="letter-content" className="letter-overlay hidden-element">
          <div className="letter-scroll-area">
            <h1 className="letter-title">To My Absolute Favorite Person 💖</h1>
            
            <p>Happiest Birthday to the one who makes everything brighter. ✨ I honestly don't even know where to begin, because how do you put into words what someone truly means to you?</p>
            
            <p>First of all, I am so incredibly grateful that life brought you to me. You aren't just my best friend; you are a rare, beautiful soul who has become such a huge and special part of my world. Every laugh we've shared, every late-night conversation, every ridiculous moment—I wouldn't trade any of it for anything.</p>
            
            <p>Thank you for always being there, even when I'm overthinking everything or just being impossible to understand. Thank you for listening to my silence when I can't find the words, for making me laugh when my heart feels heavy, and for accepting me exactly as I am, flaws and all.</p>
            
            <p>You have seen so many different versions of me, and somehow, you've stayed through every single one. That kind of bond is something I treasure more than I could ever explain to you.</p>
            
            <p>As we grow and life changes, my biggest hope is that we never lose this connection. I want us to keep making those chaotic memories, laughing until our stomachs hurt, and celebrating each other's smallest victories.</p>
            
            <p>So today, forget the worries of the world. It is YOUR day. Eat too much cake, dance like nobody is watching, and let yourself feel as deeply special and loved as you truly are. You deserve all the magic in the universe today and always.</p>
            
            <p>Happy Birthday once again to my personal therapist, my biggest supporter, and my forever partner in crime. Here is to another year of us taking on the world together.</p>
            
            <p>Never, ever change who you are. You are truly one of a kind. I love you more than words can ever capture! 🥺❤️✨</p>

            <div className="letter-footer">
              <button className="action-btn glow-btn" onClick={goToPhase5}>Now... Make A Wish 🌟</button>
            </div>
          </div>
        </div>
      </section>

      {/* PHASE 5 */}
      <section id="phase-5" className={`fullscreen dark-bg flex-center ${phase === 5 ? 'active-phase' : 'hidden-phase'}`}>
        <div className="wish-container text-center">
          <h1 className="wish-title">Make a Wish... 🌟</h1>
          <p className="wish-subtitle">Close your eyes, wish for something beautiful.</p>
          
          <div className="epic-cake-area">
            <div className="cake-candles" id="magical-candles">
              <span className="m-candle">🕯️</span>
              <span className="m-candle">🕯️</span>
              <span className="m-candle">🕯️</span>
            </div>
            <div className="m-smoke hidden-element" id="m-smoke">💨</div>
            <div className="epic-cake">🎂</div>
          </div>

          <div id="mic-status" className="mic-instructions">
            <p className="pulse-text">Blow into your phone to put out the candles! 💨📱</p>
            <button className="backup-btn" onClick={forceBlowCandles}>Tap here if blowing doesn't work</button>
          </div>
        </div>
      </section>

      {/* PHASE 6 */}
      <section id="phase-6" className={`fullscreen party-bg flex-center ${phase === 6 ? 'active-phase' : 'hidden-phase'}`}>
        <div className="celebration-container text-center">
          <h1 className="massive-text pop-in">HAPPY BIRTHDAY BESTIE!!! 🎉</h1>
          
          <div className="gif-frame pop-in">
            <img src="https://media.giphy.com/media/IzXiddo2twMmdmU8Lv/giphy.gif" alt="Milk and Mocha Bear Celebration" />
          </div>

          <p className="final-words pop-in">Hope this brought the biggest smile to your face! 🥹💖✨</p>
        </div>
      </section>
    </>
  );
}

export default App;
