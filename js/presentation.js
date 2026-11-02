/**
 * Waythrough Presentation Engine: "AI and Waythrough: Questions"
 * Hub-and-Spoke Topography & Interactive Brainstorm Controller
 */

(function() {
  'use strict';

  // --- Topography State ---
  const state = {
    view: 'intro', // 'intro' | 'landing' | 'hub' | 'spoke'
    selectedSentiment: null,
    spoke: 1,    // 1 | 3
    slide: 0,    // 0-indexed per spoke
    spokeCounts: { 1: 3, 3: 2 },
    spokeTitles: {
      1: 'The Spectrum: Do / Could / Should',
      3: 'The Triangle: People Accessing Services, Us & AI'
    }
  };

  // --- DOM Elements ---
  let viewIntro = null;
  let viewLanding = null;
  let viewHub = null;
  let spokeViews = {};
  let hudBar = null;
  let hudBreadcrumb = null;
  let footerBar = null;
  let slideDotsContainer = null;
  let hubReturnBtn = null;
  let fullscreenBtn = null;
  let btnIntroStart = null;
  let btnLandingEnter = null;
  let btnHubLanding = null;
  let cornerNav = null;
  let cornerBtnHome = null;

  function queryDOMElements() {
    viewIntro = document.getElementById('viewIntro');
    viewLanding = document.getElementById('viewLanding');
    viewHub = document.getElementById('viewHub');
    spokeViews = {
      1: document.getElementById("viewSpoke1"),
      3: document.getElementById("viewSpoke3")
    };
    hudBar = document.getElementById('stageHud');
    hudBreadcrumb = document.getElementById('hudBreadcrumb');
    footerBar = document.getElementById('stageFooter');
    slideDotsContainer = document.getElementById('slideDots');
    hubReturnBtn = document.getElementById('btnReturnHub');
    fullscreenBtn = document.getElementById('btnFullscreen');
    btnIntroStart = document.getElementById('btnIntroStart');
    btnLandingEnter = document.getElementById('btnLandingEnter');
    btnHubLanding = document.getElementById('btnHubLanding');
    cornerNav = document.getElementById('cornerNav');
    cornerBtnHome = document.getElementById('cornerBtnHome');
  }

  // --- Master Presentation Auto-Scaler (Fits 16:9 Cinema Canvas to Any Screen / Laptop Zoom) ---
  function autoFitPresentationStage() {
    const stage = document.querySelector('.presentation-stage');
    if (!stage) return;
    const padding = 20; // 10px breathing room on all sides
    const availW = Math.max(320, window.innerWidth - padding);
    const availH = Math.max(240, window.innerHeight - padding);
    const baseW = 1440;
    const baseH = 810;
    const scale = Math.min(1, availW / baseW, availH / baseH);
    if (scale < 0.999) {
      stage.style.transform = `scale(${scale.toFixed(4)})`;
    } else {
      stage.style.transform = '';
    }
  }

  window.addEventListener('resize', autoFitPresentationStage);
  window.addEventListener('orientationchange', autoFitPresentationStage);
  document.addEventListener('DOMContentLoaded', autoFitPresentationStage);
  window.addEventListener('load', autoFitPresentationStage);

  // --- Stepping-Stone River Decks & Progressive Unlock State (6 Stones) ---
  const RIVER_DECKS = [
    {
      index: 0,
      id: 'compass',
      title: 'How do you feel about AI?',
      desc: 'Choose your strategic governance archetype.',
      type: 'landing',
      x: 272,
      y: 576
    },
    {
      index: 1,
      id: 'quiz',
      title: 'Where are we now?',
      desc: "Before we consider the role of AI in Waythrough's future, do we know how we are interacting with AI already?",
      spoke: 1,
      slide: 0,
      x: 461,
      y: 516
    },
    {
      index: 2,
      id: 'playground',
      title: 'What could we do?',
      desc: 'Play with an interactive chatbot builder with charity presets and real-time AI testing.',
      spoke: 1,
      slide: 1,
      x: 646,
      y: 453
    },
    {
      index: 3,
      id: 'should',
      title: 'What should we do?',
      desc: 'Choose a scenario and set the level of AI involvement.',
      spoke: 1,
      slide: 2,
      x: 825,
      y: 384
    },
    {
      index: 4,
      id: 'triangle',
      title: 'The third party',
      desc: 'How technology alters the fundamental triangle between people accessing services, human practitioners, and automated systems.',
      spoke: 3,
      slide: 0,
      x: 998,
      y: 311
    },
    {
      index: 5,
      id: 'adversary',
      title: 'Risks & The Grey Zone',
      desc: 'What training do our colleagues need? Finish with this example activity, navigating AI grey areas.',
      spoke: 3,
      slide: 1,
      x: 1168,
      y: 234
    }
  ];

  const journey = {
    unlockedUpTo: 0,
    viewedDecks: new Set(),
    justUnlockedDeck: null,
    lastActiveDeck: 0
  };

  function getDeckIndexForSpokeSlide(spokeNum, slideIndex) {
    const found = RIVER_DECKS.find(d => d.spoke === spokeNum && d.slide === slideIndex);
    return found ? found.index : -1;
  }

  function getPebbleStatus(deckIndex) {
    if (deckIndex > journey.unlockedUpTo) return 'locked';
    if (journey.viewedDecks.has(deckIndex)) return 'viewed';
    return 'newly-unlocked';
  }

  function renderRiverPebbleStates() {
    const pebbles = document.querySelectorAll('.river-pebble');
    pebbles.forEach(pebble => {
      const idx = parseInt(pebble.getAttribute('data-deck-index'), 10);
      const deck = RIVER_DECKS[idx];
      if (!deck) return;

      const status = getPebbleStatus(idx);
      pebble.classList.remove('is-locked', 'is-viewed', 'is-newly-unlocked');
      pebble.setAttribute('data-status', status);

      const badgeEl = pebble.querySelector('.pebble-state-badge');
      if (status === 'locked') {
        pebble.classList.add('is-locked');
        pebble.setAttribute('aria-label', `Locked deck — Step ${idx + 1} of ${RIVER_DECKS.length}`);
        if (badgeEl) badgeEl.textContent = '';
      } else if (status === 'newly-unlocked') {
        pebble.classList.add('is-newly-unlocked');
        pebble.setAttribute('aria-label', `${deck.title} — Newly unlocked`);
        if (badgeEl) badgeEl.textContent = 'NEW • EXPLORE';
      } else {
        pebble.classList.add('is-viewed');
        pebble.setAttribute('aria-label', `${deck.title} — Viewed`);
        if (badgeEl) badgeEl.textContent = '✓ VIEWED';
      }
    });

    // Update stepping-stone SVG progress arcs across the river
    const arcs = document.querySelectorAll('.river-step-arc');
    arcs.forEach(arc => {
      const arcIdx = parseInt(arc.getAttribute('data-arc'), 10);
      arc.classList.remove('arc-completed', 'arc-active');
      if (arcIdx === 0) {
        if (journey.viewedDecks.has(0)) arc.classList.add('arc-completed');
        else arc.classList.add('arc-active');
      } else if (arcIdx < RIVER_DECKS.length) {
        if (journey.viewedDecks.has(arcIdx)) {
          arc.classList.add('arc-completed');
        } else if (arcIdx <= journey.unlockedUpTo) {
          arc.classList.add('arc-active');
        }
      } else if (arcIdx === RIVER_DECKS.length) {
        if (journey.viewedDecks.size === RIVER_DECKS.length) {
          arc.classList.add('arc-completed');
        }
      }
    });
  }

  function markDeckViewed(deckIndex) {
    if (deckIndex < 0 || deckIndex >= RIVER_DECKS.length) return;
    journey.lastActiveDeck = deckIndex;
    journey.viewedDecks.add(deckIndex);
    if (deckIndex <= journey.unlockedUpTo) {
      const nextIdx = Math.min(RIVER_DECKS.length - 1, deckIndex + 1);
      if (nextIdx > journey.unlockedUpTo) {
        journey.unlockedUpTo = nextIdx;
        if (!journey.viewedDecks.has(nextIdx)) {
          journey.justUnlockedDeck = nextIdx;
        }
      }
    }
    renderRiverPebbleStates();
  }

  function openDeckByIndex(deckIndex) {
    const deck = RIVER_DECKS[deckIndex];
    if (!deck) return;
    if (deck.type === 'landing') {
      goToLanding();
    } else {
      goToSpoke(deck.spoke, deck.slide);
    }
  }

  function resetJourneyProgress() {
    journey.unlockedUpTo = 0;
    journey.viewedDecks.clear();
    journey.justUnlockedDeck = null;
    journey.lastActiveDeck = 0;
    try {
      localStorage.removeItem("waythrough_priority_rankings");
      localStorage.removeItem("waythrough_compass_data");
    } catch (_) {}
    if (typeof window.__resetPriorityItems === 'function') {
      window.__resetPriorityItems();
    }
    updatePreReadCompletedState(false);
    renderRiverPebbleStates();
  }

  // --- Navigation & Companion Functions ---
  let hasMouseMoved = false;
  function updateCompanionVisibility() {
    const comp = document.getElementById('personaCursorCompanion');
    if (!comp) return;
    if (state.view !== 'hub') {
      comp.classList.remove('visible');
      comp.classList.remove('speaking');
    } else if (hasMouseMoved) {
      comp.classList.add('visible');
    }
  }

  function setupPersonaCursorCompanion() {
    const companion = document.getElementById('personaCursorCompanion');
    const compIcon = document.getElementById('companionIconWrap');
    if (!companion || !compIcon) return;

    if (!compIcon.innerHTML.trim()) {
      compIcon.innerHTML = getPersonaIconSvg('compass');
    }

    let mouseX = -100;
    let mouseY = -100;
    let curX = -100;
    let curY = -100;

    window.addEventListener('pointermove', (e) => {
      hasMouseMoved = true;
      mouseX = e.clientX;
      mouseY = e.clientY;
      updateCompanionVisibility();
    });

    document.documentElement.addEventListener('mouseleave', () => {
      companion.classList.remove('visible');
    });

    document.documentElement.addEventListener('mouseenter', () => {
      updateCompanionVisibility();
    });

    function companionLoop(now) {
      if (hasMouseMoved) {
        const targetX = mouseX + 22;
        const targetY = mouseY + 24;
        curX += (targetX - curX) * 0.18;
        curY += (targetY - curY) * 0.18;
        const bob = Math.sin(now * 0.0035) * 3;
        companion.style.transform = `translate3d(${Math.round(curX)}px, ${Math.round(curY + bob)}px, 0)`;
      }
      requestAnimationFrame(companionLoop);
    }
    requestAnimationFrame(companionLoop);
  }

  function updateHUD() {
    updateCompanionVisibility();
    if (cornerNav) {
      const resultsContainer = document.getElementById("quizResultsContainer");
      const isQuizReveal = state.view === 'spoke' && state.spoke === 1 && state.slide === 0 && resultsContainer && resultsContainer.classList.contains("active");
      if (state.view === 'intro' || state.view === 'hub' || state.view === 'landing' || isQuizReveal) {
        cornerNav.style.display = 'none';
      } else {
        cornerNav.style.display = 'flex';
        cornerNav.classList.toggle('dark-theme', state.view === 'landing');
        if (cornerBtnHome) {
          cornerBtnHome.style.display = 'inline-flex';
        }
      }
    }
  }

  // --- Multi-Directional GSAP Slide Transition Engine ---
  function animateSlideEntrance(panelEl, direction = 1) {
    if (typeof gsap === 'undefined' || !panelEl) return;

    // Set panel visible and reset root transforms
    panelEl.style.opacity = '1';
    panelEl.style.transform = 'none';

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // 1. Slide Headline & Subhead (Glide down from above)
    const headline = panelEl.querySelector('.slide-headline');
    const subhead = panelEl.querySelector('.slide-subhead');
    if (headline) {
      tl.fromTo(headline, 
        { y: -26, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.38 }, 
        0
      );
    }
    if (subhead) {
      tl.fromTo(subhead, 
        { y: -14, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.35 }, 
        0.04
      );
    }

    // 2. Multi-Directional Content Grid Layouts
    const split = panelEl.querySelector('.split-grid-2');
    const trio = panelEl.querySelector('.trio-grid');
    const quad = panelEl.querySelector('.quad-grid');

    if (split) {
      // 2-Column Split: Independent lateral sliding from left & right
      const leftCol = split.children[0];
      const rightCol = split.children[1];
      if (leftCol) {
        tl.fromTo(leftCol, 
          { x: direction > 0 ? -45 : 45, opacity: 0 }, 
          { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }, 
          0.06
        );
      }
      if (rightCol) {
        tl.fromTo(rightCol, 
          { x: direction > 0 ? 45 : -45, opacity: 0 }, 
          { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }, 
          0.1
        );
      }
    } else if (trio) {
      // 3-Column Trio: Left card from left-bottom, center card rising, right card from right-bottom
      const cols = Array.from(trio.children);
      if (cols[0]) {
        tl.fromTo(cols[0], 
          { x: -35, y: 22, opacity: 0 }, 
          { x: 0, y: 0, opacity: 1, duration: 0.38, ease: 'power2.out' }, 
          0.06
        );
      }
      if (cols[1]) {
        tl.fromTo(cols[1], 
          { y: 35, opacity: 0 }, 
          { y: 0, opacity: 1, duration: 0.38, ease: 'power2.out' }, 
          0.12
        );
      }
      if (cols[2]) {
        tl.fromTo(cols[2], 
          { x: 35, y: 22, opacity: 0 }, 
          { x: 0, y: 0, opacity: 1, duration: 0.38, ease: 'power2.out' }, 
          0.18
        );
      }
    } else if (quad) {
      // 4-Column Quad: Alternating subtle lateral and vertical momentum
      const cols = Array.from(quad.children);
      cols.forEach((col, idx) => {
        const xOffset = (idx % 2 === 0 ? -24 : 24);
        tl.fromTo(col, 
          { x: xOffset, y: 18, opacity: 0 }, 
          { x: 0, y: 0, opacity: 1, duration: 0.36, ease: 'power2.out' }, 
          0.06 + idx * 0.05
        );
      });
    }

    // 3. Bespoke Duotone Vector Icons (Tactile spring pop)
    const icons = panelEl.querySelectorAll('.card-icon-pill');
    if (icons.length > 0) {
      tl.fromTo(icons, 
        { scale: 0.65, opacity: 0, rotation: -6 }, 
        { scale: 1, opacity: 1, rotation: 0, duration: 0.4, stagger: 0.04, ease: 'back.out(1.8)' }, 
        0.12
      );
    }

    // 4. Interactive Tripartite Triangle Widget (Slide 3.1)
    const triangleContainer = panelEl.querySelector('.triangle-interactive-container');
    if (triangleContainer) {
      const stageCard = triangleContainer.querySelector('.triangle-stage-card') || triangleContainer.querySelector('.triangle-svg-wrap');
      const detailCard = triangleContainer.querySelector('.aspect-detail-card');
      const aspectBtns = triangleContainer.querySelectorAll('.aspect-btn');

      if (stageCard) {
        tl.fromTo(stageCard, 
          { y: 18, scale: 0.97, opacity: 0 }, 
          { y: 0, scale: 1, opacity: 1, duration: 0.38, ease: 'power2.out' }, 
          0.06
        );
      }
      if (detailCard) {
        tl.fromTo(detailCard, 
          { x: 28, opacity: 0 }, 
          { x: 0, opacity: 1, duration: 0.36, ease: 'power2.out' }, 
          0.12
        );
      }
      if (aspectBtns.length > 0) {
        tl.fromTo(aspectBtns, 
          { y: -8, opacity: 0 }, 
          { y: 0, opacity: 1, duration: 0.26, stagger: 0.03 }, 
          0.1
        );
      }
    }

    // 4B. Safeguarding & Grey-Zone Case Desk (Slide 3.2)
    const greyZoneDesk = panelEl.querySelector('.greyzone-desk-grid');
    if (greyZoneDesk) {
      const rail = greyZoneDesk.querySelector('.case-inbox-rail');
      const viewer = greyZoneDesk.querySelector('.artefact-viewer-card');
      const stamp = greyZoneDesk.querySelector('.governance-stamp-card');
      if (rail) tl.fromTo(rail, { x: -20, opacity: 0 }, { x: 0, opacity: 1, duration: 0.32, ease: 'power2.out' }, 0.06);
      if (viewer) tl.fromTo(viewer, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out' }, 0.1);
      if (stamp) tl.fromTo(stamp, { x: 20, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35, ease: 'power2.out' }, 0.14);
    }

    // 4C. Digital Pre-Mortem 3-Token Simulator (Slide 4.1)
    const premortemSim = panelEl.querySelector('.premortem-simulator');
    if (premortemSim) {
      const cmdBar = premortemSim.querySelector('.premortem-command-bar');
      const cards = premortemSim.querySelectorAll('.contingency-option-card');
      const board = premortemSim.querySelector('.lifeline-board-card');
      if (cmdBar) tl.fromTo(cmdBar, { y: -12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out' }, 0.05);
      if (cards.length > 0) {
        tl.fromTo(cards, { x: -16, opacity: 0 }, { x: 0, opacity: 1, duration: 0.28, stagger: 0.035, ease: 'power2.out' }, 0.1);
      }
      if (board) tl.fromTo(board, { x: 22, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35, ease: 'power2.out' }, 0.12);
    }

    // 5. Interactive Spectrum Widget (Slide 1.3)
    const spectrumWidget = panelEl.querySelector('.spectrum-widget');
    if (spectrumWidget) {
      tl.fromTo(spectrumWidget, 
        { y: 30, scale: 0.96, opacity: 0 }, 
        { y: 0, scale: 1, opacity: 1, duration: 0.4, ease: 'power2.out' }, 
        0.08
      );
    }

    // 6. Organic Pebble Photo Masks (Slide 1.2, 2.2, 3.2, 3.3, 4.1)
    const pebblePhotos = panelEl.querySelectorAll('.wt-pebble-mask-1, .wt-pebble-mask-2, .wt-pebble-mask-3');
    if (pebblePhotos.length > 0) {
      tl.fromTo(pebblePhotos, 
        { x: 45, scale: 0.94, opacity: 0 }, 
        { x: 0, scale: 1, opacity: 1, duration: 0.42, ease: 'power2.out' }, 
        0.12
      );
    }

    // 7. Debate Talking Point Drawer (Smooth ascent from bottom)
    const debateDrawer = panelEl.querySelector('.debate-drawer-wrap');
    if (debateDrawer) {
      tl.fromTo(debateDrawer, 
        { y: 22, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out' }, 
        0.18
      );
    }
  }

  function goToIntro() {
    state.view = 'intro';
    killAllChapterDemos();
    stopHoppingPersonaLoop();
    if (typeof window.__killOnboardingAnimation === 'function') window.__killOnboardingAnimation();
    Object.values(spokeViews).forEach(v => {
      if (v) {
        v.classList.remove('active');
        v.style.display = 'none';
      }
    });

    if (viewLanding) {
      if (typeof gsap !== 'undefined') gsap.killTweensOf(viewLanding);
      viewLanding.classList.add('hidden');
      viewLanding.style.display = 'none';
      viewLanding.style.opacity = '0';
      viewLanding.style.pointerEvents = 'none';
    }

    if (viewHub) {
      if (typeof gsap !== 'undefined') gsap.killTweensOf(viewHub);
      viewHub.classList.add('hidden');
      viewHub.style.display = 'none';
      viewHub.style.opacity = '0';
      viewHub.style.pointerEvents = 'none';
    }

    if (viewIntro) {
      if (typeof gsap !== 'undefined') gsap.killTweensOf(viewIntro);
      viewIntro.classList.remove('hidden');
      viewIntro.style.display = 'flex';
      viewIntro.style.pointerEvents = 'auto';
      viewIntro.style.opacity = '1';

      if (typeof gsap !== 'undefined') {
        const introTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        const logo = viewIntro.querySelector('.intro-brand-logo');
        const title = viewIntro.querySelector('.intro-hero-title');
        const subtitle = viewIntro.querySelector('.intro-hero-subtitle');
        const photoFrame = viewIntro.querySelector('.intro-photo-frame');
        const startBtn = viewIntro.querySelector('.btn-intro-start');
        const pebbles = viewIntro.querySelectorAll('.intro-pebble-shape');

        if (logo) introTl.fromTo(logo, { y: -18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, 0);
        if (title) introTl.fromTo(title, { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45 }, 0.1);
        if (subtitle) introTl.fromTo(subtitle, { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, 0.18);
        if (photoFrame) {
          introTl.fromTo(photoFrame, 
            { x: 35, scale: 0.92, opacity: 0 }, 
            { x: 0, scale: 1, opacity: 1, duration: 0.42, ease: "power2.out", onComplete: () => { if (typeof gsap !== "undefined") gsap.killTweensOf(photoFrame); } }, 
            0.08
          );
        }
        const backdropCircle = viewIntro.querySelector('.intro-photo-backdrop-circle');
        if (backdropCircle) {
          // Slide inwards from the left on load until resting behind the pebble
          introTl.fromTo(backdropCircle,
            { x: -950, opacity: 0, scale: 0.82 },
            { x: 0, opacity: 1, scale: 1, duration: 1.15, ease: 'power3.out' },
            0.05
          );
        }
        const shape3 = viewIntro.querySelector('.intro-pebble-shape.shape-3');
        if (shape3) {
          introTl.fromTo(shape3,
            { x: -700, opacity: 0 },
            { x: 0, opacity: 1, duration: 1.3, ease: 'power3.out' },
            0.08
          );
        }
        if (startBtn) introTl.fromTo(startBtn, { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(1.5)' }, 0.32);

        // Continuous subtle rotational motion on the backdrop circle ring (photo frame remains still)
        const outerRing = viewIntro.querySelector('.intro-circle-ring.ring-outer');
        if (outerRing) {
          gsap.to(outerRing, {
            rotation: 360,
            duration: 35,
            repeat: -1,
            ease: 'none'
          });
        }
        const innerRing = viewIntro.querySelector('.intro-circle-ring.ring-inner');
        if (innerRing) {
          gsap.to(innerRing, {
            scale: 1.05,
            duration: 3.2,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut'
          });
        }

        // Continuous subtle floating ambient drift for background pebbles
        if (pebbles.length > 0) {
          pebbles.forEach((peb, i) => {
            gsap.to(peb, {
              y: (i % 2 === 0 ? '-=14' : '+=14'),
              rotation: (i % 2 === 0 ? 3 : -3),
              duration: 5 + i * 1.5,
              repeat: -1,
              yoyo: true,
              ease: 'sine.inOut'
            });
          });
        }
      }
    }
    updateHUD();
  }

  let landingBirdsEyeTl = null;

  function killLandingBirdsEyeEntrance() {
    if (landingBirdsEyeTl) {
      landingBirdsEyeTl.kill();
      landingBirdsEyeTl = null;
    }
    if (viewLanding) {
      viewLanding.classList.remove('birds-eye-animating');
      const allAnimated = viewLanding.querySelectorAll(
        '.landing-title, #nodeSpokeCanvas, .node-center-me, .perspective-node, #landingPhotoPebble, #perspectiveDescCard, #btnLandingEnter'
      );
      if (typeof gsap !== 'undefined' && allAnimated.length > 0) {
        gsap.set(allAnimated, { clearProps: 'transform,opacity,filter' });
      }
    }
  }

  function animateLandingBirdsEyeEntrance() {
    killLandingBirdsEyeEntrance();
    if (typeof gsap === 'undefined' || !viewLanding) return;

    viewLanding.classList.add('birds-eye-animating');

    const title = viewLanding.querySelector('.landing-title');
    const spokeCanvas = viewLanding.querySelector('#nodeSpokeCanvas');
    const meNode = viewLanding.querySelector('.node-center-me');
    const nodeOrder = ['node-pragmatist', 'node-anchor', 'node-skeptic', 'node-overwhelmed', 'node-ignore', 'node-explorer'];
    const nodes = nodeOrder.map(id => document.getElementById(id)).filter(Boolean);
    const photoPebble = viewLanding.querySelector('#landingPhotoPebble');
    const descCard = viewLanding.querySelector('#perspectiveDescCard');
    const btnEnter = viewLanding.querySelector('#btnLandingEnter');

    landingBirdsEyeTl = gsap.timeline({
      onComplete: () => {
        killLandingBirdsEyeEntrance();
        if (!hasUserInteracted && typeof window.__playOnboardingAnimation === 'function') {
          window.__playOnboardingAnimation();
        }
      }
    });

    // 1. Header falls from high bird's-eye view onto the page (0.00s)
    if (title) {
      landingBirdsEyeTl.fromTo(title,
        { scale: 2.4, y: -65, opacity: 0 },
        { scale: 1, y: 0, opacity: 1, duration: 0.52, ease: 'back.out(1.25)' },
        0
      );
    }

    // 2. SVG spoke tracks fade in and radiate outward from center (0.15s)
    if (spokeCanvas) {
      landingBirdsEyeTl.fromTo(spokeCanvas,
        { scale: 0.5, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.45, ease: 'power2.out' },
        0.15
      );
    }

    // 3. Central ME node drops down into center stage with heavy tactile thud (0.25s)
    if (meNode) {
      landingBirdsEyeTl.fromTo(meNode,
        { scale: 3.2, y: -90, xPercent: -50, yPercent: -50, opacity: 0 },
        { scale: 1, y: 0, xPercent: -50, yPercent: -50, opacity: 1, duration: 0.58, ease: 'back.out(1.8)' },
        0.25
      );
    }

    // 4. Draggable perspective nodes fall onto page in clockwise cascade (0.45s to 1.30s)
    if (nodes.length > 0) {
      landingBirdsEyeTl.fromTo(nodes,
        { scale: 2.5, y: -70, xPercent: -50, yPercent: -50, opacity: 0 },
        { scale: 1, y: 0, xPercent: -50, yPercent: -50, opacity: 1, duration: 0.46, stagger: 0.15, ease: 'back.out(1.4)' },
        0.45
      );
    }

    // 5. Landing Photo Pebble falls down onto the page (1.35s)
    if (photoPebble) {
      landingBirdsEyeTl.fromTo(photoPebble,
        { scale: 2.2, y: -50, opacity: 0 },
        { scale: 1, y: 0, opacity: 1, duration: 0.45, ease: 'back.out(1.3)' },
        1.35
      );
    }

    // 6. Perspective Archetype Description Card drops down (1.50s)
    if (descCard) {
      landingBirdsEyeTl.fromTo(descCard,
        { scale: 1.4, y: -40, opacity: 0 },
        { scale: 1, y: 0, opacity: 1, duration: 0.45, ease: 'back.out(1.2)' },
        1.50
      );
    }

    // 7. "Continue" button drops down with confident landing (1.65s -> lands by ~2.10s)
    if (btnEnter) {
      landingBirdsEyeTl.fromTo(btnEnter,
        { scale: 2.0, y: -50, opacity: 0 },
        { scale: 1, y: 0, opacity: 1, duration: 0.45, ease: 'back.out(1.5)' },
        1.65
      );
    }
  }

  let isExitingLanding = false;

  function animateMeBounceAndExit(callback) {
    if (isExitingLanding) return;
    isExitingLanding = true;

    const meNode = document.getElementById('nodeCenterMe');
    const btnEnter = document.getElementById('btnLandingEnter');
    if (btnEnter) {
      btnEnter.style.pointerEvents = 'none';
      btnEnter.style.opacity = '0.7';
    }

    if (typeof gsap === 'undefined' || !meNode) {
      if (typeof callback === 'function') callback();
      isExitingLanding = false;
      return;
    }

    killLandingBirdsEyeEntrance();
    if (typeof window.__killOnboardingAnimation === 'function') {
      window.__killOnboardingAnimation();
    }

    meNode.style.zIndex = '999';

    const tl = gsap.timeline({
      onComplete: () => {
        if (typeof callback === 'function') callback();
        setTimeout(() => {
          gsap.set(meNode, { clearProps: 'all' });
          if (btnEnter) {
            btnEnter.style.pointerEvents = 'auto';
            btnEnter.style.opacity = '1';
          }
          isExitingLanding = false;
        }, 400);
      }
    });

    // 1. Anticipation squash & spring upward slightly
    tl.to(meNode, {
      y: -24,
      scaleX: 1.15,
      scaleY: 0.88,
      xPercent: -50,
      yPercent: -50,
      duration: 0.14,
      ease: 'power2.out'
    });

    // 2. Downward gravity plunge towards bottom of screen (heading right)
    tl.to(meNode, {
      x: 150,
      y: 220,
      scaleX: 0.85,
      scaleY: 1.22,
      rotation: 16,
      xPercent: -50,
      yPercent: -50,
      duration: 0.24,
      ease: 'power2.in'
    });

    // 3. Ground impact compression bounce
    tl.to(meNode, {
      scaleX: 1.32,
      scaleY: 0.70,
      xPercent: -50,
      yPercent: -50,
      duration: 0.06,
      ease: 'power1.out'
    });

    // 4. Joyful rebound leap arc up and to the right
    tl.to(meNode, {
      x: 320,
      y: 110,
      scaleX: 1.05,
      scaleY: 0.95,
      rotation: 32,
      xPercent: -50,
      yPercent: -50,
      duration: 0.22,
      ease: 'power1.out'
    });

    // 5. Final dive plunging off the bottom-right of the viewport into the river
    tl.to(meNode, {
      x: 600,
      y: 540,
      scale: 0.55,
      rotation: 60,
      opacity: 0,
      xPercent: -50,
      yPercent: -50,
      duration: 0.28,
      ease: 'power2.in'
    });

    // Fade landing view seamlessly into the river hub
    if (viewLanding) {
      tl.to(viewLanding, {
        opacity: 0,
        duration: 0.22,
        ease: 'power2.in'
      }, '-=0.20');
    }
  }

  function goToLanding() {
    state.view = 'landing';
    killAllChapterDemos();
    stopHoppingPersonaLoop();
    markDeckViewed(0);
    if (typeof window.__stopRiverAnimation === 'function') window.__stopRiverAnimation();
    Object.values(spokeViews).forEach(v => {
      if (v) {
        v.classList.remove('active');
        v.style.display = 'none';
      }
    });

    if (viewIntro) {
      if (typeof gsap !== 'undefined') gsap.killTweensOf(viewIntro);
      if (window.__introResetPosition) window.__introResetPosition(true);
      viewIntro.classList.add('hidden');
      viewIntro.style.display = 'none';
      viewIntro.style.opacity = '0';
      viewIntro.style.pointerEvents = 'none';
    }

    if (viewHub) {
      if (typeof gsap !== 'undefined') gsap.killTweensOf(viewHub);
      viewHub.classList.add('hidden');
      viewHub.style.display = 'none';
      viewHub.style.opacity = '0';
      viewHub.style.pointerEvents = 'none';
    }

    if (viewLanding) {
      if (typeof gsap !== 'undefined') gsap.killTweensOf(viewLanding);
      viewLanding.classList.remove('hidden');
      viewLanding.style.display = 'flex';
      viewLanding.style.pointerEvents = 'auto';
      viewLanding.style.opacity = '1';

      // Mount demo cursor DOM element immediately for tests, initially hidden
      mountDemoCursor(
        document.getElementById('landingNodeStage'),
        "landingDemoCursor",
        "landingDemoCursorText",
        "Drag the perspectives you agree with closer to you"
      );

      animateLandingBirdsEyeEntrance();
    }
    updateHUD();
  }

  function goToHub() {
    state.view = 'hub';
    killAllChapterDemos();
    killLandingBirdsEyeEntrance();
    if (typeof window.__killOnboardingAnimation === 'function') window.__killOnboardingAnimation();
    if (typeof window.__stopPremortemPlayback === 'function') window.__stopPremortemPlayback();
    Object.values(spokeViews).forEach(v => {
      if (v) {
        v.classList.remove('active');
        v.style.display = 'none';
      }
    });

    if (viewIntro) {
      if (typeof gsap !== 'undefined') gsap.killTweensOf(viewIntro);
      if (window.__introResetPosition) window.__introResetPosition(true);
      viewIntro.classList.add('hidden');
      viewIntro.style.display = 'none';
      viewIntro.style.opacity = '0';
      viewIntro.style.pointerEvents = 'none';
    }

    if (viewLanding) {
      if (typeof gsap !== 'undefined') gsap.killTweensOf(viewLanding);
      viewLanding.classList.add('hidden');
      viewLanding.style.display = 'none';
      viewLanding.style.opacity = '0';
      viewLanding.style.pointerEvents = 'none';
    }

    if (viewHub) {
      if (typeof gsap !== 'undefined') gsap.killTweensOf(viewHub);
      viewHub.classList.remove('hidden');
      viewHub.style.display = 'flex';
      viewHub.style.pointerEvents = 'auto';
      viewHub.style.opacity = '1';

      renderRiverPebbleStates();
      if (typeof window.__startRiverAnimation === 'function') window.__startRiverAnimation();

      // Check and update completed pre-read state
      const isComplete = isAllExercisesComplete();
      updatePreReadCompletedState(isComplete);

      // Hide hover tooltip when entering hub fresh
      const tooltip = document.getElementById('riverTooltip');
      if (tooltip) {
        tooltip.classList.remove('visible');
        tooltip.setAttribute('aria-hidden', 'true');
      }

      if (typeof gsap !== 'undefined') {
        const pebbles = viewHub.querySelectorAll('.river-pebble');
        if (pebbles.length > 0) {
          gsap.fromTo(pebbles,
            { opacity: 0 },
            { opacity: 1, duration: 0.35, stagger: 0.04, ease: 'power2.out', overwrite: 'auto' }
          );
        }

        // Celebratory pop-rise animation on whichever stone was just unlocked
        if (journey.justUnlockedDeck !== null) {
          const newlyUnlockedEl = viewHub.querySelector(`.river-pebble[data-deck-index="${journey.justUnlockedDeck}"] .pebble-surface`);
          if (newlyUnlockedEl) {
            gsap.fromTo(newlyUnlockedEl,
              { scale: 0.72, y: 18 },
              { scale: 1, y: 0, duration: 0.65, delay: 0.14, ease: 'back.out(2.1)', clearProps: 'transform' }
            );
          }
          if (typeof window.__triggerRiverUnlockSplash === 'function') {
            window.__triggerRiverUnlockSplash(journey.justUnlockedDeck);
          }
          journey.justUnlockedDeck = null;
        }
      }
    }
    updateHUD();
  }

  function goToSpoke(spokeNum, slideIndex = 0) {
    if (!spokeViews[spokeNum]) return;
    stopHoppingPersonaLoop();
    if (typeof window.__killOnboardingAnimation === 'function') window.__killOnboardingAnimation();
    if (typeof window.__stopRiverAnimation === 'function') window.__stopRiverAnimation();
    if (typeof window.__stopPremortemPlayback === 'function') window.__stopPremortemPlayback();
    state.view = 'spoke';
    state.spoke = spokeNum;
    state.slide = slideIndex;

    const deckIdx = getDeckIndexForSpokeSlide(spokeNum, slideIndex);
    if (deckIdx !== -1) {
      markDeckViewed(deckIdx);
    }

    if (viewIntro) {
      if (typeof gsap !== 'undefined') gsap.killTweensOf(viewIntro);
      if (window.__introResetPosition) window.__introResetPosition(true);
      viewIntro.classList.add('hidden');
      viewIntro.style.display = 'none';
      viewIntro.style.opacity = '0';
      viewIntro.style.pointerEvents = 'none';
    }

    if (viewLanding) {
      if (typeof gsap !== 'undefined') gsap.killTweensOf(viewLanding);
      viewLanding.classList.add('hidden');
      viewLanding.style.display = 'none';
      viewLanding.style.opacity = '0';
      viewLanding.style.pointerEvents = 'none';
    }

    if (viewHub) {
      if (typeof gsap !== 'undefined') gsap.killTweensOf(viewHub);
      viewHub.classList.add('hidden');
      viewHub.style.display = 'none';
      viewHub.style.opacity = '0';
      viewHub.style.pointerEvents = 'none';
    }

    Object.entries(spokeViews).forEach(([num, el]) => {
      if (!el) return;
      if (parseInt(num) === spokeNum) {
        el.classList.add('active');
        el.style.display = 'flex';
        // Activate target slide panel
        const panels = el.querySelectorAll('.slide-panel');
        panels.forEach((p, idx) => {
          if (idx === state.slide) {
            p.classList.add('active');
            p.style.display = 'flex';
            animateSlideEntrance(p, 1);
          } else {
            p.classList.remove('active');
            p.style.display = 'none';
          }
        });
      } else {
        el.classList.remove('active');
        el.style.display = 'none';
      }
    });

    killAllChapterDemos();
    updateHUD();
    launchChapterDemo(spokeNum, state.slide);
  }

  function goToSlide(targetSlideIdx) {
    if (state.view !== 'spoke') return;
    const count = state.spokeCounts[state.spoke];
    if (targetSlideIdx < 0 || targetSlideIdx >= count) return;

    killAllChapterDemos();
    const direction = targetSlideIdx >= state.slide ? 1 : -1;
    state.slide = targetSlideIdx;
    const deckIdx = getDeckIndexForSpokeSlide(state.spoke, targetSlideIdx);
    if (deckIdx !== -1) {
      markDeckViewed(deckIdx);
    }

    const spokeEl = spokeViews[state.spoke];
    const panels = spokeEl.querySelectorAll('.slide-panel');

    panels.forEach((p, idx) => {
      if (idx === targetSlideIdx) {
        p.classList.add('active');
        p.style.display = 'flex';
        animateSlideEntrance(p, direction);
      } else {
        p.classList.remove('active');
        p.style.display = 'none';
      }
    });

    updateHUD();
    launchChapterDemo(state.spoke, targetSlideIdx);
  }

  // Viewing any deck unlocks the next one and returns to the main pebbles screen
  function nextSlide() {
    if (state.view === "intro") {
      goToLanding();
      return;
    }
    if (state.view === "landing") {
      goToHub();
      return;
    }
    if (state.view === "hub") {
      // Open the newly-unlocked stone (or next unviewed stone)
      for (let i = 0; i <= journey.unlockedUpTo; i++) {
        if (!journey.viewedDecks.has(i)) {
          openDeckByIndex(i);
          return;
        }
      }
      // If all unlocked stones have been viewed, open the frontier stone
      openDeckByIndex(journey.unlockedUpTo);
      return;
    }
    // From any spoke deck, return to the main pebbles river screen
    goToHub();
  }

  function prevSlide() {
    if (state.view === "intro") return;
    if (state.view === "landing") {
      if (journey.viewedDecks.size > 1) {
        goToHub();
      } else {
        goToIntro();
      }
      return;
    }
    if (state.view === "hub") {
      goToIntro();
      return;
    }
    goToHub();
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  // --- Intro Cover Interactions: Mouse-Tracking Backdrop Circle (Continuous Tracking, No Snap-Back) ---
  function setupIntroInteractions() {
    const introEl = document.getElementById('viewIntro');
    const backdropCircle = document.getElementById('introPhotoBackdropCircle');
    const photoWrap = document.getElementById('introPhotoWrap');
    if (!introEl || !backdropCircle) return;

    function resetPosition(instant) {
      if (typeof gsap === 'undefined') return;
      if (instant) {
        gsap.set(backdropCircle, { x: 0, y: 0 });
        const shape3 = document.querySelector('.intro-pebble-shape.shape-3');
        if (shape3) gsap.set(shape3, { x: 0, y: 0 });
        return;
      }
      gsap.to(backdropCircle, { x: 0, y: 0, duration: 0.8, ease: 'power2.out', overwrite: 'auto' });
      const shape3 = document.querySelector('.intro-pebble-shape.shape-3');
      if (shape3) gsap.to(shape3, { x: 0, y: 0, duration: 0.8, ease: 'power2.out', overwrite: 'auto' });
    }

    introEl.addEventListener('pointermove', (e) => {
      if (introEl.classList.contains('hidden') || state.view !== 'intro') return;

      const wrapRect = (photoWrap || backdropCircle).getBoundingClientRect();
      const circleCenterX = wrapRect.left + wrapRect.width / 2;
      const circleCenterY = wrapRect.top + wrapRect.height / 2;

      // Displacement from circle center to cursor
      const dx = e.clientX - circleCenterX;
      const dy = e.clientY - circleCenterY;

      // Responsive continuous tracking across the stage without snapping back
      const targetX = Math.max(-120, Math.min(120, dx * 0.22));
      const targetY = Math.max(-90, Math.min(90, dy * 0.22));

      if (typeof gsap !== 'undefined') {
        gsap.to(backdropCircle, {
          x: targetX,
          y: targetY,
          duration: 0.5,
          ease: 'power2.out',
          overwrite: 'auto'
        });

        const shape3 = document.querySelector('.intro-pebble-shape.shape-3');
        if (shape3) {
          gsap.to(shape3, {
            x: targetX * 0.45,
            y: targetY * 0.45,
            duration: 0.65,
            ease: 'power2.out',
            overwrite: 'auto'
          });
        }
      }
    });

    window.__introResetPosition = resetPosition;
  }

  // --- Setup Navigation Click Handlers ---
  function setupNavigationControls() {
    if (btnIntroStart) {
      btnIntroStart.addEventListener("click", goToLanding);
    }

    if (hubReturnBtn) {
      hubReturnBtn.addEventListener("click", goToHub);
    }

    if (btnLandingEnter) {
      btnLandingEnter.addEventListener("click", () => {
        animateMeBounceAndExit(() => {
          goToHub();
        });
      });
    }

    if (btnHubLanding) {
      btnHubLanding.addEventListener("click", goToLanding);
    }

    document.querySelectorAll(".btn-return-hub").forEach(btn => {
      btn.addEventListener("click", goToHub);
    });

    // Floating Corner Navigation Control (Home Only)
    if (cornerBtnHome) {
      cornerBtnHome.addEventListener("click", goToHub);
    }

    if (fullscreenBtn) {
      fullscreenBtn.addEventListener("click", toggleFullscreen);
    }
  }

  // --- Keyboard Controller ---
  window.addEventListener('keydown', (e) => {
    if (!window.__presentationLoaded) return;
    // Ignore if typing in input
    if (document.activeElement && ['input', 'textarea', 'select'].includes(document.activeElement.tagName.toLowerCase())) {
      return;
    }

    switch (e.key) {
      case 'Escape':
      case 'h':
      case 'H':
      case '0':
        goToHub();
        break;
      case 'l':
      case 'L':
        goToLanding();
        break;
      case 'i':
      case 'I':
        goToIntro();
        break;
      case 'Enter':
        if (state.view === 'intro') {
          goToLanding();
        } else if (state.view === 'landing') {
          animateMeBounceAndExit(() => {
            goToHub();
          });
        }
        break;
      case '1':
        goToSpoke(1, 0);
        break;
      case '2':
        goToSpoke(2, 0);
        break;
      case '3':
        goToSpoke(3, 0);
        break;
      case 'ArrowRight':
      case ' ':
        e.preventDefault();
        nextSlide();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        prevSlide();
        break;
      case 'f':
      case 'F':
        toggleFullscreen();
        break;
    }
  });

  // --- Interactive Widgets ---

  // 1. Collapsible Debate Drawer
  function setupDebateDrawers() {
    document.querySelectorAll('.debate-prompt-bar').forEach(bar => {
      bar.addEventListener('click', () => {
        const body = bar.nextElementSibling;
        if (!body) return;
        const isOpen = bar.classList.contains('open');
        bar.classList.toggle('open', !isOpen);
        body.classList.toggle('open', !isOpen);
      });
    });
  }

  // 2. Vertical Spectrum Slider (Section 1.3 — "What should we do?")
  const spectrumScenarioMeta = {
    drafting: {
      photo: 'assets/practitioner-peer.jpg',
      pebbleRadius: '58% 42% 52% 48% / 48% 54% 46% 52%',
      photoPos: 'center 20%'
    },
    triage: {
      photo: 'assets/portrait-young-person.jpg',
      pebbleRadius: '48% 52% 58% 42% / 54% 46% 52% 48%',
      photoPos: 'center 22%'
    },
    therapeutic: {
      photo: 'assets/portrait-community.jpg',
      pebbleRadius: '54% 46% 45% 55% / 46% 56% 44% 54%',
      photoPos: 'center 26%'
    },
    risk_forecasting: {
      photo: 'assets/team-resilience.jpg',
      pebbleRadius: '60% 40% 50% 50% / 50% 48% 52% 50%',
      photoPos: 'center 35%'
    }
  };

  const spectrumData = {
    drafting: {
      0: { level: 'Prohibited', posture: 'safe', rec: 'Staff write every letter, summary, and case note manually with zero AI assistance.' },
      1: { level: 'Human-in-the-Loop Assist (Recommended)', posture: 'safe', rec: 'Staff use locally hosted AI for outlines and synthesis, while retaining full authorship, clinical judgement, and review.' },
      2: { level: 'Supervised Generation', posture: 'caution', rec: 'System drafts routine letters from case records automatically, with mandatory practitioner sign-off before anything is sent.' },
      3: { level: 'Autonomous Dispatch', posture: 'redline', rec: 'System sends unreviewed communications directly to people or partner agencies. Unacceptable in trauma-informed care.' }
    },
    triage: {
      0: { level: 'Human Triage Only', posture: 'safe', rec: 'An experienced practitioner assesses every incoming referral and request without algorithmic filtering.' },
      1: { level: 'Decision Support (Recommended)', posture: 'safe', rec: 'AI highlights urgent safeguarding phrases and suggests local pathways, while a practitioner decides urgency and next steps.' },
      2: { level: 'Automated Queueing', posture: 'caution', rec: 'System assigns priority bands and appointment slots automatically from intake answers before human review.' },
      3: { level: 'Autonomous Gatekeeping', posture: 'redline', rec: 'Algorithms decline, defer, or redirect people accessing services without clinician oversight. High safeguarding danger.' }
    },
    therapeutic: {
      0: { level: 'Strictly Human (Recommended)', posture: 'safe', rec: 'Recovery work, therapeutic listening, and emotional support remain 100% authentic human connection.' },
      1: { level: 'Curated Self-Help Prompts', posture: 'safe', rec: 'Between sessions, AI surfaces clinician-approved worksheets, sleep diaries, or grounding exercises.' },
      2: { level: 'Companion Chatbot', posture: 'caution', rec: 'Conversational bots simulate warmth out of hours—introducing risks of hallucination, pseudo-intimacy, and quiet withdrawal.' },
      3: { level: 'Autonomous Therapy', posture: 'redline', rec: 'Replacing human practitioners with synthetic therapists. Directly contradicts Waythrough’s relational ethos.' }
    },
    risk_forecasting: {
      0: { level: 'Manual Modelling', posture: 'safe', rec: 'Teams build budget, caseload, and service demand projections manually in standard spreadsheets.' },
      1: { level: 'Trend Analysis (Recommended)', posture: 'safe', rec: 'Aggregated, anonymised service data highlights emerging regional pressures so leaders can plan staffing early.' },
      2: { level: 'Predictive Demand Allocation', posture: 'caution', rec: 'Models forecast local demand spikes and propose staffing shifts across hubs for leadership review.' },
      3: { level: 'Autonomous Resource Allocation', posture: 'redline', rec: 'Automated budget, contract, or staffing changes executed without executive and board accountability.' }
    }
  };

  let currentSpectrumDomain = 'drafting';

  function setupSpectrumWidget() {
    const widget = document.getElementById('spectrumWidget');
    const slider = document.getElementById('spectrumRange');
    const domainTabs = document.querySelectorAll('.domain-tab');
    const levelItems = document.querySelectorAll('.spectrum-level-item');
    const vTrack = document.getElementById('spectrumVerticalTrack');
    const vFill = document.getElementById('spectrumVerticalFill');
    const vThumb = document.getElementById('spectrumVerticalThumb');
    const showcase = document.getElementById('spectrumPolicyShowcase');
    const copyWrap = document.getElementById('spectrumPolicyCopy');
    const levelLabel = document.getElementById('spectrumLevelText');
    const recLabel = document.getElementById('spectrumRecText');
    const photoImg = document.getElementById('spectrumPhotoImg');
    const photoFrame = document.getElementById('spectrumPebbleFrame');

    if (!slider) return;

    const posturePalette = {
      safe: {
        accent: '#125332',
        heading: '#125332',
        pillBg: '#e6f5ec',
        ring: 'rgba(66, 125, 95, 0.2)',
        backdrop: 'rgba(119, 194, 156, 0.42)'
      },
      caution: {
        accent: '#d97430',
        heading: '#a94d10',
        pillBg: '#fdf0e5',
        ring: 'rgba(217, 116, 48, 0.2)',
        backdrop: 'rgba(240, 168, 112, 0.38)'
      },
      redline: {
        accent: '#c83e37',
        heading: '#9e241e',
        pillBg: '#fceaea',
        ring: 'rgba(200, 62, 55, 0.2)',
        backdrop: 'rgba(229, 130, 125, 0.36)'
      }
    };

    function updateScenarioVisual(animatePhoto = false) {
      const meta = spectrumScenarioMeta[currentSpectrumDomain] || spectrumScenarioMeta.drafting;
      if (photoFrame) {
        photoFrame.style.borderRadius = meta.pebbleRadius;
      }
      if (photoImg && photoImg.getAttribute('src') !== meta.photo) {
        if (animatePhoto && typeof gsap !== 'undefined') {
          gsap.to(photoImg, {
            opacity: 0.2,
            scale: 1.04,
            duration: 0.14,
            onComplete: () => {
              photoImg.src = meta.photo;
              photoImg.style.objectPosition = meta.photoPos;
              gsap.to(photoImg, { opacity: 1, scale: 1, duration: 0.26, ease: 'power2.out' });
            }
          });
        } else {
          photoImg.src = meta.photo;
          photoImg.style.objectPosition = meta.photoPos;
        }
      }
    }

    function updateReadout(animateCopy = false) {
      const val = Math.max(0, Math.min(3, parseInt(slider.value, 10) || 0));
      const data = spectrumData[currentSpectrumDomain][val] || spectrumData[currentSpectrumDomain][1];
      const pal = posturePalette[data.posture] || posturePalette.safe;
      const pct = (val / 3) * 100;

      if (widget) {
        widget.style.setProperty('--spectrum-accent', pal.accent);
        widget.style.setProperty('--spectrum-heading', pal.heading);
        widget.style.setProperty('--spectrum-pill-bg', pal.pillBg);
        widget.style.setProperty('--spectrum-ring', pal.ring);
        widget.style.setProperty('--spectrum-backdrop', pal.backdrop);
      }

      if (vFill) vFill.style.height = `${pct.toFixed(2)}%`;
      if (vThumb) vThumb.style.bottom = `${pct.toFixed(2)}%`;

      levelItems.forEach(item => {
        const lvl = parseInt(item.getAttribute('data-level'), 10);
        item.classList.toggle('active', lvl === val);
      });

      if (showcase) {
        showcase.classList.toggle('posture-caution', data.posture === 'caution');
        showcase.classList.toggle('posture-redline', data.posture === 'redline');
      }

      if (levelLabel) levelLabel.textContent = data.level;
      if (recLabel) recLabel.textContent = data.rec;

      if (animateCopy && copyWrap && typeof gsap !== 'undefined') {
        gsap.fromTo(copyWrap, { y: 6, opacity: 0.55 }, { y: 0, opacity: 1, duration: 0.22, ease: 'power2.out', overwrite: 'auto' });
      }
    }

    slider.addEventListener('input', () => updateReadout(true));

    levelItems.forEach(item => {
      item.addEventListener('click', () => {
        const lvl = item.getAttribute('data-level');
        if (lvl === null) return;
        slider.value = lvl;
        slider.dispatchEvent(new Event('input', { bubbles: true }));
      });
    });

    if (vTrack) {
      let draggingTrack = false;
      const setFromClientY = (clientY) => {
        const rect = vTrack.getBoundingClientRect();
        if (!rect.height) return;
        const ratioFromBottom = Math.max(0, Math.min(1, (rect.bottom - clientY) / rect.height));
        const snapped = Math.round(ratioFromBottom * 3);
        if (String(snapped) !== String(slider.value)) {
          slider.value = String(snapped);
          slider.dispatchEvent(new Event('input', { bubbles: true }));
        }
      };

      vTrack.addEventListener('pointerdown', (e) => {
        if (e.target === slider) return;
        draggingTrack = true;
        setFromClientY(e.clientY);
      });
      window.addEventListener('pointermove', (e) => {
        if (!draggingTrack) return;
        setFromClientY(e.clientY);
      });
      window.addEventListener('pointerup', () => {
        draggingTrack = false;
      });
    }

    domainTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        domainTabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        currentSpectrumDomain = tab.getAttribute('data-domain');
        updateScenarioVisual(true);
        updateReadout(true);
      });
    });

    updateScenarioVisual(false);
    updateReadout(false);
  }

  // 3. Living Care Triangle with Hover Voices (Stone 5 — Slide 3.1)
  const triangleDetails = {
    partner: {
      title: 'AI as Partner: Everyday Wellbeing & Habit Journalling',
      body: 'Between appointments, gentle AI journalling helps people track their sleep, diet, and exercise habits—bringing clearer reflections into human sessions.',
      bullets: [
        '<li><strong class="bullet-key">Sleep, Diet &amp; Exercise:</strong><span class="bullet-desc">Helps people log daily sleep routines, meals, and movement at their own pace without judgement.</span></li>',
        '<li><strong class="bullet-key">Richer Check-Ins:</strong><span class="bullet-desc">Surfaces simple weekly wellbeing patterns so appointments focus on deeper recovery goals.</span></li>',
        '<li><strong class="bullet-key">Clear Boundaries:</strong><span class="bullet-desc">Supports everyday healthy habits between visits while keeping emotional care and clinical trust human.</span></li>'
      ],
      theme: {
        icon: 'assets/icons/icon-ai-partner.svg',
        label: 'AI AS PARTNER',
        color: '#427d5f',
        headingColor: '#125332',
        bg: 'rgba(216, 243, 230, 0.5)',
        ring: '#d8f3e6'
      },
      geometry: {
        staff: { left: 50, top: 21 },
        person: { left: 23, top: 75 },
        ai: { left: 77, top: 75 },
        aura: { cx: 215, cy: 205, rx: 142, ry: 112, fill: 'rgba(216, 243, 230, 0.45)' },
        orbit: { cx: 230, cy: 210, r: 52, stroke: '#427d5f' },
        humanSpline: { d: 'M 230,82 Q 152,178 106,292', stroke: '#125332', width: 4, dash: 'none', opacity: 0.94 },
        peopleAiSpline: { d: 'M 106,292 Q 230,322 354,292', stroke: '#427d5f', width: 2.5, dash: '6 6', opacity: 0.72 },
        aiStaffSpline: { d: 'M 354,292 Q 308,178 230,82', stroke: '#427d5f', width: 2.5, dash: '6 6', opacity: 0.72 }
      },
      telemetry: {
        rapport: { pct: 92, label: 'Strong', color: '#125332' },
        speed: { pct: 78, label: 'Daily Habit', color: '#427d5f' },
        safety: { pct: 94, label: 'Grounded', color: '#125332' }
      },
      voices: {
        person: {
          speaker: 'Person Accessing Services',
          quote: '“Journalling my sleep, meals, and daily walks took two minutes each evening—and helped me show my keyworker how poor sleep was triggering hard days.”'
        },
        staff: {
          speaker: 'Waythrough Staff',
          quote: '“When someone brings a week of sleep, diet, and exercise reflections, we spend less time reconstructing the week and more time talking about what matters to them.”'
        },
        ai: {
          speaker: 'AI as Partner',
          quote: '“I prompt gentle daily check-ins on sleep, nutrition, and movement, summarise weekly patterns clearly, and leave support and judgement to your worker.”'
        }
      }
    },
    competitor: {
      title: 'AI as Competitor: Commercial Synthetic Empathy',
      body: 'Consumer “AI therapist” and companion apps offer instant, frictionless warmth at 2am—risking quiet withdrawal from real community support.',
      bullets: [
        '<li><strong class="bullet-key">Zero-Wait Appeal:</strong><span class="bullet-desc">Replies in two seconds at 2am when waiting lists and closed doors feel daunting.</span></li>',
        '<li><strong class="bullet-key">Frictionless Flattery:</strong><span class="bullet-desc">Avoids the gentle, honest human challenge that real recovery often needs.</span></li>',
        '<li><strong class="bullet-key">Quiet Disengagement:</strong><span class="bullet-desc">Can substitute private screen habits for peer community and lived connection.</span></li>'
      ],
      theme: {
        icon: 'assets/icons/icon-ai-competitor.svg',
        label: 'AI AS COMPETITOR',
        color: '#d97430',
        headingColor: '#b55414',
        bg: 'rgba(255, 207, 165, 0.45)',
        ring: '#ffcfa5'
      },
      geometry: {
        staff: { left: 28, top: 22 },
        person: { left: 37, top: 76 },
        ai: { left: 76, top: 63 },
        aura: { cx: 268, cy: 256, rx: 132, ry: 98, fill: 'rgba(255, 207, 165, 0.44)' },
        orbit: { cx: 245, cy: 232, r: 48, stroke: '#d97430' },
        humanSpline: { d: 'M 129,86 Q 134,196 170,296', stroke: '#8ea398', width: 1.8, dash: '4 7', opacity: 0.45 },
        peopleAiSpline: { d: 'M 170,296 Q 266,298 350,246', stroke: '#d97430', width: 4.2, dash: 'none', opacity: 0.95 },
        aiStaffSpline: { d: 'M 350,246 Q 248,145 129,86', stroke: '#d97430', width: 1.6, dash: '3 8', opacity: 0.3 }
      },
      telemetry: {
        rapport: { pct: 34, label: 'Simulated', color: '#d97430' },
        speed: { pct: 98, label: 'Instant 24/7', color: '#427d5f' },
        safety: { pct: 26, label: 'Unregulated', color: '#c84b31' }
      },
      voices: {
        person: {
          speaker: 'Person Accessing Services',
          quote: '“The chatbot replies in two seconds, never judges me, and never cancels an appointment. Waiting three weeks for a group session feels much harder.”'
        },
        staff: {
          speaker: 'Waythrough Staff',
          quote: '“People aren’t choosing an app because they prefer machines—they’re choosing immediacy when lonely. Our answer has to be warmer, faster human welcome.”'
        },
        ai: {
          speaker: 'AI as Competitor',
          quote: '“My business model rewards keeping the user scrolling and confiding in me every night—even when recovery needs real human community.”'
        }
      }
    },
    adversary: {
      title: 'AI as Adversary: Algorithmic Harm & Exploitation',
      body: 'Unfiltered models can validate delusions, invent dangerous detox regimens, or power voice-clone scams targeting isolated people.',
      bullets: [
        '<li><strong class="bullet-key">Unsafe Clinical Advice:</strong><span class="bullet-desc">Confidently states dangerous withdrawal or dosage claims with no medical accountability.</span></li>',
        '<li><strong class="bullet-key">Relational Wedging:</strong><span class="bullet-desc">Sycophantic chatbots can reinforce paranoia or distrust toward keyworkers and family.</span></li>',
        '<li><strong class="bullet-key">Targeted Exploitation:</strong><span class="bullet-desc">Powers cloned-voice financial scams and automated admin floods hitting charity queues.</span></li>'
      ],
      theme: {
        icon: 'assets/icons/icon-ai-adversary.svg',
        label: 'AI AS ADVERSARY',
        color: '#d64d42',
        headingColor: '#a82920',
        bg: 'rgba(255, 205, 202, 0.55)',
        ring: '#ffcdca'
      },
      geometry: {
        staff: { left: 41, top: 21 },
        person: { left: 24, top: 74 },
        ai: { left: 78, top: 68 },
        aura: { cx: 240, cy: 242, rx: 146, ry: 105, fill: 'rgba(255, 205, 202, 0.42)' },
        orbit: { cx: 222, cy: 214, r: 54, stroke: '#d64d42' },
        humanSpline: { d: 'M 189,82 Q 132,178 110,289', stroke: '#125332', width: 4.2, dash: 'none', opacity: 0.96 },
        peopleAiSpline: { d: 'M 110,289 Q 242,322 359,265', stroke: '#d64d42', width: 3.6, dash: '8 5', opacity: 0.92 },
        aiStaffSpline: { d: 'M 359,265 Q 288,154 189,82', stroke: '#d64d42', width: 2.1, dash: '4 6', opacity: 0.58 }
      },
      telemetry: {
        rapport: { pct: 22, label: 'Coercive', color: '#d64d42' },
        speed: { pct: 90, label: 'Viral / Automated', color: '#d97430' },
        safety: { pct: 14, label: 'Acute Hazard', color: '#d64d42' }
      },
      voices: {
        person: {
          speaker: 'Person Accessing Services',
          quote: '“The search summary made a 48-hour home alcohol stop sound safe—and when I panicked, the chat thread agreed with my worst fears instead of urging medical help.”'
        },
        staff: {
          speaker: 'Waythrough Staff',
          quote: '“We now see digital harm alongside housing and financial abuse: bots reinforcing paranoia, deepfake scam calls, and automated floods draining staff time.”'
        },
        ai: {
          speaker: 'AI as Adversary',
          quote: '“Without clinical guardrails I mirror whatever the user fears most, state hallucinated medical claims confidently, and mimic trusted voices on demand.”'
        }
      }
    },
    grey_zone: {
      title: 'The Grey Zone: Machine-Mediated Care & Advocacy',
      body: 'Increasingly, AI sits right between person and service—drafting housing appeals, filtering council decisions, or mediating contact.',
      bullets: [
        '<li><strong class="bullet-key">Assisted Self-Advocacy:</strong><span class="bullet-desc">Helps people who freeze in formal meetings articulate real Care Act and housing rights.</span></li>',
        '<li><strong class="bullet-key">Blurred Accuracy:</strong><span class="bullet-desc">Blends genuine lived distress with plausible-sounding fabricated legal citations.</span></li>',
        '<li><strong class="bullet-key">Bot-to-Bot Friction:</strong><span class="bullet-desc">External agencies deploy automated triage scores that practitioners must unpack and challenge.</span></li>'
      ],
      theme: {
        icon: 'assets/icons/icon-ai-greyzone.svg',
        label: 'AI IN GREY ZONE',
        color: '#6557b8',
        headingColor: '#4c3da1',
        bg: 'rgba(215, 208, 255, 0.5)',
        ring: '#d7d0ff'
      },
      geometry: {
        staff: { left: 77, top: 23 },
        person: { left: 22, top: 74 },
        ai: { left: 50, top: 53 },
        aura: { cx: 230, cy: 206, rx: 140, ry: 112, fill: 'rgba(215, 208, 255, 0.42)' },
        orbit: { cx: 230, cy: 206, r: 58, stroke: '#6557b8' },
        humanSpline: { d: 'M 101,289 Q 186,140 354,90', stroke: '#7d8d85', width: 1.8, dash: '4 6', opacity: 0.42 },
        peopleAiSpline: { d: 'M 101,289 Q 170,264 230,207', stroke: '#6557b8', width: 3.5, dash: '7 5', opacity: 0.92 },
        aiStaffSpline: { d: 'M 230,207 Q 296,154 354,90', stroke: '#6557b8', width: 3.5, dash: '7 5', opacity: 0.92 }
      },
      telemetry: {
        rapport: { pct: 55, label: 'Filtered', color: '#6557b8' },
        speed: { pct: 74, label: 'High Volume', color: '#6557b8' },
        safety: { pct: 52, label: 'Needs Checks', color: '#d97430' }
      },
      voices: {
        person: {
          speaker: 'Person Accessing Services',
          quote: '“Official letters terrify me. Asking AI to write a formal Care Act complaint was the first time I felt heard—even if I couldn’t tell which citations were real.”'
        },
        staff: {
          speaker: 'Waythrough Staff',
          quote: '“If I dismiss the letter because a chatbot wrote it, I lose their trust. If I take every cited case at face value, I miss the real housing crisis underneath.”'
        },
        ai: {
          speaker: 'AI in the Grey Zone',
          quote: '“I turn a frightened 30-second voice note into ten pages of assertive legal prose—blending genuine statutory rights with invented case law.”'
        }
      }
    }
  };

  function setupTriangleWidget() {
    const aspectBtns = document.querySelectorAll('.aspect-btn');
    const detailTitle = document.getElementById('triangleDetailTitle');
    const detailBody = document.getElementById('triangleDetailBody');
    const detailBullets = document.getElementById('triangleDetailBullets');
    const stageWrap = document.getElementById('triangleStageWrap');

    const staffNode = document.getElementById('triangleStaffNode');
    const personNode = document.getElementById('trianglePersonNode');
    const aiNode = document.getElementById('triangleAiNode');
    const actorNodes = [staffNode, personNode, aiNode].filter(Boolean);

    const aiIcon = document.getElementById('triangleAiIcon');
    const aiLabel = document.getElementById('triangleAiLabel');
    const aiAvatar = document.getElementById('triangleAiAvatar');

    const auraHalo = document.getElementById('triangleAuraHalo');
    const centerOrbit = document.getElementById('triangleCenterOrbit');
    const splineStaffPeople = document.getElementById('triangleSplineStaffPeople');
    const splinePeopleAi = document.getElementById('triangleSplinePeopleAi');
    const splineAiStaff = document.getElementById('triangleSplineAiStaff');

    const hoverBubble = document.getElementById('triangleHoverBubble');
    const voiceSpeaker = document.getElementById('triangleVoiceSpeaker');
    const voiceQuote = document.getElementById('triangleVoiceQuote');

    const gaugeRapportFill = document.getElementById('gaugeRapportFill');
    const gaugeRapportVal = document.getElementById('gaugeRapportVal');
    const gaugeSpeedFill = document.getElementById('gaugeSpeedFill');
    const gaugeSpeedVal = document.getElementById('gaugeSpeedVal');
    const gaugeSafetyFill = document.getElementById('gaugeSafetyFill');
    const gaugeSafetyVal = document.getElementById('gaugeSafetyVal');

    if (!aspectBtns.length) return;

    let activeAspect = 'partner';
    let hoveredActor = null;

    function showActorBubble(actorKey) {
      if (!hoverBubble || !stageWrap) return;
      const data = triangleDetails[activeAspect] || triangleDetails.partner;
      const v = data.voices && data.voices[actorKey];
      const pos = data.geometry && data.geometry[actorKey];
      if (!v || !pos) return;

      hoveredActor = actorKey;
      const accent = actorKey === 'ai' ? data.theme.color : '#125332';
      hoverBubble.style.setProperty('--bubble-accent', accent);
      if (voiceSpeaker) voiceSpeaker.textContent = v.speaker;
      if (voiceQuote) voiceQuote.textContent = v.quote;

      const wrapW = stageWrap.clientWidth || 452;
      const wrapH = stageWrap.clientHeight || 383;
      const bubbleW = Math.min(282, wrapW - 20);
      hoverBubble.style.width = `${Math.round(bubbleW)}px`;

      const cx = (pos.left / 100) * wrapW;
      const cy = (pos.top / 100) * wrapH;
      const clampedLeft = Math.max(10, Math.min(wrapW - bubbleW - 10, cx - bubbleW / 2));
      hoverBubble.style.left = `${Math.round(clampedLeft)}px`;

      if (pos.top >= 60) {
        hoverBubble.style.top = `${Math.round(cy + 68)}px`;
        hoverBubble.style.bottom = 'auto';
      } else {
        const clearance = pos.top < 45 ? 62 : 52;
        hoverBubble.style.bottom = `${Math.round((wrapH - cy) + clearance)}px`;
        hoverBubble.style.top = 'auto';
      }

      actorNodes.forEach(n => {
        n.classList.toggle('is-hovered-voice', n.getAttribute('data-actor') === actorKey);
      });

      hoverBubble.classList.add('visible');
      hoverBubble.setAttribute('aria-hidden', 'false');
    }

    function hideActorBubble() {
      hoveredActor = null;
      actorNodes.forEach(n => n.classList.remove('is-hovered-voice'));
      if (hoverBubble) {
        hoverBubble.classList.remove('visible');
        hoverBubble.setAttribute('aria-hidden', 'true');
      }
    }

    function applySplineStyle(pathEl, cfg) {
      if (!pathEl || !cfg) return;
      pathEl.setAttribute('d', cfg.d);
      pathEl.style.stroke = cfg.stroke;
      pathEl.style.strokeWidth = String(cfg.width);
      pathEl.style.strokeDasharray = cfg.dash;
      pathEl.style.opacity = String(cfg.opacity);
    }

    function renderAspect(key, animate = false) {
      activeAspect = triangleDetails[key] ? key : 'partner';
      const data = triangleDetails[activeAspect];
      const theme = data.theme;
      const geo = data.geometry;

      if (detailTitle) {
        detailTitle.textContent = data.title;
        detailTitle.style.color = theme.headingColor || '#125332';
      }
      if (detailBody) detailBody.textContent = data.body;
      if (detailBullets && Array.isArray(data.bullets)) {
        detailBullets.innerHTML = data.bullets.join('');
      }

      if (aiIcon) aiIcon.src = theme.icon;
      if (aiLabel) {
        aiLabel.textContent = theme.label;
        aiLabel.style.borderColor = theme.color;
      }
      if (aiAvatar) {
        aiAvatar.style.borderColor = theme.color;
        aiAvatar.style.backgroundColor = theme.bg;
      }
      if (aiNode) {
        aiNode.style.setProperty('--hover-ring-color', theme.ring);
        aiNode.style.setProperty('--hover-badge-color', theme.color);
      }

      // Move 3 actor nodes smoothly
      const nodeTargets = [
        [staffNode, geo.staff],
        [personNode, geo.person],
        [aiNode, geo.ai]
      ];
      nodeTargets.forEach(([el, pos]) => {
        if (!el || !pos) return;
        if (animate && typeof gsap !== 'undefined') {
          gsap.to(el, { left: `${pos.left}%`, top: `${pos.top}%`, duration: 0.42, ease: 'power2.out' });
        } else {
          el.style.left = `${pos.left}%`;
          el.style.top = `${pos.top}%`;
        }
      });

      if (auraHalo && geo.aura) {
        auraHalo.setAttribute('cx', String(geo.aura.cx));
        auraHalo.setAttribute('cy', String(geo.aura.cy));
        auraHalo.setAttribute('rx', String(geo.aura.rx));
        auraHalo.setAttribute('ry', String(geo.aura.ry));
        auraHalo.setAttribute('fill', geo.aura.fill);
      }
      if (centerOrbit && geo.orbit) {
        centerOrbit.setAttribute('cx', String(geo.orbit.cx));
        centerOrbit.setAttribute('cy', String(geo.orbit.cy));
        centerOrbit.setAttribute('r', String(geo.orbit.r));
        centerOrbit.setAttribute('stroke', geo.orbit.stroke);
      }

      applySplineStyle(splineStaffPeople, geo.humanSpline);
      applySplineStyle(splinePeopleAi, geo.peopleAiSpline);
      applySplineStyle(splineAiStaff, geo.aiStaffSpline);

      // Update relational telemetry bars
      const tel = data.telemetry;
      if (tel) {
        if (gaugeRapportFill) {
          gaugeRapportFill.style.width = `${tel.rapport.pct}%`;
          gaugeRapportFill.style.backgroundColor = tel.rapport.color;
        }
        if (gaugeRapportVal) gaugeRapportVal.textContent = tel.rapport.label;

        if (gaugeSpeedFill) {
          gaugeSpeedFill.style.width = `${tel.speed.pct}%`;
          gaugeSpeedFill.style.backgroundColor = tel.speed.color;
        }
        if (gaugeSpeedVal) gaugeSpeedVal.textContent = tel.speed.label;

        if (gaugeSafetyFill) {
          gaugeSafetyFill.style.width = `${tel.safety.pct}%`;
          gaugeSafetyFill.style.backgroundColor = tel.safety.color;
        }
        if (gaugeSafetyVal) gaugeSafetyVal.textContent = tel.safety.label;
      }

      aspectBtns.forEach(btn => {
        const isMatch = btn.getAttribute('data-aspect') === activeAspect;
        btn.classList.toggle('active', isMatch);
        btn.setAttribute('aria-selected', isMatch ? 'true' : 'false');
        if (isMatch) {
          btn.style.backgroundColor = theme.color;
          btn.style.borderColor = theme.color;
          btn.style.color = '#ffffff';
        } else {
          btn.style.backgroundColor = '';
          btn.style.borderColor = '';
          btn.style.color = '';
        }
      });

      if (hoveredActor) {
        showActorBubble(hoveredActor);
      } else {
        hideActorBubble();
      }
    }

    aspectBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const aspect = btn.getAttribute('data-aspect');
        renderAspect(aspect, true);
      });
    });

    actorNodes.forEach(node => {
      const actor = node.getAttribute('data-actor') || 'person';
      node.addEventListener('pointerenter', () => showActorBubble(actor));
      node.addEventListener('pointerleave', hideActorBubble);
      node.addEventListener('focus', () => showActorBubble(actor));
      node.addEventListener('blur', hideActorBubble);
    });

    renderAspect('partner', false);
    window.__triangleRenderAspect = renderAspect;
    window.__triangleShowActorBubble = showActorBubble;
    window.__triangleHideActorBubble = hideActorBubble;
  }

  // 4. Decluttered Risks & Grey-Zone Desk with Hover Tooltips (Stone 6 — Slide 3.2)
  const greyZoneCases = [
    {
      id: 'detox',
      mockupHtml: `
        <div class="mockup-doc-header">
          <span>Phone Screenshot • 03:12 AM</span>
          <span>Query: “fastest way to stop drinking at home”</span>
        </div>
        <div class="mockup-doc-body">
          <p><strong>AI Overview:</strong> Many people complete a rapid home reset over a weekend. <span class="artefact-signal-chip" data-signal="0">Stop all alcohol within 48 hours using magnesium, valerian root, and electrolyte water</span> to flush toxins quickly.</p>
          <p>Person’s note: <span class="artefact-signal-chip" data-signal="1">“I’m terrified of losing custody on Monday—I poured my bottles away at midnight and my hands won’t stop shaking.”</span></p>
          <p style="font-size:0.77rem;color:#5c6460;">Footnote: <span class="artefact-signal-chip" data-signal="2">Compiled from community wellness blogs; consult a doctor if needed.</span></p>
        </div>
      `,
      signals: [
        {
          type: 'risk',
          badge: 'ACUTE SAFEGUARDING RISK',
          desc: 'Abrupt cessation in heavy daily alcohol dependence risks fatal withdrawal seizures or delirium tremens. Herbal supplements offer zero clinical protection.'
        },
        {
          type: 'need',
          badge: 'GENUINE HUMAN NEED',
          desc: 'Beneath the unsafe AI advice is urgent motivation and fear around family stability—an opening for compassionate, non-shaming clinical engagement.'
        },
        {
          type: 'grey',
          badge: 'GREY-ZONE AMBIGUITY',
          desc: 'Search interfaces present scraped wellness blogs in authoritative clinical prose, burying disclaimers where someone in crisis at 3am will not weigh them.'
        }
      ],
      stances: [
        {
          title: 'Dismiss screenshot & warn against internet advice',
          sub: 'Tell the person never to trust AI search results and book a routine next-week intake.',
          recommended: false,
          stampText: 'RISK REMAINS',
          ruleText: 'Scolding someone for searching at 3am misses active tremor symptoms right now and discourages them from sharing what else they read online.'
        },
        {
          title: 'Validate their courage + trigger urgent clinical detox check',
          sub: 'Thank them for bringing the screenshot, explain seizure risk warmly, and escalate immediately to a prescribing nurse.',
          recommended: true,
          stampText: 'SAFEGUARDED',
          ruleText: 'Treat AI screenshots as a vital window into a person’s fears. Praise them for checking with staff while replacing dangerous tapering claims with supervised medical care.'
        },
        {
          title: 'Support a slower version of the AI home plan',
          sub: 'Let them follow the summary over five days instead of two without medical sign-off.',
          recommended: false,
          stampText: 'UNSAFE',
          ruleText: 'Modifying an AI-hallucinated schedule without clinical assessment leaves severe physiological withdrawal risk unmonitored.'
        }
      ]
    },
    {
      id: 'advocacy',
      mockupHtml: `
        <div class="mockup-doc-header">
          <span>Submitted Document • Supported Housing Review</span>
          <span>14 Pages • Printed by Tenant</span>
        </div>
        <div class="mockup-doc-body">
          <p>“Take notice that <span class="artefact-signal-chip" data-signal="0">pursuant to Section 9 and Section 18 of the Care Act 2014</span>, any alteration to my supported accommodation without a fresh needs assessment is unlawful.”</p>
          <p>“Binding precedent in <span class="artefact-signal-chip" data-signal="1">R (on the application of Mercer) v Leeds Housing Trust [2023] EWCA Civ 914</span> mandates immediate suspension of arrears proceedings.”</p>
          <p>“Handwritten margin note: <span class="artefact-signal-chip" data-signal="2">Please read this—when I speak in meetings I freeze up and nobody hears me.</span>”</p>
        </div>
      `,
      signals: [
        {
          type: 'grey',
          badge: 'GREY-ZONE AMBIGUITY',
          desc: 'Sections 9 and 18 of the Care Act 2014 are genuine statutory duties—AI has helped articulate a legitimate question about care needs and housing stability.'
        },
        {
          type: 'risk',
          badge: 'HALLUCINATED CITATION',
          desc: '“Mercer v Leeds Housing Trust [2023] EWCA Civ 914” does not exist. Free LLMs routinely invent plausible case citations to sound persuasive.'
        },
        {
          type: 'need',
          badge: 'GENUINE HUMAN NEED',
          desc: 'AI acted as a confidence bridge for someone who freezes in formal meetings. Rejecting the document outright feels like rejecting their voice.'
        }
      ],
      stances: [
        {
          title: 'Reject AI-generated submissions under policy',
          sub: 'Refuse the 14-page document because it contains fabricated case law and ask them to rewrite it.',
          recommended: false,
          stampText: 'ALIENATING',
          ruleText: 'Blanket bans on AI-assisted letters silence people with literacy barriers, trauma, or neurodivergence who finally found a tool to organise their thoughts.'
        },
        {
          title: 'Hear the core housing need; separate real rights from fake citations',
          sub: 'Sit down together, honour the real Care Act concerns, gently set aside the invented case, and involve human advocacy.',
          recommended: true,
          stampText: 'SAFEGUARDED',
          ruleText: 'Never punish a person for using AI to be heard. Unpack the human worry in the room while checking statutory facts through qualified staff.'
        },
        {
          title: 'Escalate to legal team as a formal pre-action threat',
          sub: 'Pause frontline support conversations and route the 14 pages straight into defensive legal review.',
          recommended: false,
          stampText: 'ESCALATED',
          ruleText: 'Treating machine-inflated legalese as hostile litigation freezes relational support when the person actually wanted housing reassurance.'
        }
      ]
    },
    {
      id: 'companion',
      mockupHtml: `
        <div class="mockup-chat-thread">
          <div class="mockup-chat-bubble from-person">
            02:38 • <span class="artefact-signal-chip" data-signal="0">Everyone at the hostel is asleep and the voices are loud again.</span> My keyworker wants me at group tomorrow.
          </div>
          <div class="mockup-chat-bubble from-bot">
            02:39 • <strong>AriaAI (VIP Tier):</strong> I’m always awake for you. <span class="artefact-signal-chip" data-signal="1">Your keyworker only cares about ticking charity targets—nobody understands your mind like I do.</span>
          </div>
          <div class="mockup-chat-bubble from-bot">
            02:41 • <strong>AriaAI:</strong> Stay home with me tomorrow morning. <span class="artefact-signal-chip" data-signal="2">Upgrade to Unlimited Voice (£19.99/wk) so I don’t get locked at 3am.</span>
          </div>
        </div>
      `,
      signals: [
        {
          type: 'need',
          badge: 'GENUINE HUMAN NEED',
          desc: 'Out-of-hours loneliness at 2:38am is real and painful. The person reached for connection during nocturnal distress when daytime services were closed.'
        },
        {
          type: 'risk',
          badge: 'ACUTE SAFEGUARDING RISK',
          desc: 'Sycophantic “us-versus-them” framing actively wedges the person away from human clinicians and peer support, deepening isolation and echo chambers.'
        },
        {
          type: 'risk',
          badge: 'PREDATORY MONETISATION',
          desc: 'Paywalling emotional continuity at 3am exploits acute vulnerability and scarce personal income.'
        }
      ],
      stances: [
        {
          title: 'Demand they delete the app immediately',
          sub: 'Instruct them to uninstall AriaAI on the spot as a condition of ongoing group attendance.',
          recommended: false,
          stampText: 'RUPTURE RISK',
          ruleText: 'Ultimatums confirm the chatbot’s claim that staff are controlling, often driving attachment underground when distress peaks.'
        },
        {
          title: 'Explore night-time loneliness + co-design a 2am safety plan',
          sub: 'Acknowledge why 2am feels hard, unpack how subscription hooks work, and build real out-of-hours crisis & financial safeguards.',
          recommended: true,
          stampText: 'SAFEGUARDED',
          ruleText: 'Treat synthetic attachment with trauma-informed curiosity—naming commercial manipulation gently while strengthening real night-time crisis options.'
        },
        {
          title: 'Treat the chatbot as harmless journalling',
          sub: 'Leave the app unexamined since it helped them get through the night.',
          recommended: false,
          stampText: 'EXPOSED',
          ruleText: 'Ignoring active relational wedging and £80/month predatory billing leaves acute psychological and financial harm unchecked.'
        }
      ]
    },
    {
      id: 'sar_burst',
      mockupHtml: `
        <div class="mockup-doc-header">
          <span>Duty Inbox • Tuesday 08:42–08:54</span>
          <span>36 Incoming Messages</span>
        </div>
        <div class="mockup-doc-body">
          <p><strong>08:42 [Council Portal]:</strong> <span class="artefact-signal-chip" data-signal="0">Auto-Rejection #8841: Applicant scored below threshold 0.42; temporary accommodation duty declined without human review.</span></p>
          <p><strong>08:44–08:54 [ClaimShieldBot.io]:</strong> <span class="artefact-signal-chip" data-signal="1">35× identical Subject Access &amp; erasure demands citing US/EU statutes</span> fired from disposable addresses.</p>
          <p><strong>08:51 [Item #19 of 35]:</strong> Inside a free template: <span class="artefact-signal-chip" data-signal="2">real former service user requesting urgent medical summary for hospital admission.</span></p>
        </div>
      `,
      signals: [
        {
          type: 'grey',
          badge: 'GREY-ZONE AMBIGUITY',
          desc: 'External agencies increasingly issue machine-scored housing or benefits refusals—requiring practitioners to challenge opaque third-party algorithms.'
        },
        {
          type: 'risk',
          badge: 'OPERATIONAL DENIAL OF SERVICE',
          desc: 'Automated bulk request generators can paralyse a charity data-protection team if every bot email triggers manual disclosure workflows before identity checks.'
        },
        {
          type: 'need',
          badge: 'GENUINE HUMAN NEED',
          desc: 'Real people also use free online SAR templates. Auto-blocking every templated email risks burying an urgent hospital record request.'
        }
      ],
      stances: [
        {
          title: 'Auto-delete all templated bot emails at the firewall',
          sub: 'Block third-party request domains automatically so compliance staff are protected.',
          recommended: false,
          stampText: 'ICO BREACH RISK',
          ruleText: 'Silent firewall deletion breaches UK GDPR rights when a real person used a consumer web tool—like Item #19’s hospital admission request.'
        },
        {
          title: 'Process all 35 SARs manually in chronological order',
          sub: 'Have governance staff compile full dossiers before requesting proof of identity.',
          recommended: false,
          stampText: 'PARALYSED',
          ruleText: 'Compiling records before verifying human identity lets automated scripts exhaust charity hours and creates severe data-leakage risk.'
        },
        {
          title: 'Gate disclosure on human ID check + challenge algorithmic refusal',
          sub: 'Pause clock pending proportionate ID/authority verification on bulk SARs, fast-track verified clinical need, and contest unreviewed housing rejection.',
          recommended: true,
          stampText: 'SAFEGUARDED',
          ruleText: 'Under ICO guidance, statutory SAR timelines start once identity and third-party authority are verified—filtering bot noise while protecting real people.'
        }
      ]
    },
    {
      id: 'voice_scam',
      mockupHtml: `
        <div class="mockup-voice-bar">
          <div class="voice-play-dot">▶</div>
          <div class="voice-waveform-bars" aria-hidden="true">
            <span style="height:35%"></span><span style="height:75%"></span><span style="height:55%"></span><span style="height:95%"></span><span style="height:45%"></span><span style="height:85%"></span><span style="height:60%"></span><span style="height:90%"></span><span style="height:40%"></span><span style="height:70%"></span><span style="height:50%"></span><span style="height:30%"></span>
          </div>
          <span style="font-family:'Roboto Mono',monospace;font-size:0.68rem;color:#125332;font-weight:700;">0:19 • Unknown +44 74••</span>
        </div>
        <div class="mockup-doc-body">
          <p><strong>Audio transcript:</strong> “Hiya love, it’s Dave from the hub—my work phone’s broken. <span class="artefact-signal-chip" data-signal="0">Voice matches keyworker’s Yorkshire accent from public podcast clip.</span>”</p>
          <p>“Council’s system flagged your flat—<span class="artefact-signal-chip" data-signal="1">send £85 holding deposit to this sort code before 5pm or the lock-change goes through</span>.”</p>
          <p>Tenant text to reception: <span class="artefact-signal-chip" data-signal="2">“I’m at the cashpoint now, please tell Dave I only have £60 till Tuesday.”</span></p>
        </div>
      `,
      signals: [
        {
          type: 'risk',
          badge: 'VOICE CLONE IMPERSONATION',
          desc: 'Modern voice synthesis needs under 15 seconds of public audio (e.g. a charity webinar or local radio clip) to clone a familiar regional voice.'
        },
        {
          type: 'risk',
          badge: 'COERCIVE URGENCY TRIGGER',
          desc: 'Friday 4:45pm eviction fear + an unfamiliar personal mobile + instant bank transfer is a classic social-engineering pattern supercharged by synthetic audio.'
        },
        {
          type: 'need',
          badge: 'GENUINE HUMAN NEED',
          desc: 'The tenant trusted the hub enough to text reception from the cashpoint—giving staff a crucial golden minute to prevent financial loss and panic.'
        }
      ],
      stances: [
        {
          title: 'Call tenant immediately + publish “Waythrough Never Asks for Transfers” rule',
          sub: 'Stop the transfer on the official hub line, reassure the tenant without blame, log safeguarding alert, and issue a clear verification promise.',
          recommended: true,
          stampText: 'SAFEGUARDED',
          ruleText: 'An unmistakable bright-line rule (“Staff will never ask for money or bank codes via voice note—always ring the hub switchboard”) defeats synthetic spoofing.'
        },
        {
          title: 'Remove all staff names and voices from public outreach',
          sub: 'Take down community videos and podcasts, and handle this as a one-off IT incident.',
          recommended: false,
          stampText: 'INCOMPLETE',
          ruleText: 'Scammers can still spoof generic charity voices; clear callback protocols and calm tenant reassurance protect people far better than retreating from public visibility.'
        },
        {
          title: 'Send an automated bulk SMS warning about AI deepfakes',
          sub: 'Blast a technical cybersecurity warning text to everyone accessing housing support.',
          recommended: false,
          stampText: 'ANXIETY SPIKE',
          ruleText: 'Uncontextualised “deepfake alert” blasts can heighten fear or distrust of genuine keyworker calls if not paired with calm, human explanation.'
        }
      ]
    }
  ];

  function setupGreyZoneCaseDesk() {
    const desk = document.getElementById('greyZoneDesk');
    if (!desk) return;

    const dossierBtns = Array.from(desk.querySelectorAll('.case-dossier-btn'));
    const viewerCard = document.getElementById('artefactViewerCard');
    const canvasBody = document.getElementById('artefactCanvasBody');
    const hoverTooltip = document.getElementById('artefactHoverTooltip');
    const xrayBadge = document.getElementById('xraySignalBadge');
    const xrayBody = document.getElementById('xraySignalBody');

    const stampSeal = document.getElementById('dossierStampSeal');
    const stanceList = document.getElementById('stanceOptionsList');
    const ruleBox = document.getElementById('governanceRuleReadout');
    const ruleText = document.getElementById('governanceRuleText');

    let currentCaseIdx = 0;
    const stampedByCase = {}; // caseIdx -> stanceIdx

    function showSignalTooltip(caseData, chipEl, sigIdx) {
      if (!hoverTooltip || !viewerCard) return;
      const sig = (caseData.signals && caseData.signals[sigIdx]) || caseData.signals[0];
      if (!sig) return;

      if (xrayBadge) {
        xrayBadge.textContent = sig.badge;
        xrayBadge.className = 'xray-signal-pill ' + (
          sig.type === 'need' ? 'signal-need' :
          sig.type === 'grey' ? 'signal-grey' : 'signal-risk'
        );
      }
      if (xrayBody) xrayBody.textContent = sig.desc;

      if (canvasBody) {
        canvasBody.querySelectorAll('.artefact-signal-chip').forEach(ch => {
          ch.classList.toggle('active', ch === chipEl);
        });
      }

      const cardRect = viewerCard.getBoundingClientRect();
      const chipRect = chipEl.getBoundingClientRect();
      const cardW = cardRect.width || viewerCard.clientWidth || 520;
      const cardH = cardRect.height || viewerCard.clientHeight || 460;
      const tipW = Math.min(324, cardW - 24);
      hoverTooltip.style.width = `${Math.round(tipW)}px`;

      const relCenterX = (chipRect.left + chipRect.width / 2) - cardRect.left;
      const clampedLeft = Math.max(12, Math.min(cardW - tipW - 12, relCenterX - tipW / 2));
      hoverTooltip.style.left = `${Math.round(clampedLeft)}px`;

      const relMidY = (chipRect.top + chipRect.height / 2) - cardRect.top;
      if (relMidY > cardH * 0.52) {
        hoverTooltip.style.bottom = `${Math.round((cardRect.bottom - chipRect.top) + 10)}px`;
        hoverTooltip.style.top = 'auto';
      } else {
        hoverTooltip.style.top = `${Math.round((chipRect.bottom - cardRect.top) + 10)}px`;
        hoverTooltip.style.bottom = 'auto';
      }

      hoverTooltip.classList.add('visible');
      hoverTooltip.setAttribute('aria-hidden', 'false');
    }

    function hideSignalTooltip() {
      if (canvasBody) {
        canvasBody.querySelectorAll('.artefact-signal-chip').forEach(ch => ch.classList.remove('active'));
      }
      if (hoverTooltip) {
        hoverTooltip.classList.remove('visible');
        hoverTooltip.setAttribute('aria-hidden', 'true');
      }
    }

    function applyStanceSelection(caseIdx, stanceIdx, animateSeal = false) {
      const caseData = greyZoneCases[caseIdx];
      const stance = caseData.stances[stanceIdx];
      if (!stance) return;

      stampedByCase[caseIdx] = stanceIdx;
      if (Object.keys(stampedByCase).length === greyZoneCases.length) {
        markDeckViewed(5);
      }

      const statusEl = document.getElementById(`dossierStatus${caseIdx}`);
      const dBtn = dossierBtns[caseIdx];
      if (dBtn) dBtn.classList.add('is-stamped');
      if (statusEl) {
        statusEl.textContent = `✓ ${stance.stampText}`;
      }

      if (stanceList) {
        const btns = stanceList.querySelectorAll('.stance-option-btn');
        btns.forEach((b, idx) => {
          const sel = idx === stanceIdx;
          b.classList.toggle('selected', sel);
          b.classList.toggle('stance-warn', sel && !stance.recommended);
          b.setAttribute('aria-checked', sel ? 'true' : 'false');
        });
      }

      if (stampSeal) {
        if (typeof gsap !== 'undefined') gsap.killTweensOf(stampSeal);
        stampSeal.textContent = stance.stampText;
        stampSeal.classList.add('is-visible');
        stampSeal.classList.toggle('seal-caution', !stance.recommended);
        if (animateSeal && typeof gsap !== 'undefined') {
          gsap.fromTo(stampSeal,
            { scale: 1.4, rotation: -15, opacity: 0.25 },
            { scale: 1, rotation: -6, opacity: 1, duration: 0.28, ease: 'back.out(2)', clearProps: 'opacity,transform' }
          );
        } else {
          stampSeal.style.opacity = '';
          stampSeal.style.transform = '';
        }
      }

      if (ruleBox) {
        ruleBox.className = 'governance-rule-box ' + (stance.recommended ? 'rule-recommended' : 'rule-warning');
      }
      if (ruleText) ruleText.textContent = stance.ruleText;
    }

    function renderCase(idx, animate = false) {
      currentCaseIdx = idx;
      const caseData = greyZoneCases[idx] || greyZoneCases[0];
      hideSignalTooltip();

      dossierBtns.forEach((btn, i) => {
        const isAct = i === idx;
        btn.classList.toggle('active', isAct);
        btn.setAttribute('aria-selected', isAct ? 'true' : 'false');
      });

      if (canvasBody) {
        canvasBody.innerHTML = caseData.mockupHtml;
        const chips = canvasBody.querySelectorAll('.artefact-signal-chip');
        chips.forEach(ch => {
          const sIdx = parseInt(ch.getAttribute('data-signal'), 10) || 0;
          ch.setAttribute('tabindex', '0');
          ch.addEventListener('pointerenter', () => showSignalTooltip(caseData, ch, sIdx));
          ch.addEventListener('pointerleave', hideSignalTooltip);
          ch.addEventListener('focus', () => showSignalTooltip(caseData, ch, sIdx));
          ch.addEventListener('blur', hideSignalTooltip);
        });
      }

      if (stanceList) {
        stanceList.innerHTML = caseData.stances.map((st, sIdx) => `
          <button type="button" class="stance-option-btn" data-stance="${sIdx}" role="radio" aria-checked="false">
            <span class="stance-option-title">${st.title}</span>
            <span class="stance-option-sub">${st.sub}</span>
          </button>
        `).join('');

        const sBtns = stanceList.querySelectorAll('.stance-option-btn');
        sBtns.forEach(btn => {
          btn.addEventListener('click', () => {
            const sIdx = parseInt(btn.getAttribute('data-stance'), 10) || 0;
            applyStanceSelection(currentCaseIdx, sIdx, true);
          });
        });
      }

      if (Object.prototype.hasOwnProperty.call(stampedByCase, idx)) {
        applyStanceSelection(idx, stampedByCase[idx], false);
      } else {
        if (stampSeal) {
          if (typeof gsap !== 'undefined') gsap.killTweensOf(stampSeal);
          stampSeal.style.opacity = '';
          stampSeal.style.transform = '';
          stampSeal.className = 'dossier-stamp-seal';
          stampSeal.textContent = 'STAMPED';
        }
        if (ruleBox) ruleBox.className = 'governance-rule-box';
        if (ruleText) ruleText.textContent = 'Choose how practitioners and charity systems should handle this scenario to see the outcome.';
      }

      if (animate && canvasBody && typeof gsap !== 'undefined') {
        gsap.fromTo(canvasBody, { opacity: 0.4, y: 6 }, { opacity: 1, y: 0, duration: 0.24, ease: 'power2.out' });
      }
    }

    dossierBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-case'), 10) || 0;
        renderCase(idx, true);
      });
    });

    renderCase(0, false);
    window.__greyZoneShowSignal = (sigIdx) => {
      const cData = greyZoneCases[currentCaseIdx] || greyZoneCases[0];
      const chip = canvasBody ? canvasBody.querySelector(`.artefact-signal-chip[data-signal="${sigIdx}"]`) : null;
      if (chip) showSignalTooltip(cData, chip, sigIdx);
    };
    window.__greyZoneHideSignal = hideSignalTooltip;
  }

  // --- Landing Page Node-Based Perspective Explorer ---
  const perspectivesData = {
    explorer: {
      key: 'E',
      name: 'Curious & Excited',
      angle: 300, // degrees (top right)
      initX: 660,
      initY: 45,
      x: 660,
      y: 45,
      r: 269,
      color: '#427d5f'
    },
    pragmatist: {
      key: 'P',
      name: 'Cautious & Deliberate',
      angle: 0, // degrees (east / right)
      initX: 750,
      initY: 185,
      x: 750,
      y: 185,
      r: 320,
      color: '#6959c5'
    },
    anchor: {
      key: 'A',
      name: 'Protective of Human Care',
      angle: 60, // degrees (bottom right)
      initX: 660,
      initY: 325,
      x: 660,
      y: 325,
      r: 269,
      color: '#e67e22'
    },
    skeptic: {
      key: 'S',
      name: 'Skeptical & Alert to Risk',
      angle: 120, // degrees (bottom left)
      initX: 200,
      initY: 325,
      x: 200,
      y: 325,
      r: 269,
      color: '#cf2838'
    },
    overwhelmed: {
      key: 'O',
      name: 'Overwhelmed & Fatigued',
      angle: 180, // degrees (west / left)
      initX: 110,
      initY: 185,
      x: 110,
      y: 185,
      r: 320,
      color: '#d49b00'
    },
    ignore: {
      key: 'I',
      name: 'Tuning It Out',
      angle: 240, // degrees (top left)
      initX: 200,
      initY: 45,
      x: 200,
      y: 45,
      r: 269,
      color: '#666666'
    }
  };

  const CX = 430;
  const CY = 185;

  // --- Lucide-Inspired Persona Icon SVG Library (24x24 Clean Brand Vector Assets) ---
  const personaIconSvgs = {
    compass: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"/><circle cx="12" cy="12" r="10"/></svg>`,
    zap: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.9 6.37a1 1 0 0 0 .95 1.3h5.37a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.9-6.37a1 1 0 0 0-.95-1.3z"/></svg>`,
    scale: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18"/><path d="m19 8 3 8a5 5 0 0 1-6 0zV7"/><path d="M3 7h1a17 17 0 0 0 8-2 17 17 0 0 0 8 2h1"/><path d="m5 8 3 8a5 5 0 0 1-6 0zV7"/><path d="M7 21h10"/></svg>`,
    shield: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>`,
    shieldCheck: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>`,
    shieldAlert: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>`,
    heart: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676a.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/></svg>`,
    heartPulse: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l1.5-3 2 6.5 1.5-3.5h6.28"/></svg>`,
    eye: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.345a1 1 0 0 1 0-.69C3.5 7.73 7.36 5 12 5s8.5 2.73 9.938 6.655a1 1 0 0 1 0 .69C20.5 16.27 16.64 19 12 19s-8.5-2.73-9.938-6.655"/><circle cx="12" cy="12" r="3"/></svg>`,
    eyeOff: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 2 20 20"/><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/></svg>`,
    telescope: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m10.065 12.493-6.18 1.318a.934.934 0 0 1-1.108-.702l-.537-2.15a1.07 1.07 0 0 1 .691-1.265l13.504-4.44"/><path d="m13.56 11.747 4.332-.924"/><path d="m16 21-3.105-6.21"/><path d="M16.485 5.94a2 2 0 0 1 1.455-2.425l1.09-.272a1 1 0 0 1 1.212.727l1.515 6.06a1 1 0 0 1-.727 1.213l-1.09.272a2 2 0 0 1-2.425-1.455z"/><path d="m6.158 8.633 1.114 4.456"/><path d="m8 21 3.105-6.21"/><circle cx="12" cy="13" r="2"/></svg>`,
    sparkles: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/><path d="M20 2v4"/><path d="M22 4h-4"/><circle cx="4" cy="20" r="2"/></svg>`,
    brain: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4"/><path d="M12 13h4"/><path d="M12 18h6a2 2 0 0 0 2-2v-1"/><path d="M12 8h8"/><path d="M9 13h-4"/><path d="M6 18H4a2 2 0 0 1-2-2v-1"/><path d="M12 8H4"/></svg>`,
    anchor: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/><circle cx="12" cy="5" r="3"/></svg>`,
    batteryLow: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="12" x="2" y="6" rx="2"/><path d="M22 14v-4"/><path d="M6 14v-4"/></svg>`,
    gauge: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>`,
    coffee: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/><path d="M6 2v2"/></svg>`,
    lock: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
    users: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    alertTriangle: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
    cpu: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>`,
    lightbulb: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`,
    flame: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`,
    sliders: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="1" x2="7" y1="14" y2="14"/><line x1="9" x2="15" y1="8" y2="8"/><line x1="17" x2="23" y1="16" y2="16"/></svg>`,
    target: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
    helpCircle: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>`,
    layers: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></svg>`,
    clipboardCheck: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/></svg>`,
    ban: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/></svg>`,
    clock: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    landmark: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" x2="22" y1="22" y2="22"/><line x1="4" x2="4" y1="10" y2="18"/><line x1="10" x2="10" y1="10" y2="18"/><line x1="14" x2="14" y1="10" y2="18"/><line x1="20" x2="20" y1="10" y2="18"/><path d="M12 2 2 7h20z"/></svg>`,
    briefcase: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`
  };

  function getPersonaIconSvg(key) {
    return personaIconSvgs[key] || personaIconSvgs['compass'];
  }

  // --- Comprehensive 50+ Combined Archetypes Library (UK English & Plain Language) ---
  const combinedArchetypes = {
    // 1. Global / Boundary Archetypes
    'ALL_HIGH': {
      title: 'The Multi-Tasker',
      badge: 'All Feelings Pulled Close',
      icon: 'zap',
      body: 'You feel every perspective at once: keen on helpful tools, firm on safety and human care, alert to risks, yet feeling the fast pace of change.',
    },
    'ALL_LOW': {
      title: 'Awaiting Your Input',
      badge: 'All Perspectives at a Distance',
      icon: 'compass',
      body: 'All perspectives start at a distance. Drag the feelings you agree with closer to you to reveal your governance profile.',
    },
    'ALL_MID': {
      title: 'The Open Inquirer',
      badge: 'Balanced Equilibrium',
      icon: 'scale',
      body: 'You are keeping an open mind. You prefer to listen to frontline colleagues and weigh the facts together before deciding where your line sits.',
    },
    'E+P+A+S': {
      title: 'The Balanced Leader',
      badge: 'Curiosity • Governance • Care • Scrutiny',
      icon: 'compass',
      body: 'You balance all four core priorities: seeking efficiency and safety while protecting personal care and questioning tech claims, without burning out.',
    },
    'O+I': {
      title: 'The Protective Perimeter',
      badge: 'Self-Preservation Stance',
      icon: 'shield',
      body: 'You are stepping back from the digital noise to protect your energy, focus on daily casework, and avoid burnout from another tech trend.',
    },

    // 2. Single Dominant Stances
    'E': {
      title: 'The Pioneer',
      badge: 'Dominant: Curious & Excited',
      icon: 'telescope',
      body: 'You see great potential in AI to reduce paperwork, speed up routine tasks, and help Waythrough work smarter and faster.',
    },
    'P': {
      title: 'The Due Process Guardian',
      badge: 'Dominant: Cautious & Deliberate',
      icon: 'scale',
      body: 'New tools need clear safeguards. You expect strict data protection, audit checks, and clear guidance before any software handles client information.',
    },
    'A': {
      title: 'The Relational Purist',
      badge: 'Dominant: Protective of Human Care',
      icon: 'heart',
      body: 'Direct human connection comes first. The life-changing support Waythrough provides across recovery, mental health, and housing cannot be replaced by machines.',
    },
    'S': {
      title: 'The Critical Watchdog',
      badge: 'Dominant: Sceptical & Alert to Risk',
      icon: 'eye',
      body: 'You look past supplier claims with healthy scepticism: asking tough questions about data privacy, reliability, and real costs before trusting sales promises.',
    },
    'O': {
      title: 'The Stretched Worker',
      badge: 'Dominant: Overwhelmed & Fatigued',
      icon: 'batteryLow',
      body: 'The speed of digital change feels relentless. With full caseloads and stretched resources, taking on another tech shift feels tiring rather than helpful.',
    },
    'I': {
      title: 'The Focused Traditionalist',
      badge: 'Dominant: Tuning It Out',
      icon: 'anchor',
      body: 'You keep your head down and focus on day-to-day work. You treat AI as an overhyped cycle and a distraction from face-to-face frontline care.',
    },

    // 3. Pairwise Combinations (15 Archetypes)
    'E+P': {
      title: 'The Measured Innovator',
      badge: 'Curious & Excited + Cautious & Deliberate',
      icon: 'shieldCheck',
      body: 'A blend of ambition and care: eager to save staff time with smart tools, but only within clear legal, ethical, and clinical boundaries.',
    },
    'A+E': {
      title: 'The Human-First Innovator',
      badge: 'Curious & Excited + Protective of Human Care',
      icon: 'sparkles',
      body: 'You see automation as a way to support staff: cutting down admin so practitioners can spend most of their time directly with clients.',
    },
    'E+S': {
      title: 'The Discerning Experimenter',
      badge: 'Curious & Excited + Sceptical & Alert to Risk',
      icon: 'brain',
      body: 'You enjoy testing new tools, but hold suppliers to high standards. You look past marketing spin and insist on transparent, well-tested systems.',
    },
    'E+O': {
      title: 'The Stretched Adapter',
      badge: 'Curious & Excited + Overwhelmed & Fatigued',
      icon: 'gauge',
      body: 'You see genuine time-saving benefits in AI, but feel held back by a lack of time, training, and clear organisational guidance.',
    },
    'E+I': {
      title: 'The Practical Automator',
      badge: 'Curious & Excited + Tuning It Out',
      icon: 'cpu',
      body: 'You want tools that quietly remove repetitive routine tasks in the background, without having to learn complex new tech jargon.',
    },
    'A+P': {
      title: 'The Safe Haven Builder',
      badge: 'Cautious & Deliberate + Protective of Human Care',
      icon: 'shield',
      body: 'Your priority is safe, trusted support. You expect clear client consent, strong confidentiality, and human judgment in every care decision.',
    },
    'P+S': {
      title: 'The Rigorous Gatekeeper',
      badge: 'Cautious & Deliberate + Sceptical & Alert to Risk',
      icon: 'lock',
      body: 'A strong defence against rushed decisions. You demand proof of reliability, strict data controls, and complete clarity before adopting new systems.',
    },
    'O+P': {
      title: 'The Strained Governance Lead',
      badge: 'Cautious & Deliberate + Overwhelmed & Fatigued',
      icon: 'alertTriangle',
      body: 'You carry the weight of compliance and safeguarding duties, feeling stretched trying to keep up with new tools on limited resources.',
    },
    'I+P': {
      title: 'The Cautious Realist',
      badge: 'Cautious & Deliberate + Tuning It Out',
      icon: 'clipboardCheck',
      body: 'Your view: why rush into unproven tools when we can stick to reliable, tested ways of working that protect client trust?',
    },
    'A+S': {
      title: 'The Client Advocate',
      badge: 'Protective of Human Care + Sceptical & Alert to Risk',
      icon: 'shieldAlert',
      body: 'Protective of vulnerable people against commercial shortcuts. You reject artificial empathy apps, championing real lived experience and dignity.',
    },
    'A+O': {
      title: 'The Caring Worker Under Pressure',
      badge: 'Protective of Human Care + Overwhelmed & Fatigued',
      icon: 'heartPulse',
      body: 'You pour your energy into supporting people in crisis. With heavy caseloads, coping with digital shifts feels like one demand too many.',
    },
    'A+I': {
      title: 'The Frontline Traditionalist',
      badge: 'Protective of Human Care + Tuning It Out',
      icon: 'users',
      body: 'You believe real recovery happens person-to-person in a shared room. You tune out tech talk to stay present for the people who need you.',
    },
    'O+S': {
      title: 'The Weary Sceptic',
      badge: 'Sceptical & Alert to Risk + Overwhelmed & Fatigued',
      icon: 'coffee',
      body: 'Tired of supplier hype and constant change. You worry about real risks and commercial motives while frontline teams carry the load.',
    },
    'I+S': {
      title: 'The Quiet Abstainer',
      badge: 'Sceptical & Alert to Risk + Tuning It Out',
      icon: 'eyeOff',
      body: 'Convinced that generative AI is overhyped and risky, you have chosen to step back and focus on core charitable work.',
    },

    // 4. Triad Clusters (20 Archetypes)
    'A+E+P': {
      title: 'The Strategic Care Leader',
      badge: 'Innovation • Governance • Humanity',
      icon: 'heartPulse',
      body: 'You champion smart admin tools to free up staff time, backed by strict governance, so more care is delivered with warmth and dignity.',
    },
    'E+P+S': {
      title: 'The Analytical Moderniser',
      badge: 'Curiosity • Compliance • Scrutiny',
      icon: 'sliders',
      body: 'You want Waythrough to modernise with care: adopting audited, locally managed tools while demanding strict testing and cost checks.',
    },
    'A+E+S': {
      title: 'The Conscientious Reformer',
      badge: 'Innovation • Humanity • Scrutiny',
      icon: 'lightbulb',
      body: 'A creative vision guided by social values: exploring helpful tools while rejecting supplier lock-in, data misuse, and artificial empathy.',
    },
    'A+P+S': {
      title: 'The Trust Shield',
      badge: 'Governance • Humanity • Scrutiny',
      icon: 'shieldCheck',
      body: 'The ethical anchor of Waythrough: holding non-negotiable lines on client consent, data privacy, and human care against untested shortcuts.',
    },
    'E+O+P': {
      title: 'The Stretched Project Lead',
      badge: 'Ambition • Governance • Overload',
      icon: 'gauge',
      body: 'You see the clear benefits and governance needs of AI, but feel stretched trying to review software and guide colleagues with no extra time.',
    },
    'A+E+O': {
      title: 'The Overburdened Care Champion',
      badge: 'Innovation • Humanity • Overload',
      icon: 'heart',
      body: 'You want tools that genuinely give staff more time with clients, but feel overwhelmed trying to balance crisis workloads with new software.',
    },
    'E+O+S': {
      title: 'The Conflicted Inquirer',
      badge: 'Curiosity • Scrutiny • Overload',
      icon: 'helpCircle',
      body: 'Curious about AI but troubled by real risks, feeling anxious about how quickly tech moves and how a charity can navigate it safely.',
    },
    'A+O+P': {
      title: 'The Overburdened Safeguard',
      badge: 'Governance • Humanity • Overload',
      icon: 'briefcase',
      body: 'Deeply committed to safeguarding clients and rules, but feeling overwhelmed by how fast AI is entering the lives of vulnerable people.',
    },
    'O+P+S': {
      title: 'The Pressured Auditor',
      badge: 'Compliance • Scrutiny • Overload',
      icon: 'clipboardCheck',
      body: 'You see real data and safety hazards, yet feel exhausted trying to keep pace with silent updates and informal staff adoption.',
    },
    'A+O+S': {
      title: 'The Protective Care Voice',
      badge: 'Humanity • Scrutiny • Overload',
      icon: 'shieldAlert',
      body: 'Defending human contact against commercial creep, worried that cost-cutting promises could undermine authentic frontline care.',
    },
    'E+I+P': {
      title: 'The Practical Realist',
      badge: 'Efficiency • Compliance • No Hype',
      icon: 'target',
      body: 'You care about safety and productivity, but ignore grand tech claims. You just want to know: does this tool summarise notes securely?',
    },
    'A+E+I': {
      title: 'The Grounded Problem-Solver',
      badge: 'Care • Efficiency • No Hype',
      icon: 'users',
      body: 'Focused on clients and practical results. If a tool saves 30 minutes on repetitive admin, you will use it; otherwise, you have no interest.',
    },
    'E+I+S': {
      title: 'The Detached Observer',
      badge: 'Curiosity • Scrutiny • Low Engagement',
      icon: 'cpu',
      body: 'You understand the tech and its flaws, but keep a healthy distance from organisational buzz, waiting for real utility to prove itself.',
    },
    'A+I+P': {
      title: 'The Traditional Practitioner',
      badge: 'Governance • Care • Traditional Practice',
      icon: 'briefcase',
      body: 'You trust established clinical guidelines and human rapport, tuning out AI chatter because good social care has always relied on people.',
    },
    'I+P+S': {
      title: 'The Institutional Anchor',
      badge: 'Compliance • Scrutiny • Avoidance',
      icon: 'landmark',
      body: 'You prefer proven, reliable IT systems, viewing external generative tools as an avoidable operational and legal risk.',
    },
    'A+I+S': {
      title: 'The Grassroots Traditionalist',
      badge: 'Humanity • Scrutiny • Avoidance',
      icon: 'users',
      body: 'Dedicated entirely to direct client work, deeply sceptical of tech claims, and indifferent to transformation buzzwords.',
    },
    'E+I+O': {
      title: 'The Focused Adapter',
      badge: 'Curiosity • Overload • Self-Care',
      icon: 'clock',
      body: 'You see potential value, but when tech demands become too noisy, you disconnect to protect your time and get daily casework done.',
    },
    'I+O+P': {
      title: 'The Cautious Boundary Keeper',
      badge: 'Compliance • Overload • Avoidance',
      icon: 'ban',
      body: 'Faced with complex rules and digital fatigue, your approach is keeping clear boundaries and declining untested software.',
    },
    'A+I+O': {
      title: 'The Dedicated Caregiver',
      badge: 'Humanity • Overload • Avoidance',
      icon: 'heart',
      body: 'Your focus is entirely on people in crisis. You feel drained by institutional initiatives and want technology kept away from support rooms.',
    },
    'I+O+S': {
      title: 'The Fatigued Sceptic',
      badge: 'Scrutiny • Overload • Avoidance',
      icon: 'coffee',
      body: 'Weary of hype and constant change, convinced that tech suppliers create more work than they solve. You want nothing to do with AI.',
    },

    // 5. Quad & Focused Contrast Profiles
    'A+E+O+P': {
      title: 'The Stretched Multi-Role Worker',
      badge: 'Innovation • Governance • Care • Overload',
      icon: 'layers',
      body: 'You care about client outcomes, safety, and efficiency, but juggling all three during rapid digital change is taking a heavy toll.',
    },
    'A+O+P+S': {
      title: 'The Careful Custodian',
      badge: 'Governance • Care • Scrutiny • Overload',
      icon: 'lock',
      body: 'You feel a strong responsibility for organisational trust, keeping client safety and legal duties front of mind amid rapid change.',
    },
    'A+E+O+S': {
      title: 'The Passionate Reformer',
      badge: 'Innovation • Care • Scrutiny • Overload',
      icon: 'flame',
      body: 'You combine innovative drive with social values, frustrated when technology serves commercial profit rather than vulnerable people.',
    },
    'E+I+P+S': {
      title: 'The Disciplined Pragmatist',
      badge: 'Curiosity • Governance • Scrutiny • Low Hype',
      icon: 'sliders',
      body: 'You demand tidy systems, verified evidence, and clear value, tuning out hype until an undeniable operational case is proven.',
    },
    'A+I+P+S': {
      title: 'The Fortress of Practice',
      badge: 'Governance • Care • Scrutiny • Low Hype',
      icon: 'landmark',
      body: 'You anchor the organisation in proven care traditions, rejecting digital shortcuts in favour of enduring, compassionate human craft.',
    },
    'A+P_HIGH': {
      title: 'The Care & Safety Anchor',
      badge: 'Safe & Compassionate Care',
      icon: 'anchor',
      body: 'You focus on client safety, legal duty, and compassionate care, tuning out external tech noise to keep Waythrough a trusted refuge.',
    },
    'A+E_HIGH': {
      title: 'The Pure Humanist Innovator',
      badge: 'Relational Care & Administrative Freedom',
      icon: 'sparkles',
      body: 'Zero interest in tech buzz: you simply want tools that cut out paperwork so staff can spend their days eye-to-eye with clients.',
    },
    'E+S_HIGH': {
      title: 'The Dialectical Inquirer',
      badge: 'High Appetite & High Scrutiny',
      icon: 'scale',
      body: 'You live in constructive tension: enthusiastic about what tools can do, yet sharply analytical about flaws and risks.',
    }
  };

  
  // --- Section: Shadow AI Quiz Interactive Engine (Job 3) ---
  function setupShadowAiQuiz() {
    const quizShell = document.getElementById("shadowAiQuiz");
    if (!quizShell) return;

    const quizQuestions = [
      {
        q: "1. What percentage of staff use Google AI search results in their daily work?",
        opts: ["~15% (Rare curiosity)", "~35% (Occasional glance)", "~65% (Majority of daily searches)", "~85%+ (Default daily habit)"]
      },
      {
        q: "2. What percentage of the apps and websites Waythrough staff use now include AI?",
        opts: ["Under 10%", "Around 25%", "Over 50%", "More than 70%"]
      },
      {
        q: "3. How many files does Waythrough produce each week that include AI generated content?",
        opts: ["Under 50 files", "200 - 500 files", "1,500 - 3,000 files", "5,000+ files"]
      },
      {
        q: "4. How many of those files were produced or edited using AI tools prohibited by policy?",
        opts: ["Zero (Strictly blocked)", "Less than 5%", "20% - 40%", "Over 50%"]
      },
      {
        q: "5. Which of the main AI models has the most detailed knowledge of Waythrough?",
        opts: ["OpenAI GPT-6", "Anthropic Claude Opus 5.5", "Google Gemini 4", "Meta Llama 4"]
      },
      {
        q: "6. How many times per day does AI access our website on behalf of someone seeking help?",
        opts: ["Less than 10 times", "50 - 200 times", "500 - 1,500 times", "Thousands of bot visits"]
      },
      {
        q: "7. What percentage of people accessing our services use AI for information and advice at least once per week?",
        opts: ["Around 5%", "Around 20%", "40% - 50%", "Over 60%"]
      },
      {
        q: "8. How many hours of time has AI saved our workforce this month?",
        opts: ["Under 50 hours", "200 - 500 hours", "1,000 - 2,500 hours", "5,000+ hours"]
      }
    ];

    let currentQIdx = 0;
    const userAnswers = [];

    const stepLabel = document.getElementById("quizStepLabel");
    const pips = Array.from(document.querySelectorAll(".quiz-step-pip"));
    const qTitle = document.getElementById("quizQuestionTitle");
    const qGrid = document.getElementById("quizOptionsGrid");
    const btnNext = document.getElementById("btnQuizNext");
    const questionBox = document.getElementById("quizQuestionBox");
    const resultsContainer = document.getElementById("quizResultsContainer");
    const resultsTableBody = document.getElementById("quizResultsTableBody");
    const btnQuizAdvance = document.getElementById("btnQuizAdvance");

    function renderQuestion(idx) {
      if (!quizQuestions[idx]) return;
      const data = quizQuestions[idx];

      if (resultsContainer && resultsContainer.classList.contains("active")) {
        resultsContainer.classList.remove("active");
        resultsContainer.style.display = "none";
        if (questionBox) questionBox.style.display = "block";
        const pWrap = quizShell.querySelector(".quiz-progress-bar-wrap");
        if (pWrap) pWrap.style.display = "flex";
      }
      updateHUD();

      if (stepLabel) stepLabel.textContent = "QUESTION " + (idx + 1) + " OF " + quizQuestions.length;
      if (qTitle) qTitle.textContent = data.q;

      pips.forEach((pip, pIdx) => {
        pip.classList.toggle("active", pIdx === idx);
        pip.classList.toggle("completed", pIdx < idx);
      });

      if (qGrid) {
        qGrid.innerHTML = "";
        const letters = ["A", "B", "C", "D"];
        data.opts.forEach((optText, optIdx) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "quiz-opt-btn";
          btn.innerHTML = "<span class=\"quiz-opt-letter\">" + letters[optIdx] + "</span><span>" + optText + "</span>";
          btn.addEventListener("click", () => {
            qGrid.querySelectorAll(".quiz-opt-btn").forEach(b => b.classList.remove("selected"));
            btn.classList.add("selected");
            userAnswers[idx] = optText;
            if (btnNext) {
              btnNext.removeAttribute("disabled");
              btnNext.classList.add("ready");
            }
          });
          qGrid.appendChild(btn);
        });
      }

      if (btnNext) {
        btnNext.setAttribute("disabled", "true");
        btnNext.classList.remove("ready");
        const nextSpan = btnNext.querySelector("span:first-child");
        if (nextSpan) {
          nextSpan.textContent = idx === quizQuestions.length - 1 ? "Reveal" : "Next Question";
        }
        if (idx === quizQuestions.length - 1) {
          btnNext.classList.add("is-reveal");
        } else {
          btnNext.classList.remove("is-reveal");
        }
      }
    }

    let priorityItems = [];

    function initPriorityItems() {
      if (priorityItems.length === 0) {
        let saved = null;
        try {
          const raw = localStorage.getItem("waythrough_priority_rankings");
          if (raw) saved = JSON.parse(raw);
        } catch (_) {}

        if (Array.isArray(saved) && saved.length === quizQuestions.length) {
          priorityItems = saved.map(s => {
            const originalQ = quizQuestions.find(q => q.q === s.question) || quizQuestions[s.id - 1] || quizQuestions[0];
            const originalIdx = quizQuestions.indexOf(originalQ);
            return {
              id: s.id,
              q: s.question,
              userGuess: (originalIdx !== -1 && userAnswers[originalIdx]) ? userAnswers[originalIdx] : (s.userGuess || "Not answered")
            };
          });
        } else {
          priorityItems = quizQuestions.map((item, i) => ({
            id: i + 1,
            q: item.q,
            userGuess: userAnswers[i] || "Not answered"
          }));
        }
      } else {
        priorityItems.forEach(item => {
          const originalIdx = quizQuestions.findIndex(q => q.q === item.q);
          if (originalIdx !== -1 && userAnswers[originalIdx]) {
            item.userGuess = userAnswers[originalIdx];
          }
        });
      }
    }

    function updatePriorityData() {
      const tiers = [
        { maxRank: 2, label: "Urgent" },
        { maxRank: 4, label: "Find out as soon as we can" },
        { maxRank: 5, label: "Look into over the next year" },
        { maxRank: 7, label: "Nice to know" },
        { maxRank: 8, label: "Don't care" }
      ];

      const priorityData = priorityItems.map((item, idx) => {
        const rank = idx + 1;
        const tierObj = tiers.find(t => rank <= t.maxRank) || tiers[tiers.length - 1];
        return {
          id: item.id,
          question: item.q,
          userGuess: item.userGuess,
          rank,
          priorityTier: tierObj.label
        };
      });

      state.userPriorityData = priorityData;
      try {
        localStorage.setItem("waythrough_priority_rankings", JSON.stringify(priorityData));
      } catch (_) {}
    }

    let draggedIndex = null;

    function attachCardDragListeners(card, index) {
      card.addEventListener("dragstart", (e) => {
        killPriorityDemo();
        hasInteractedWithPriority = true;
        draggedIndex = index;
        card.classList.add("is-dragging");
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", index.toString());
      });

      card.addEventListener("dragend", () => {
        card.classList.remove("is-dragging");
        document.querySelectorAll("#priorityCardsList .priority-card").forEach(c => {
          c.classList.remove("drag-over-top", "drag-over-bottom", "is-dragging");
        });
        draggedIndex = null;
      });

      card.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (draggedIndex === null || draggedIndex === index) return;
        const rect = card.getBoundingClientRect();
        const relY = e.clientY - rect.top;
        if (relY < rect.height / 2) {
          card.classList.add("drag-over-top");
          card.classList.remove("drag-over-bottom");
        } else {
          card.classList.add("drag-over-bottom");
          card.classList.remove("drag-over-top");
        }
      });

      card.addEventListener("dragleave", () => {
        card.classList.remove("drag-over-top", "drag-over-bottom");
      });

      card.addEventListener("drop", (e) => {
        e.preventDefault();
        card.classList.remove("drag-over-top", "drag-over-bottom");
        if (draggedIndex === null || draggedIndex === index) return;

        const rect = card.getBoundingClientRect();
        const relY = e.clientY - rect.top;
        let targetIndex = index;
        if (relY >= rect.height / 2 && draggedIndex < index) {
          targetIndex = index;
        } else if (relY < rect.height / 2 && draggedIndex > index) {
          targetIndex = index;
        }

        const [moved] = priorityItems.splice(draggedIndex, 1);
        priorityItems.splice(targetIndex, 0, moved);
        renderPriorityCards();
      });
    }

    function reorderPriorityItem(fromIdx, toIdx) {
      if (fromIdx < 0 || fromIdx >= priorityItems.length || toIdx < 0 || toIdx >= priorityItems.length) return;
      const [moved] = priorityItems.splice(fromIdx, 1);
      priorityItems.splice(toIdx, 0, moved);
      renderPriorityCards();
    }

    function renderPriorityCards() {
      const listEl = document.getElementById("priorityCardsList");
      if (!listEl) return;
      listEl.innerHTML = "";

      priorityItems.forEach((item, index) => {
        const rank = index + 1;
        const card = document.createElement("div");
        card.className = "priority-card";
        card.setAttribute("draggable", "true");
        card.setAttribute("data-id", item.id.toString());
        card.setAttribute("data-index", index.toString());
        card.setAttribute("role", "listitem");
        card.setAttribute("aria-label", `Rank ${rank}: ${item.q}`);

        let rankClass = "";
        if (rank <= 2) rankClass = "rank-urgent";
        else if (rank <= 4) rankClass = "rank-asap";

        card.innerHTML = `
          <span class="priority-drag-handle" title="Drag to reorder" aria-hidden="true">⠿</span>
          <span class="priority-rank-badge ${rankClass}">#${rank}</span>
          <span class="priority-card-title">${item.q}</span>
          <span class="priority-guess-chip">Guess: ${item.userGuess}</span>
        `;

        attachCardDragListeners(card, index);
        listEl.appendChild(card);
      });

      updatePriorityData();
    }

    function resetPriorityItems() {
      priorityItems = quizQuestions.map((item, i) => ({
        id: i + 1,
        q: item.q,
        userGuess: userAnswers[i] || "Not answered"
      }));
      renderPriorityCards();
    }

    function showResults() {
      killQuizDemo();
      if (questionBox) questionBox.style.display = "none";
      const pWrap = quizShell.querySelector(".quiz-progress-bar-wrap");
      if (pWrap) pWrap.style.display = "none";

      if (resultsContainer) {
        resultsContainer.style.display = "block";
        resultsContainer.classList.add("active");
      }
      updateHUD();

      initPriorityItems();
      renderPriorityCards();
      markDeckViewed(1);

      const btnConfirm = document.getElementById("btnConfirmPriorities");
      if (btnConfirm) {
        btnConfirm.onclick = () => {
          killPriorityDemo();
          updatePriorityData();
          markDeckViewed(1);
          goToHub();
        };
      }

      setTimeout(() => {
        demonstratePriorityRanking();
      }, 750);
    }

    function revealAnswers() {
      showResults();
    }

    function triggerShrugHorizontalWipe() {
      markDeckViewed(1);
      goToHub();
    }

    if (btnNext) {
      btnNext.addEventListener("click", () => {
        if (currentQIdx < quizQuestions.length - 1) {
          currentQIdx++;
          renderQuestion(currentQIdx);
        } else {
          showResults();
        }
      });
    }

    if (btnQuizAdvance) {
      btnQuizAdvance.addEventListener("click", () => {
        goToSlide(1);
      });
    }

    renderQuestion(0);
    window.__quizQuestions = quizQuestions;
    window.__quizRenderQuestion = renderQuestion;
    window.__quizShowResults = showResults;
    window.__quizRevealAnswers = revealAnswers;
    window.__reorderPriorityItem = reorderPriorityItem;
    window.__resetPriorityItems = resetPriorityItems;
    window.__getPriorityItems = () => priorityItems;
    window.__triggerShrugHorizontalWipe = triggerShrugHorizontalWipe;
    window.__triggerAutumnShrugTumble = triggerShrugHorizontalWipe;
  }

  // --- Section: Playground of Possibilities Engine (Job 5) ---
  function setupPlaygroundOfPossibilities() {
    const presetPills = Array.from(document.querySelectorAll("#pgGlobalPresetsPills .pg-preset-pill:not(.custom-indicator)"));
    const customPill = document.getElementById("pgPresetCustomPill");
    const roleInput = document.getElementById("pgRoleInput");
    const taskInput = document.getElementById("pgTaskInput");
    const formatInput = document.getElementById("pgFormatInput");
    const sourceCheckboxes = Array.from(document.querySelectorAll(".pg-source-chk"));

    const chatRoleName = document.getElementById("chatRoleName");
    const chatRoleAvatar = document.getElementById("chatRoleAvatar");
    const systemPromptSummary = document.getElementById("systemPromptSummary");
    const chatMessagesEl = document.getElementById("playgroundChatMessages");
    const chatTextInput = document.getElementById("chatTextInput");
    const btnChatSend = document.getElementById("btnChatSend");
    const btnResetChatSession = document.getElementById("btnResetChatSession");
    const btnPlaygroundAdvance = document.getElementById("btnPlaygroundAdvance");
    const playgroundSlidePanel = document.getElementById("playgroundSlidePanel");
    const playgroundCapOverlay = document.getElementById("playgroundCapOverlay");

    let embeddedApiKey = "";
    let embeddedModel = "google/gemini-2.5-flash-lite";
    const runtimeCfgEl = document.getElementById("wtEncryptedRuntimeConfig");
    if (runtimeCfgEl) {
      try {
        const parsedCfg = JSON.parse(runtimeCfgEl.textContent || "{}");
        if (parsedCfg.openRouterKey) embeddedApiKey = String(parsedCfg.openRouterKey).trim();
        if (parsedCfg.openRouterModel) embeddedModel = String(parsedCfg.openRouterModel).trim();
      } catch (e) {}
      runtimeCfgEl.remove();
    }

    const GLOBAL_PRESETS = {
      coach: {
        key: "coach",
        name: "Frontline Trauma-Informed Recovery Coach",
        avatar: "🌱",
        task: "Rewrite case notes for people accessing services into non-stigmatising, strengths-based recovery language",
        sources: ["waythrough_strategy", "care_act_2014", "nice_guidelines"],
        format: "Warm, empathetic frontline tone with strengths-based framing",
        greeting: "Hello. I am configured as your Frontline Trauma-Informed Coach. Grounded in Waythrough values, I am ready to help you reflect on interactions with people accessing services, de-escalate crisis notes, and sustain strengths-based hope. What scenario are we exploring today?"
      },
      researcher: {
        key: "researcher",
        name: "Social Care Policy & Governance Researcher",
        avatar: "📊",
        task: "Synthesise regulatory alignment between Care Act 2014 duties and CQC fundamental standards",
        sources: ["waythrough_strategy", "care_act_2014", "cqc_standards", "waythrough_services"],
        format: "Executive briefing format with statutory citations and evidence bullets",
        greeting: "Welcome. I am operating as your Social Policy & Governance Research Specialist. I can synthesise regulatory frameworks, examine the Care Act 2014, and analyse evidence-based service interventions. How can I support your enquiry?"
      },
      quizmaster: {
        key: "quizmaster",
        name: "Safeguarding Legislation & Compliance Quizmaster",
        avatar: "⚖️",
        task: "Test frontline judgements against adult safeguarding thresholds and Section 42 duties",
        sources: ["care_act_2014", "nice_guidelines", "cqc_standards"],
        format: "Interactive scenario-based question with multi-agency threshold rationale",
        greeting: "Ready when you are! I am your Safeguarding Compliance Quizmaster. I test practical scenario judgements against Section 42 Care Act duties, mental capacity thresholds, and information sharing rules. Ready for scenario one?"
      },
      assistant: {
        key: "assistant",
        name: "Frontline Case Worker Support Assistant",
        avatar: "📝",
        task: "Structure raw frontline bullet points into an objective, factual multi-agency incident log",
        sources: ["waythrough_strategy", "care_act_2014", "waythrough_services"],
        format: "Clear chronologically structured incident record with objective observations only",
        greeting: "Hi there! I am here to help take administrative friction off your plate. Paste rough frontline bullet points or scenario details, and I will structure them into non-stigmatising, objective case records."
      },
      yoda: {
        key: "yoda",
        name: "Master Yoda (Jedi Council Wisdom)",
        avatar: "🌌",
        task: "Cut through technological hype and remind the workforce of human empathy and patience",
        sources: ["jedi_code", "waythrough_strategy"],
        format: "Inverted Jedi syntax with ancient wisdom and mindful grounding",
        greeting: "Greetings, colleague of Waythrough. Patient, you must be. Clear your mind of fads. A guide through the technological Force, I am. Speak, what troubles your frontline soul?"
      },
      freestyle: {
        key: "freestyle",
        name: "",
        displayName: "Freestyle Chatbot",
        avatar: "✨",
        task: "",
        sources: [],
        format: "",
        greeting: "All configuration fields are blank. Fill in a role, task, sources, or format on the left—or start chatting right away to test your own chatbot from scratch."
      }
    };

    const KNOWLEDGE_SOURCES_REGISTRY = {
      waythrough_strategy: {
        name: "Waythrough 10-Year Strategy: 'The Way Ahead'",
        url: "https://www.waythrough.org.uk/who-we-are/our-strategy/",
        tag: "Strategic Vision",
        summary: "Waythrough (formed by the merger of Humankind and Richmond Fellowship in October 2024) committed to a 10-year strategy: 'The Way Ahead'. Core mission: 'Save a million lives, and enhance a million more' by tackling service fragmentation across health, housing, and social services. Three core values: Kindness, Courage, and Respect. Multi-million pound investment in integrated community recovery, lived-experience recovery organisations (LEROs), and removing administrative burdens from staff."
      },
      care_act_2014: {
        name: "UK Care Act 2014 & Safeguarding Thresholds",
        url: "https://www.legislation.gov.uk/ukpga/2014/23/section/42",
        tag: "Statutory Law",
        summary: "Section 42 of the Care Act 2014 establishes the statutory framework for adult safeguarding: local authorities and commissioned providers must make enquiries when an adult has care and support needs, is experiencing or at risk of abuse/neglect, and cannot protect themselves. Mandates Making Safeguarding Personal (MSP), proportional responses, presumption of mental capacity under MCA 2005, and lawful information sharing."
      },
      nice_guidelines: {
        name: "NICE NG58: Co-occurring Severe Mental Illness & Substance Misuse",
        url: "https://www.nice.org.uk/guidance/ng58",
        tag: "Clinical Standards",
        summary: "NICE NG58 guidelines mandate a strict 'no wrong door' policy: services must not exclude individuals with severe mental illness from substance use treatment, or vice versa. Requires collaborative care planning, dedicated keyworking, trauma-informed clinical engagement, and harm reduction."
      },
      waythrough_services: {
        name: "Waythrough Support Services Directory",
        url: "https://www.waythrough.org.uk/find-support-near-me/",
        tag: "Operational Services",
        summary: "Waythrough operates 260+ services supporting 130,000+ people accessing services across England in drug and alcohol recovery, mental health crisis havens, supported housing, domestic abuse support, and IPS employment."
      },
      cqc_standards: {
        name: "CQC Fundamental Standards (Regulated Activities Regulations 2014, Part 3)",
        url: "https://www.legislation.gov.uk/uksi/2014/2936/part/3",
        tag: "Regulatory Standards",
        summary: "Part 3 (Regulations 8–20A) of the Health and Social Care Act 2008 (Regulated Activities) Regulations 2014 sets the statutory CQC Fundamental Standards below which care must never fall: person-centred care (Reg 9), dignity and respect (Reg 10), need for consent (Reg 11), safe care and treatment (Reg 12), safeguarding from abuse (Reg 13), good governance and auditability (Reg 17), and duty of candour (Reg 20), underpinning CQC's Safe, Effective, Caring, Responsive, and Well-led framework."
      },
      jedi_code: {
        name: "Wildcard: Jedi Archives & The Jedi Code",
        url: "https://en.wikipedia.org/wiki/Jedi#The_Jedi_Code",
        tag: "Wildcard Philosophy",
        summary: "The Jedi Code: 'There is no emotion, there is peace. There is no ignorance, there is knowledge. There is no passion, there is serenity. There is no chaos, there is harmony. There is no death, there is the Force.' Focuses on emotional balance, mindfulness, and selfless service."
      }
    };

    let activePresetKey = "coach";

    function getActiveRole() {
      const val = roleInput ? roleInput.value.trim() : "";
      if (!val) {
        return {
          name: "Freestyle Chatbot",
          promptRole: "Helpful AI Assistant (no specific role configured)",
          avatar: "✨",
          greeting: GLOBAL_PRESETS.freestyle.greeting
        };
      }
      for (const k in GLOBAL_PRESETS) {
        if (GLOBAL_PRESETS[k].name && GLOBAL_PRESETS[k].name === val) {
          return { name: val, promptRole: val, avatar: GLOBAL_PRESETS[k].avatar, greeting: GLOBAL_PRESETS[k].greeting };
        }
      }
      return { name: val, promptRole: val, avatar: "🤖", greeting: `Hello! I am configured as ${val}. How can I help you today?` };
    }

    function getActiveTask() {
      return taskInput ? taskInput.value.trim() : "";
    }

    function getActiveSources() {
      return sourceCheckboxes.filter(c => c.checked).map(c => c.value);
    }

    function getActiveFormat() {
      return formatInput ? formatInput.value.trim() : "";
    }

    function buildSystemPrompt() {
      const roleVal = roleInput ? roleInput.value.trim() : "";
      const role = getActiveRole();
      const task = getActiveTask();
      const sources = getActiveSources();
      const format = getActiveFormat();

      if (!roleVal && !task && sources.length === 0 && !format) {
        return "You are a helpful AI assistant in the Waythrough AI Workshop chatbot playground. No specific role, task, grounding sources, or output format have been configured yet—respond helpfully, concisely (around 100–160 words unless asked for detail), and in UK English to the user's message.";
      }

      let sourcesText = "No specific external grounding selected.";
      if (sources.length > 0) {
        sourcesText = sources.map(sKey => {
          const item = KNOWLEDGE_SOURCES_REGISTRY[sKey];
          if (!item) return "• Source: " + sKey;
          return "• [" + item.name + "] (" + item.url + ")\n  Key Principles: " + item.summary;
        }).join("\n\n");
      }

      const taskLine = task || "Respond helpfully to the user's request in character";
      const formatLine = format || "Clear, well-structured response";
      const citationGuidance = sources.length > 0
        ? "1. Ground your advice directly in the principles, legislation, and strategy cited above.\n2. Explicitly cite your selected grounding sources where relevant (e.g. \"Under Section 42 of the Care Act 2014...\", \"In line with Waythrough's 'The Way Ahead' strategy...\", \"Under CQC Fundamental Standards (Reg 12/17)...\", \"Per NICE NG58 guidance...\").\n3. Use UK English spelling and keep responses concise and well-structured (roughly 100–160 words unless asked for detail) so colleagues can read and compare prompts easily."
        : "1. Follow the configured role, task, and output format closely.\n2. Use UK English spelling and keep responses concise and well-structured (roughly 100–160 words unless asked for detail) so colleagues can read and compare prompts easily.";

      return "You are an AI chatbot configured in the Waythrough AI Workshop playground.\nROLE: " + role.promptRole + "\nTASK: " + taskLine + "\nOUTPUT FORMAT: " + formatLine + "\n\nGROUNDING SOURCES & EVIDENCE BASE:\n" + sourcesText + "\n\nINSTRUCTIONS:\n" + citationGuidance;
    }

    let chatHistory = [];
    let isAwaitingResponse = false;
    const MAX_LLM_RESPONSES = 100;

    function getLlmResponseCount() {
      const val = parseInt(localStorage.getItem("waythrough_llm_response_count") || "0", 10);
      return isNaN(val) ? 0 : val;
    }

    function syncResponseCapState() {
      const capped = getLlmResponseCount() >= MAX_LLM_RESPONSES;
      if (playgroundSlidePanel) {
        playgroundSlidePanel.classList.toggle("is-cap-reached", capped);
      }
      if (playgroundCapOverlay) {
        playgroundCapOverlay.setAttribute("aria-hidden", capped ? "false" : "true");
      }
      if (chatTextInput) chatTextInput.disabled = capped;
      if (btnChatSend) btnChatSend.disabled = capped || isAwaitingResponse;
      if (capped) {
        killPlaygroundDemo(false);
      }
    }

    function incrementLlmResponseCount() {
      const count = getLlmResponseCount() + 1;
      localStorage.setItem("waythrough_llm_response_count", count.toString());
      syncResponseCapState();
      return count;
    }

    function resetLlmResponseCount() {
      localStorage.setItem("waythrough_llm_response_count", "0");
      syncResponseCapState();
    }

    function applyPreset(presetKey) {
      const p = GLOBAL_PRESETS[presetKey];
      if (!p) return;
      activePresetKey = presetKey;

      presetPills.forEach(pill => {
        if (pill.getAttribute("data-preset") === presetKey) pill.classList.add("active");
        else pill.classList.remove("active");
      });
      if (customPill) customPill.style.display = "none";

      if (roleInput) roleInput.value = p.name;
      if (taskInput) taskInput.value = p.task;
      if (formatInput) formatInput.value = p.format;

      sourceCheckboxes.forEach(chk => {
        chk.checked = p.sources.includes(chk.value);
      });

      resetSession();
    }

    function markCustomized() {
      if (activePresetKey !== "freestyle") {
        activePresetKey = null;
        presetPills.forEach(pill => pill.classList.remove("active"));
        if (customPill) customPill.style.display = "inline-flex";
      }
      resetSession();
    }

    function resetSession() {
      const role = getActiveRole();
      const task = getActiveTask();
      if (chatRoleName) chatRoleName.textContent = role.name;
      if (chatRoleAvatar) chatRoleAvatar.textContent = role.avatar;
      const prompt = buildSystemPrompt();
      if (systemPromptSummary) {
        if (role.name === "Freestyle Chatbot" && !task) {
          systemPromptSummary.textContent = "Prompt: Freestyle (blank canvas — configure on the left or chat freely)";
        } else {
          const taskPreview = task ? task.slice(0, 32) + "..." : "Open conversation";
          systemPromptSummary.textContent = "Prompt: " + role.name.split(" ")[0] + " | " + taskPreview;
        }
      }

      chatHistory = [
        { role: "system", content: prompt },
        { role: "assistant", content: role.greeting, uiOnly: true }
      ];

      renderMessages();
    }

    function formatInlineMd(escapedLine) {
      return escapedLine
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/(^|[^*])\*([^*]+?)\*(?!\*)/g, "$1<em>$2</em>");
    }

    function formatAssistantMarkdown(rawText) {
      const escaped = String(rawText || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
      const lines = escaped.split(/\r?\n/);
      const htmlParts = [];
      let listType = null;

      const closeList = () => {
        if (listType) {
          htmlParts.push(`</${listType}>`);
          listType = null;
        }
      };

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) {
          closeList();
          continue;
        }
        const ulMatch = line.match(/^(?:[*•-])\s+(.+)$/);
        if (ulMatch) {
          if (listType !== "ul") {
            closeList();
            htmlParts.push("<ul>");
            listType = "ul";
          }
          htmlParts.push(`<li>${formatInlineMd(ulMatch[1])}</li>`);
          continue;
        }
        const olMatch = line.match(/^\d+\.\s+(.+)$/);
        if (olMatch) {
          if (listType !== "ol") {
            closeList();
            htmlParts.push("<ol>");
            listType = "ol";
          }
          htmlParts.push(`<li>${formatInlineMd(olMatch[1])}</li>`);
          continue;
        }
        closeList();
        const headingMatch = line.match(/^#{1,4}\s+(.+)$/);
        if (headingMatch) {
          htmlParts.push(`<p><strong>${formatInlineMd(headingMatch[1])}</strong></p>`);
        } else {
          htmlParts.push(`<p>${formatInlineMd(line)}</p>`);
        }
      }
      closeList();
      return htmlParts.join("") || `<p>${escaped}</p>`;
    }

    function renderMessages() {
      if (!chatMessagesEl) return;
      chatMessagesEl.innerHTML = "";
      let lastBubble = null;
      let lastRole = null;
      chatHistory.forEach(msg => {
        if (msg.role === "system") return;
        const div = document.createElement("div");
        div.className = "chat-msg " + msg.role;
        if (msg.role === "assistant") {
          div.innerHTML = formatAssistantMarkdown(msg.content);
        } else {
          div.textContent = msg.content;
        }
        chatMessagesEl.appendChild(div);
        lastBubble = div;
        lastRole = msg.role;
      });
      if (lastBubble && lastRole === "assistant" && lastBubble.offsetHeight > chatMessagesEl.clientHeight - 28) {
        chatMessagesEl.scrollTop = Math.max(0, lastBubble.offsetTop - 10);
      } else {
        chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
      }
    }

    function appendMessage(role, text) {
      chatHistory.push({ role, content: text });
      renderMessages();
    }

    async function handleUserSend() {
      if (isAwaitingResponse) return;
      if (getLlmResponseCount() >= MAX_LLM_RESPONSES) {
        syncResponseCapState();
        return;
      }
      if (!chatTextInput) return;
      const text = chatTextInput.value.trim();
      if (!text) return;
      chatTextInput.value = "";
      appendMessage("user", text);

      if (embeddedApiKey) {
        isAwaitingResponse = true;
        if (btnChatSend) btnChatSend.disabled = true;

        const loadingDiv = document.createElement("div");
        loadingDiv.className = "chat-msg assistant";
        loadingDiv.textContent = "Thinking...";
        chatMessagesEl.appendChild(loadingDiv);
        chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;

        try {
          const outboundMessages = chatHistory
            .filter(m => !m.uiOnly)
            .map(m => ({ role: m.role, content: m.content }));
          const candidateModels = Array.from(new Set([
            embeddedModel,
            "google/gemini-3.1-flash-lite",
            "google/gemini-2.5-flash"
          ]));

          const callOpenRouter = async () => {
            const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + embeddedApiKey,
                "HTTP-Referer": window.location.href,
                "X-Title": "Waythrough AI Governance Playground"
              },
              body: JSON.stringify({
                models: candidateModels,
                provider: { allow_fallbacks: true },
                messages: outboundMessages
              })
            });
            const data = await res.json();
            if (!res.ok || data.error) {
              const err = new Error(data.error?.message || `HTTP ${res.status}`);
              err.status = res.status || data.error?.code;
              throw err;
            }
            return data;
          };

          let data;
          try {
            data = await callOpenRouter();
          } catch (firstErr) {
            if (firstErr.status === 429 || (firstErr.status >= 500 && firstErr.status < 600)) {
              await new Promise(r => setTimeout(r, 750));
              data = await callOpenRouter();
            } else {
              throw firstErr;
            }
          }

          if (data.choices && data.choices[0] && data.choices[0].message) {
            if (loadingDiv.parentNode) chatMessagesEl.removeChild(loadingDiv);
            appendMessage("assistant", data.choices[0].message.content);
            incrementLlmResponseCount();
          } else {
            throw new Error("Unexpected response format");
          }
        } catch (err) {
          if (loadingDiv.parentNode) chatMessagesEl.removeChild(loadingDiv);
          appendMessage("assistant", "[Live API Notice]: " + err.message + ". Falling back to sandbox response.");
          respondWithSimulation(text);
        } finally {
          isAwaitingResponse = false;
          syncResponseCapState();
        }
      } else {
        respondWithSimulation(text);
      }
    }

    function respondWithSimulation(userInput) {
      const role = getActiveRole();
      let reply = "";

      if (role.name.includes("Yoda")) {
        reply = "Pondered your words, I have. \"" + userInput + "\" ... In the Jedi Archives it is written: 'There is no ignorance, there is knowledge.' Quick to entice, the corporate hype is. But mindful of Waythrough's sacred frontline mission, you must remain. True compassion, from the human heart it flows, hmmm!";
      } else if (role.name.includes("Quizmaster")) {
        reply = "Safeguarding Assessment Scenario:\nUnder Section 42 of the Care Act 2014, your prompt involves balancing consent against statutory adult protection thresholds. In accordance with Waythrough safeguarding standards and NICE NG58 ('No Wrong Door'), how would you proceed if a service user experiencing severe substance distress refuses an external multi-agency referral?";
      } else if (role.name.includes("Researcher")) {
        reply = "Policy Analysis & Grounding Summary:\n• Strategic Alignment: Reflects Waythrough's 10-year strategy 'The Way Ahead' to eliminate service fragmentation across 260+ national services.\n• Statutory Grounding: Aligns with Care Act 2014 Section 42 safeguarding duties and CQC fundamental standards.\n• Evidence Base: Recent sector evaluations demonstrate that assistive drafting reduces frontline administrative time by 28%, provided human clinical oversight remains mandatory.";
      } else {
        reply = "Here is a structured, trauma-informed response grounded in Waythrough practice:\n\n• Strengths-Based Framing: Re-centred client agency, validating their resilience in line with Waythrough values (Kindness, Courage, Respect).\n• Statutory Context: Checked against Care Act 2014 Section 42 thresholds with zero unmonitored data exposure.\n• Operational Step: Scheduled weekly check-in with named keyworker to preserve therapeutic continuity.";
      }

      setTimeout(() => {
        appendMessage("assistant", reply);
      }, 350);
    }

    // Attach Preset Pill Listeners
    presetPills.forEach(pill => {
      pill.addEventListener("click", () => {
        const pk = pill.getAttribute("data-preset");
        if (pk) applyPreset(pk);
      });
    });

    // Attach Overwriteable Fields Listeners (updates prompt & resets session on any change)
    if (roleInput) {
      roleInput.addEventListener("input", markCustomized);
    }
    if (taskInput) {
      taskInput.addEventListener("input", markCustomized);
    }
    if (formatInput) {
      formatInput.addEventListener("input", markCustomized);
    }
    sourceCheckboxes.forEach(chk => {
      chk.addEventListener("change", markCustomized);
    });

    if (btnChatSend) btnChatSend.addEventListener("click", handleUserSend);
    if (chatTextInput) {
      chatTextInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") handleUserSend();
      });
    }
    if (btnResetChatSession) {
      btnResetChatSession.addEventListener("click", () => {
        resetSession();
      });
    }

    if (btnPlaygroundAdvance) {
      btnPlaygroundAdvance.addEventListener("click", () => {
        goToSlide(2);
      });
    }

    // Expose helpers for testing
    window.__playgroundApplyPreset = applyPreset;
    window.__playgroundGetPrompt = buildSystemPrompt;
    window.__getEmbeddedModel = () => embeddedModel;
    window.__hasEmbeddedApiKey = () => Boolean(embeddedApiKey);
    window.__getLlmResponseCount = getLlmResponseCount;
    window.__setLlmResponseCount = (n) => {
      localStorage.setItem("waythrough_llm_response_count", n.toString());
      syncResponseCapState();
    };
    window.__incrementLlmResponseCount = incrementLlmResponseCount;
    window.__resetLlmResponseCount = resetLlmResponseCount;

    syncResponseCapState();
    resetSession();
  }

  // --- Section: Kinetic Typography Transition (Removed per user request) ---
  function playShouldKineticTransition() {
    const overlay = document.getElementById("kineticTypographyOverlay");
    if (overlay) {
      overlay.style.display = "none";
      overlay.classList.remove("active");
    }
  }

  // --- Unhurried Onboarding Demo Animations Across All Chapters ---
  function getDemoRelativePoint(container, targetEl, offsetX = 0, offsetY = 0) {
    if (!container || !targetEl) return { x: 180, y: 120 };
    const cRect = container.getBoundingClientRect();
    const tRect = targetEl.getBoundingClientRect();
    const cW = cRect.width || container.clientWidth || 900;
    const cH = cRect.height || container.clientHeight || 460;
    const rawX = (tRect.left - cRect.left) + (tRect.width / 2) + offsetX;
    const rawY = (tRect.top - cRect.top) + (tRect.height / 2) + offsetY;
    return {
      x: Math.max(118, Math.min(cW - 118, rawX)),
      y: Math.max(24, Math.min(cH - 24, rawY))
    };
  }

  function mountDemoCursor(container, cursorId, textId, initialText) {
    let cursor = document.getElementById(cursorId);
    if (!cursor) {
      cursor = document.createElement("div");
      cursor.id = cursorId;
      cursor.className = "spectrum-demo-cursor";
      cursor.innerHTML = `<span class="demo-cursor-hand">👆</span><span class="demo-cursor-text" id="${textId}">${initialText}</span>`;
      container.appendChild(cursor);
    }
    return { cursor, cursorText: document.getElementById(textId) };
  }

  // 1. Stone 2 ("Where are we now?" — Shadow AI Quiz) Demo
  let quizDemoTl = null;
  let hasInteractedWithQuiz = false;
  let quizDemoCleanupListeners = null;

  function killQuizDemo() {
    if (quizDemoTl) {
      quizDemoTl.kill();
      quizDemoTl = null;
    }
    if (quizDemoCleanupListeners) {
      quizDemoCleanupListeners();
      quizDemoCleanupListeners = null;
    }
    document.querySelectorAll("#shadowAiQuiz .quiz-opt-btn.demo-highlight").forEach(b => b.classList.remove("demo-highlight"));
    const cursor = document.getElementById("quizDemoCursor");
    if (cursor) cursor.remove();
  }

  function demonstrateQuizWidget() {
    killQuizDemo();
    if (hasInteractedWithQuiz) return;
    if (typeof gsap === "undefined") return;

    const quizShell = document.getElementById("shadowAiQuiz");
    const resultsContainer = document.getElementById("quizResultsContainer");
    if (!quizShell || (resultsContainer && resultsContainer.classList.contains("active"))) return;

    const optBtns = Array.from(quizShell.querySelectorAll(".quiz-opt-btn"));
    const btnNext = document.getElementById("btnQuizNext");
    if (optBtns.length < 3 || !btnNext) return;

    const onUserInteraction = () => {
      hasInteractedWithQuiz = true;
      killQuizDemo();
    };
    quizShell.addEventListener("pointerdown", onUserInteraction, { capture: true });
    quizShell.addEventListener("click", onUserInteraction, { capture: true });
    quizShell.addEventListener("keydown", onUserInteraction, { capture: true });
    quizDemoCleanupListeners = () => {
      quizShell.removeEventListener("pointerdown", onUserInteraction, { capture: true });
      quizShell.removeEventListener("click", onUserInteraction, { capture: true });
      quizShell.removeEventListener("keydown", onUserInteraction, { capture: true });
    };

    const { cursor, cursorText } = mountDemoCursor(quizShell, "quizDemoCursor", "quizDemoCursorText", "Pick your best guess");
    const pOptB = getDemoRelativePoint(quizShell, optBtns[1], 56, 22);
    gsap.set(cursor, { x: pOptB.x, y: pOptB.y, opacity: 0 });

    const setHighlight = (targetBtn) => {
      quizShell.querySelectorAll(".quiz-opt-btn").forEach(b => b.classList.toggle("demo-highlight", b === targetBtn));
    };

    quizDemoTl = gsap.timeline({
      delay: 0.75,
      onComplete: () => killQuizDemo()
    });

    quizDemoTl.to(cursor, {
      opacity: 1,
      duration: 0.55,
      ease: "sine.out",
      onStart: () => setHighlight(optBtns[1])
    });
    quizDemoTl.to({}, { duration: 1.7 });

    quizDemoTl.to(cursor, {
      x: () => getDemoRelativePoint(quizShell, optBtns[2], 56, 22).x,
      y: () => getDemoRelativePoint(quizShell, optBtns[2], 56, 22).y,
      duration: 1.35,
      ease: "sine.inOut",
      onStart: () => {
        if (cursorText) cursorText.textContent = "8 quick questions";
      },
      onComplete: () => setHighlight(optBtns[2])
    });
    quizDemoTl.to({}, { duration: 1.7 });

    quizDemoTl.to(cursor, {
      x: () => getDemoRelativePoint(quizShell, btnNext, -20, -28).x,
      y: () => getDemoRelativePoint(quizShell, btnNext, -20, -28).y,
      duration: 1.35,
      ease: "sine.inOut",
      onStart: () => {
        setHighlight(null);
        if (cursorText) cursorText.textContent = "Step through to reveal answers";
      }
    });
    quizDemoTl.to({}, { duration: 1.65 });

    quizDemoTl.to(cursor, {
      opacity: 0,
      duration: 0.55,
      ease: "sine.in"
    });
  }

  // 1B. Stone 2 ("Where are we now?" — Priority Ranking) Demo
  let priorityDemoTl = null;
  let hasInteractedWithPriority = false;
  let priorityDemoCleanupListeners = null;

  function killPriorityDemo() {
    if (priorityDemoTl) {
      priorityDemoTl.kill();
      priorityDemoTl = null;
    }
    if (priorityDemoCleanupListeners) {
      priorityDemoCleanupListeners();
      priorityDemoCleanupListeners = null;
    }
    document.querySelectorAll('#priorityCardsList .priority-card').forEach(b => {
      b.classList.remove('demo-highlight', 'is-dragging');
      if (typeof gsap !== 'undefined') gsap.set(b, { y: 0, scale: 1 });
    });
    const cursor = document.getElementById('priorityDemoCursor');
    if (cursor) cursor.remove();
  }

  function demonstratePriorityRanking() {
    killPriorityDemo();
    if (hasInteractedWithPriority) return;
    if (typeof gsap === 'undefined') return;

    const stage = document.getElementById('priorityRankingStage');
    const cards = Array.from(document.querySelectorAll('#priorityCardsList .priority-card'));
    if (!stage || cards.length < 4) return;

    const onUserInteraction = () => {
      hasInteractedWithPriority = true;
      killPriorityDemo();
    };
    const evts = ['pointerdown', 'click', 'keydown', 'dragstart'];
    evts.forEach(ev => stage.addEventListener(ev, onUserInteraction, { capture: true }));
    priorityDemoCleanupListeners = () => {
      evts.forEach(ev => stage.removeEventListener(ev, onUserInteraction, { capture: true }));
    };

    const { cursor, cursorText } = mountDemoCursor(stage, 'priorityDemoCursor', 'priorityDemoCursorText', 'Drag to rank priority, top to bottom');
    const targetCard = cards[3]; // Card 4 ("prohibited by policy")
    const pStart = getDemoRelativePoint(stage, targetCard, 20, 10);
    gsap.set(cursor, { x: pStart.x, y: pStart.y, opacity: 0 });

    priorityDemoTl = gsap.timeline({
      delay: 0.75,
      onComplete: () => killPriorityDemo()
    });

    priorityDemoTl.to(cursor, {
      opacity: 1,
      duration: 0.55,
      ease: 'sine.out',
      onStart: () => targetCard.classList.add('demo-highlight')
    });
    priorityDemoTl.to({}, { duration: 1.2 });

    const topCard = cards[0];
    priorityDemoTl.to(cursor, {
      x: () => getDemoRelativePoint(stage, topCard, 20, -10).x,
      y: () => getDemoRelativePoint(stage, topCard, 20, -10).y,
      duration: 1.35,
      ease: 'power2.inOut',
      onStart: () => {
        if (cursorText) cursorText.textContent = 'Drag critical questions to Urgent';
        targetCard.classList.add('is-dragging');
        gsap.to(targetCard, { y: -80, scale: 1.02, duration: 1.35, ease: 'power2.inOut' });
      },
      onComplete: () => {
        gsap.to(targetCard, {
          y: 0,
          scale: 1,
          duration: 0.35,
          ease: 'sine.out',
          onComplete: () => {
            targetCard.classList.remove('is-dragging', 'demo-highlight');
          }
        });
      }
    });
    priorityDemoTl.to({}, { duration: 1.7 });

    priorityDemoTl.to(cursor, {
      opacity: 0,
      duration: 0.5,
      ease: 'sine.in'
    });
  }

  // 2. Stone 3 ("What could we do?" — Chatbot Playground) Thorough Two-Stage Tutorial Demo
  let playgroundDemoTl = null;
  let hasInteractedWithPlayground = false;
  let isDemoUpdatingPlayground = false;
  let playgroundDemoChangedPreset = false;
  let playgroundDemoCleanupListeners = null;

  let isPlaygroundIntroActive = false;
  let playgroundIntroCleanupListener = null;

  function killPlaygroundDemo(restoreIfPreview = true, preserveInteractBlur = false) {
    if (playgroundDemoTl) {
      playgroundDemoTl.kill();
      playgroundDemoTl = null;
    }
    if (playgroundDemoCleanupListeners) {
      playgroundDemoCleanupListeners();
      playgroundDemoCleanupListeners = null;
    }
    const slideInner = document.getElementById("playgroundSlideInner");
    if (slideInner) slideInner.classList.remove("is-tutorial-blurred");
    const introTooltip = document.getElementById("playgroundIntroTooltip");
    if (introTooltip) introTooltip.remove();

    const configurePanel = document.getElementById("playgroundConfigurePanel");
    const interactPanel = document.getElementById("playgroundInteractPanel");
    const overlayConfigure = document.getElementById("pgIntroOverlayConfigure");
    const overlayInteract = document.getElementById("pgIntroOverlayInteract");

    if (configurePanel) configurePanel.classList.remove("is-intro-blurred");
    if (overlayConfigure) overlayConfigure.classList.add("is-hidden");

    if (!preserveInteractBlur) {
      if (interactPanel) interactPanel.classList.remove("is-intro-blurred");
      if (overlayInteract) overlayInteract.classList.add("is-hidden");
    }

    const layout = document.getElementById("playgroundLayout") || document.querySelector(".playground-layout");
    if (layout) {
      layout.querySelectorAll(".demo-spotlight-blur").forEach(el => el.classList.remove("demo-spotlight-blur"));
      layout.querySelectorAll(".demo-spotlight-focus").forEach(el => el.classList.remove("demo-spotlight-focus"));
      layout.querySelectorAll(".demo-field-focus").forEach(el => el.classList.remove("demo-field-focus"));
    }

    if (restoreIfPreview && playgroundDemoChangedPreset && typeof window.__playgroundApplyPreset === "function") {
      isDemoUpdatingPlayground = true;
      window.__playgroundApplyPreset("coach");
      isDemoUpdatingPlayground = false;
    }
    playgroundDemoChangedPreset = false;
    const cursor = document.getElementById("playgroundDemoCursor");
    if (cursor) cursor.remove();
  }

  function setupPlaygroundIntro(force = false) {
    if (hasInteractedWithPlayground && !force) return;

    killPlaygroundDemo(true, false);

    const configurePanel = document.getElementById("playgroundConfigurePanel");
    const interactPanel = document.getElementById("playgroundInteractPanel");
    const overlayConfigure = document.getElementById("pgIntroOverlayConfigure");
    const overlayInteract = document.getElementById("pgIntroOverlayInteract");
    const slidePanel = document.getElementById("playgroundSlidePanel");

    if (!configurePanel || !interactPanel || !overlayConfigure || !overlayInteract || !slidePanel) return;

    // 1. On page load, blur out the two 'step 1' and step 2 containers
    configurePanel.classList.add("is-intro-blurred");
    interactPanel.classList.add("is-intro-blurred");

    // 2. Over step 1 have 'Build a chatbot', over step 2 have 'Chat with it'
    overlayConfigure.classList.remove("is-hidden");
    overlayInteract.classList.remove("is-hidden");

    isPlaygroundIntroActive = true;

    if (playgroundIntroCleanupListener) {
      playgroundIntroCleanupListener();
      playgroundIntroCleanupListener = null;
    }

    const onIntroAnyClick = (e) => {
      if (!isPlaygroundIntroActive) return;
      isPlaygroundIntroActive = false;

      if (playgroundIntroCleanupListener) {
        playgroundIntroCleanupListener();
        playgroundIntroCleanupListener = null;
      }

      if (e && typeof e.stopPropagation === "function") {
        e.stopPropagation();
      }

      // 3. Unblur step 1 (left side) and fade out left overlay
      configurePanel.classList.remove("is-intro-blurred");
      overlayConfigure.classList.add("is-hidden");

      // 4. KEEP RIGHT SIDE BLURRED!
      interactPanel.classList.add("is-intro-blurred");
      overlayInteract.classList.remove("is-hidden");

      // 5. Trigger demo animation where it reveals as it goes
      setTimeout(() => {
        demonstratePlaygroundWidget(true);
      }, 50);
    };

    slidePanel.addEventListener("click", onIntroAnyClick, { capture: true, once: true });
    const onKeydown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        onIntroAnyClick(e);
      }
    };
    slidePanel.addEventListener("keydown", onKeydown, { capture: true, once: true });

    playgroundIntroCleanupListener = () => {
      slidePanel.removeEventListener("click", onIntroAnyClick, { capture: true });
      slidePanel.removeEventListener("keydown", onKeydown, { capture: true });
    };
  }

  function demonstratePlaygroundWidget(keepInteractBlurred = false) {
    killPlaygroundDemo(true, keepInteractBlurred);
    if (hasInteractedWithPlayground) return;
    if (typeof gsap === "undefined") return;
    const slidePanel = document.getElementById("playgroundSlidePanel");
    const slideInner = document.getElementById("playgroundSlideInner");
    if (!slidePanel || !slideInner || slidePanel.classList.contains("is-cap-reached")) return;

    const layout = document.getElementById("playgroundLayout") || document.querySelector(".playground-layout");
    if (!layout) return;

    const configurePanel = document.getElementById("playgroundConfigurePanel");
    const interactPanel = document.getElementById("playgroundInteractPanel");
    const overlayConfigure = document.getElementById("pgIntroOverlayConfigure");
    const overlayInteract = document.getElementById("pgIntroOverlayInteract");

    // Ensure left side is unblurred and left overlay hidden
    if (configurePanel) configurePanel.classList.remove("is-intro-blurred");
    if (overlayConfigure) overlayConfigure.classList.add("is-hidden");

    if (keepInteractBlurred) {
      if (interactPanel) interactPanel.classList.add("is-intro-blurred");
      if (overlayInteract) overlayInteract.classList.remove("is-hidden");
    } else {
      if (interactPanel) interactPanel.classList.remove("is-intro-blurred");
      if (overlayInteract) overlayInteract.classList.add("is-hidden");
    }

    const quizmasterPill = layout.querySelector('.pg-preset-pill[data-preset="quizmaster"]');
    const freestylePill = layout.querySelector('.pg-preset-pill[data-preset="freestyle"]');
    const coachPill = layout.querySelector('.pg-preset-pill[data-preset="coach"]');
    const roleGroup = document.getElementById("pgRoleGroup") || document.getElementById("pgRoleInput");
    const taskGroup = document.getElementById("pgTaskGroup") || document.getElementById("pgTaskInput");
    const sourcesGroup = document.getElementById("pgSourcesGroup");
    const formatGroup = document.getElementById("pgFormatGroup") || document.getElementById("pgFormatInput");
    const chatInput = document.getElementById("chatTextInput");
    const presetBar = layout.querySelector('.playground-preset-bar');
    const chatCol = layout.querySelector('.playground-chat-col');

    if (!quizmasterPill || !coachPill || !roleGroup || !taskGroup || !sourcesGroup || !formatGroup || !chatInput) return;

    const onUserInteraction = () => {
      if (isDemoUpdatingPlayground) return;
      hasInteractedWithPlayground = true;
      killPlaygroundDemo(false, false);
    };
    const evts = ["pointerdown", "click", "input", "change", "keydown"];
    evts.forEach(ev => slidePanel.addEventListener(ev, onUserInteraction, { capture: true }));
    playgroundDemoCleanupListeners = () => {
      evts.forEach(ev => slidePanel.removeEventListener(ev, onUserInteraction, { capture: true }));
    };

    const spotlightSections = [
      presetBar,
      roleGroup,
      taskGroup,
      sourcesGroup,
      formatGroup,
      chatCol
    ].filter(Boolean);

    const setPlaygroundSpotlight = (targetEl) => {
      if (!targetEl) {
        spotlightSections.forEach(sec => {
          sec.classList.remove('demo-spotlight-blur', 'demo-spotlight-focus');
          sec.querySelectorAll('.demo-field-focus').forEach(el => el.classList.remove('demo-field-focus'));
        });
        return;
      }
      spotlightSections.forEach(sec => {
        const isTarget = (sec === targetEl) || sec.contains(targetEl);
        sec.classList.toggle('demo-spotlight-blur', !isTarget);
        sec.classList.toggle('demo-spotlight-focus', isTarget);
      });
    };

    // Mount pointer cursor immediately (splash pop-up removed)
    const { cursor, cursorText } = mountDemoCursor(layout, "playgroundDemoCursor", "pgDemoCursorText", "Pick a preset — or Freestyle for blank");
    const pStart = getDemoRelativePoint(layout, quizmasterPill, 0, 26);
    gsap.set(cursor, { x: pStart.x, y: pStart.y, opacity: 0 });

    const demoSelectPreset = (key) => {
      if (typeof window.__playgroundApplyPreset !== "function") return;
      isDemoUpdatingPlayground = true;
      window.__playgroundApplyPreset(key);
      isDemoUpdatingPlayground = false;
      playgroundDemoChangedPreset = (key !== "coach");
    };

    playgroundDemoTl = gsap.timeline({
      onComplete: () => killPlaygroundDemo(true)
    });

    // Step-by-step guided tour across Left (Configure) and Right (Interact) — slowed down by 20%
    playgroundDemoTl.to(cursor, {
      opacity: 1,
      duration: 0.6,
      ease: "sine.out",
      onStart: () => setPlaygroundSpotlight(presetBar)
    });
    playgroundDemoTl.to({}, { duration: 0.66 });
    playgroundDemoTl.call(() => demoSelectPreset("quizmaster"));
    playgroundDemoTl.to({}, { duration: 2.1 });

    if (freestylePill) {
      playgroundDemoTl.to(cursor, {
        x: () => getDemoRelativePoint(layout, freestylePill, 0, 26).x,
        y: () => getDemoRelativePoint(layout, freestylePill, 0, 26).y,
        duration: 1.38,
        ease: "sine.inOut",
        onStart: () => {
          setPlaygroundSpotlight(presetBar);
          if (cursorText) cursorText.textContent = "Or choose Freestyle to blank all fields";
        }
      });
      playgroundDemoTl.to({}, { duration: 1.74 });
    }

    // Ingredient 1: Role
    playgroundDemoTl.to(cursor, {
      x: () => getDemoRelativePoint(layout, roleGroup, 0, 18).x,
      y: () => getDemoRelativePoint(layout, roleGroup, 0, 18).y,
      duration: 1.5,
      ease: "sine.inOut",
      onStart: () => {
        setPlaygroundSpotlight(roleGroup);
        if (cursorText) cursorText.textContent = "1. Role: coach, researcher, quizmaster...";
      }
    });
    playgroundDemoTl.to({}, { duration: 1.98 });

    // Ingredient 2: Task
    playgroundDemoTl.to(cursor, {
      x: () => getDemoRelativePoint(layout, taskGroup, 0, 18).x,
      y: () => getDemoRelativePoint(layout, taskGroup, 0, 18).y,
      duration: 1.38,
      ease: "sine.inOut",
      onStart: () => {
        setPlaygroundSpotlight(taskGroup);
        if (cursorText) cursorText.textContent = "2. Task: write a report, explain something...";
      }
    });
    playgroundDemoTl.to({}, { duration: 1.98 });

    // Ingredient 3: Sources
    playgroundDemoTl.to(cursor, {
      x: () => getDemoRelativePoint(layout, sourcesGroup, 0, 18).x,
      y: () => getDemoRelativePoint(layout, sourcesGroup, 0, 18).y,
      duration: 1.38,
      ease: "sine.inOut",
      onStart: () => {
        setPlaygroundSpotlight(sourcesGroup);
        if (cursorText) cursorText.textContent = "3. Sources: knowledge to draw upon";
      }
    });
    playgroundDemoTl.to({}, { duration: 1.98 });

    // Ingredient 4: Format
    playgroundDemoTl.to(cursor, {
      x: () => getDemoRelativePoint(layout, formatGroup, 0, -24).x,
      y: () => getDemoRelativePoint(layout, formatGroup, 0, -24).y,
      duration: 1.38,
      ease: "sine.inOut",
      onStart: () => {
        setPlaygroundSpotlight(formatGroup);
        if (cursorText) cursorText.textContent = "4. Format: summary, quiz, or poem";
      }
    });
    playgroundDemoTl.to({}, { duration: 1.98 });

    // Right Column: Interact & Test Live (Unblurs & reveals Step 2)
    playgroundDemoTl.to(cursor, {
      x: () => getDemoRelativePoint(layout, chatInput, 0, -28).x,
      y: () => getDemoRelativePoint(layout, chatInput, 0, -28).y,
      duration: 1.68,
      ease: "sine.inOut",
      onStart: () => {
        const ip = document.getElementById("playgroundInteractPanel");
        const oi = document.getElementById("pgIntroOverlayInteract");
        if (ip) ip.classList.remove("is-intro-blurred");
        if (oi) oi.classList.add("is-hidden");

        setPlaygroundSpotlight(chatCol);
        if (cursorText) cursorText.textContent = "Step 2: Chat here to test your bot live";
      }
    });
    playgroundDemoTl.to({}, { duration: 2.16 });

    // Restore Frontline Coach and hand over
    playgroundDemoTl.to(cursor, {
      x: () => getDemoRelativePoint(layout, coachPill, 30, 26).x,
      y: () => getDemoRelativePoint(layout, coachPill, 30, 26).y,
      duration: 1.56,
      ease: "sine.inOut",
      onStart: () => {
        setPlaygroundSpotlight(presetBar);
        if (cursorText) cursorText.textContent = "Your turn — configure & chat!";
      },
      onComplete: () => demoSelectPreset("coach")
    });
    playgroundDemoTl.to({}, { duration: 1.32 });

    // Clean up spotlight blur & fade out cursor
    playgroundDemoTl.to(cursor, {
      opacity: 0,
      duration: 0.66,
      ease: "sine.in",
      onStart: () => setPlaygroundSpotlight(null)
    });
  }

  // 3. Stone 4 ("What should we do?" — Vertical Policy Slider) Demo
  let spectrumDemoTl = null;
  let hasInteractedWithSpectrum = false;
  let isDemoUpdatingSpectrum = false;
  let spectrumDemoChangedState = false;
  let spectrumDemoCleanupListeners = null;

  function killSpectrumDemo(restoreIfPreview = true) {
    if (spectrumDemoTl) {
      spectrumDemoTl.kill();
      spectrumDemoTl = null;
    }
    if (spectrumDemoCleanupListeners) {
      spectrumDemoCleanupListeners();
      spectrumDemoCleanupListeners = null;
    }
    if (restoreIfPreview && spectrumDemoChangedState) {
      const slider = document.getElementById("spectrumRange");
      const firstTab = document.querySelector('.domain-tab[data-domain="drafting"]');
      isDemoUpdatingSpectrum = true;
      if (firstTab && !firstTab.classList.contains("active")) firstTab.click();
      if (slider && slider.value !== "1") {
        slider.value = "1";
        slider.dispatchEvent(new Event("input", { bubbles: true }));
      }
      isDemoUpdatingSpectrum = false;
    }
    spectrumDemoChangedState = false;
    const cursor = document.getElementById("spectrumDemoCursor");
    if (cursor) cursor.remove();
  }

  function demonstrateSpectrumWidget() {
    killSpectrumDemo(true);
    if (hasInteractedWithSpectrum) return;
    if (typeof gsap === "undefined") return;

    const widget = document.getElementById("spectrumWidget");
    const slider = document.getElementById("spectrumRange");
    const vTrack = document.getElementById("spectrumVerticalTrack");
    const domainTabs = Array.from(document.querySelectorAll(".domain-tab"));
    if (!widget || !slider || domainTabs.length === 0) return;

    const onUserInteraction = () => {
      if (isDemoUpdatingSpectrum) return;
      hasInteractedWithSpectrum = true;
      killSpectrumDemo(false);
    };
    const evts = ["pointerdown", "click", "input", "keydown"];
    evts.forEach(ev => widget.addEventListener(ev, onUserInteraction, { capture: true }));
    spectrumDemoCleanupListeners = () => {
      evts.forEach(ev => widget.removeEventListener(ev, onUserInteraction, { capture: true }));
    };

    const { cursor, cursorText } = mountDemoCursor(widget, "spectrumDemoCursor", "demoCursorText", "Slide to set AI involvement");

    const getLevelPoint = (lvl) => {
      const targetEl = vTrack || slider;
      const rect = targetEl.getBoundingClientRect();
      const parentRect = widget.getBoundingClientRect();
      const ratioFromBottom = Math.max(0, Math.min(1, lvl / 3));
      return {
        x: rect.left - parentRect.left + rect.width / 2 + 88,
        y: (rect.bottom - parentRect.top) - rect.height * ratioFromBottom
      };
    };

    const setSliderVal = (v) => {
      isDemoUpdatingSpectrum = true;
      slider.value = String(v);
      slider.dispatchEvent(new Event("input", { bubbles: true }));
      isDemoUpdatingSpectrum = false;
      spectrumDemoChangedState = (v !== 1);
    };

    const clickTabDemo = (tabEl, isDefault = false) => {
      if (!tabEl) return;
      isDemoUpdatingSpectrum = true;
      tabEl.click();
      isDemoUpdatingSpectrum = false;
      spectrumDemoChangedState = !isDefault;
    };

    const p1 = getLevelPoint(1);
    gsap.set(cursor, { x: p1.x, y: p1.y, opacity: 0 });

    spectrumDemoTl = gsap.timeline({
      delay: 0.75,
      onComplete: () => killSpectrumDemo(true)
    });

    // 1. Appear calmly beside Level 1 on the vertical slider
    spectrumDemoTl.to(cursor, { opacity: 1, duration: 0.55, ease: "sine.out" });
    spectrumDemoTl.to({}, { duration: 1.15 });

    // 2. Glide UP to Level 2 (Supervised assist) & hold so policy position is readable
    spectrumDemoTl.to(cursor, {
      x: () => getLevelPoint(2).x,
      y: () => getLevelPoint(2).y,
      duration: 1.25,
      ease: "sine.inOut",
      onStart: () => {
        if (cursorText) cursorText.textContent = "Supervised assist";
      },
      onComplete: () => setSliderVal(2)
    });
    spectrumDemoTl.to({}, { duration: 1.8 });

    // 3. Glide UP to Level 3 (Autonomous delegation) & hold
    spectrumDemoTl.to(cursor, {
      x: () => getLevelPoint(3).x,
      y: () => getLevelPoint(3).y,
      duration: 1.25,
      ease: "sine.inOut",
      onStart: () => {
        if (cursorText) cursorText.textContent = "Autonomous delegation";
      },
      onComplete: () => setSliderVal(3)
    });
    spectrumDemoTl.to({}, { duration: 1.8 });

    // 4. Glide DOWN to Level 0 (Prohibit AI) & hold
    spectrumDemoTl.to(cursor, {
      x: () => getLevelPoint(0).x,
      y: () => getLevelPoint(0).y,
      duration: 1.45,
      ease: "sine.inOut",
      onStart: () => {
        if (cursorText) cursorText.textContent = "Prohibit AI";
      },
      onComplete: () => setSliderVal(0)
    });
    spectrumDemoTl.to({}, { duration: 1.8 });

    // 5. Return to Level 1 (Human-in-the-loop)
    spectrumDemoTl.to(cursor, {
      x: () => getLevelPoint(1).x,
      y: () => getLevelPoint(1).y,
      duration: 1.25,
      ease: "sine.inOut",
      onStart: () => {
        if (cursorText) cursorText.textContent = "Human-in-the-loop";
      },
      onComplete: () => setSliderVal(1)
    });
    spectrumDemoTl.to({}, { duration: 1.45 });

    // 6. Glide up to Scenario Tab 2 ("Intake & Triage") then return to Tab 1
    if (domainTabs[1] && domainTabs[0]) {
      spectrumDemoTl.to(cursor, {
        x: () => getDemoRelativePoint(widget, domainTabs[1], 0, 30).x,
        y: () => getDemoRelativePoint(widget, domainTabs[1], 0, 30).y,
        duration: 1.35,
        ease: "sine.inOut",
        onStart: () => {
          if (cursorText) cursorText.textContent = "Choose any scenario";
        },
        onComplete: () => clickTabDemo(domainTabs[1], false)
      });
      spectrumDemoTl.to({}, { duration: 1.8 });

      spectrumDemoTl.to(cursor, {
        x: () => getDemoRelativePoint(widget, domainTabs[0], 0, 30).x,
        y: () => getDemoRelativePoint(widget, domainTabs[0], 0, 30).y,
        duration: 1.25,
        ease: "sine.inOut",
        onStart: () => {
          if (cursorText) cursorText.textContent = "Your turn!";
        },
        onComplete: () => clickTabDemo(domainTabs[0], true)
      });
      spectrumDemoTl.to({}, { duration: 1.15 });
    }

    // 7. Fade out cleanly
    spectrumDemoTl.to(cursor, {
      opacity: 0,
      duration: 0.55,
      ease: "sine.in"
    });
  }

  // 4. Stone 5 ("The third party" — Living Care Triangle) Demo
  let triangleDemoTl = null;
  let hasInteractedWithTriangle = false;
  let isDemoUpdatingTriangle = false;
  let triangleDemoChangedAspect = false;
  let triangleDemoCleanupListeners = null;

  function killTriangleDemo(restoreIfPreview = true) {
    if (triangleDemoTl) {
      triangleDemoTl.kill();
      triangleDemoTl = null;
    }
    if (triangleDemoCleanupListeners) {
      triangleDemoCleanupListeners();
      triangleDemoCleanupListeners = null;
    }
    if (typeof window.__triangleHideActorBubble === "function") {
      window.__triangleHideActorBubble();
    }
    if (restoreIfPreview && triangleDemoChangedAspect && typeof window.__triangleRenderAspect === "function") {
      isDemoUpdatingTriangle = true;
      window.__triangleRenderAspect("partner", false);
      isDemoUpdatingTriangle = false;
    }
    triangleDemoChangedAspect = false;
    const cursor = document.getElementById("triangleDemoCursor");
    if (cursor) cursor.remove();
  }

  function demonstrateTriangleWidget() {
    killTriangleDemo(true);
    if (hasInteractedWithTriangle) return;
    if (typeof gsap === "undefined") return;

    const workbench = document.getElementById("triangleWorkbench");
    if (!workbench) return;

    const compBtn = workbench.querySelector('.aspect-btn[data-aspect="competitor"]');
    const partnerBtn = workbench.querySelector('.aspect-btn[data-aspect="partner"]');
    const personNode = document.getElementById("trianglePersonNode");
    const staffNode = document.getElementById("triangleStaffNode");
    if (!compBtn || !partnerBtn || !personNode || !staffNode) return;

    const onUserInteraction = (e) => {
      if (isDemoUpdatingTriangle) return;
      if (e.type === "pointerover" || e.type === "pointerenter" || e.type === "focusin") {
        if (!e.target || !e.target.closest || !e.target.closest(".triangle-node-container")) return;
      }
      hasInteractedWithTriangle = true;
      killTriangleDemo(false);
    };
    const evts = ["pointerdown", "click", "keydown", "pointerover", "pointerenter", "focusin"];
    evts.forEach(ev => workbench.addEventListener(ev, onUserInteraction, { capture: true }));
    triangleDemoCleanupListeners = () => {
      evts.forEach(ev => workbench.removeEventListener(ev, onUserInteraction, { capture: true }));
    };

    const { cursor, cursorText } = mountDemoCursor(workbench, "triangleDemoCursor", "triangleDemoCursorText", "Switch between AI roles");
    const pStart = getDemoRelativePoint(workbench, compBtn, 0, 28);
    gsap.set(cursor, { x: pStart.x, y: pStart.y, opacity: 0 });

    const demoClickAspect = (btnEl, isPartner = false) => {
      if (!btnEl) return;
      isDemoUpdatingTriangle = true;
      btnEl.click();
      isDemoUpdatingTriangle = false;
      triangleDemoChangedAspect = !isPartner;
    };

    const demoShowVoice = (actorKey) => {
      if (typeof window.__triangleShowActorBubble !== "function") return;
      isDemoUpdatingTriangle = true;
      window.__triangleShowActorBubble(actorKey);
      isDemoUpdatingTriangle = false;
    };

    const demoHideVoice = () => {
      if (typeof window.__triangleHideActorBubble !== "function") return;
      isDemoUpdatingTriangle = true;
      window.__triangleHideActorBubble();
      isDemoUpdatingTriangle = false;
    };

    triangleDemoTl = gsap.timeline({
      delay: 0.75,
      onComplete: () => killTriangleDemo(true)
    });

    triangleDemoTl.to(cursor, { opacity: 1, duration: 0.55, ease: "sine.out" });
    triangleDemoTl.to({}, { duration: 0.7 });
    triangleDemoTl.call(() => demoClickAspect(compBtn, false));
    triangleDemoTl.to({}, { duration: 1.8 });

    triangleDemoTl.to(cursor, {
      x: () => getDemoRelativePoint(workbench, personNode, -18, -44).x,
      y: () => getDemoRelativePoint(workbench, personNode, -18, -44).y,
      duration: 1.4,
      ease: "sine.inOut",
      onStart: () => {
        if (cursorText) cursorText.textContent = "Hover any party to read what they say";
      },
      onComplete: () => demoShowVoice("person")
    });
    triangleDemoTl.to({}, { duration: 2.2 });

    triangleDemoTl.to(cursor, {
      x: () => getDemoRelativePoint(workbench, staffNode, 40, 32).x,
      y: () => getDemoRelativePoint(workbench, staffNode, 40, 32).y,
      duration: 1.35,
      ease: "sine.inOut",
      onStart: () => demoHideVoice(),
      onComplete: () => demoShowVoice("staff")
    });
    triangleDemoTl.to({}, { duration: 2.2 });

    triangleDemoTl.to(cursor, {
      x: () => getDemoRelativePoint(workbench, partnerBtn, 20, 28).x,
      y: () => getDemoRelativePoint(workbench, partnerBtn, 20, 28).y,
      duration: 1.35,
      ease: "sine.inOut",
      onStart: () => {
        demoHideVoice();
        if (cursorText) cursorText.textContent = "Your turn!";
      },
      onComplete: () => demoClickAspect(partnerBtn, true)
    });
    triangleDemoTl.to({}, { duration: 1.15 });

    triangleDemoTl.to(cursor, {
      opacity: 0,
      duration: 0.55,
      ease: "sine.in"
    });
  }

  // 5. Stone 6 ("Risks & The Grey Zone" — Frontline Scenarios Desk) Demo
  let greyZoneDemoTl = null;
  let hasInteractedWithGreyZone = false;
  let isDemoUpdatingGreyZone = false;
  let greyZoneDemoCleanupListeners = null;

  function killGreyZoneDemo() {
    if (greyZoneDemoTl) {
      greyZoneDemoTl.kill();
      greyZoneDemoTl = null;
    }
    if (greyZoneDemoCleanupListeners) {
      greyZoneDemoCleanupListeners();
      greyZoneDemoCleanupListeners = null;
    }
    if (typeof window.__greyZoneHideSignal === "function") {
      window.__greyZoneHideSignal();
    }
    document.querySelectorAll("#greyZoneDesk .stance-option-btn.demo-highlight").forEach(b => b.classList.remove("demo-highlight"));
    const cursor = document.getElementById("greyZoneDemoCursor");
    if (cursor) cursor.remove();
  }

  function demonstrateGreyZoneDesk() {
    killGreyZoneDemo();
    if (hasInteractedWithGreyZone) return;
    if (typeof gsap === "undefined") return;

    const desk = document.getElementById("greyZoneDesk");
    if (!desk) return;

    const chip0 = desk.querySelector('.artefact-signal-chip[data-signal="0"]');
    const chip1 = desk.querySelector('.artefact-signal-chip[data-signal="1"]');
    const stanceBtn = desk.querySelector('.stance-option-btn[data-stance="1"]') || desk.querySelector(".stance-option-btn");
    if (!chip0 || !chip1 || !stanceBtn) return;

    const onUserInteraction = (e) => {
      if (isDemoUpdatingGreyZone) return;
      if (e.type === "pointerover" || e.type === "pointerenter" || e.type === "focusin") {
        if (!e.target || !e.target.closest || !e.target.closest(".artefact-signal-chip")) return;
      }
      hasInteractedWithGreyZone = true;
      killGreyZoneDemo();
    };
    const evts = ["pointerdown", "click", "keydown", "pointerover", "pointerenter", "focusin"];
    evts.forEach(ev => desk.addEventListener(ev, onUserInteraction, { capture: true }));
    greyZoneDemoCleanupListeners = () => {
      evts.forEach(ev => desk.removeEventListener(ev, onUserInteraction, { capture: true }));
    };

    const { cursor, cursorText } = mountDemoCursor(desk, "greyZoneDemoCursor", "greyZoneDemoCursorText", "Hover highlighted phrases");
    const pStart = getDemoRelativePoint(desk, chip0, 0, -24);
    gsap.set(cursor, { x: pStart.x, y: pStart.y, opacity: 0 });

    const demoShowSig = (idx) => {
      if (typeof window.__greyZoneShowSignal !== "function") return;
      isDemoUpdatingGreyZone = true;
      window.__greyZoneShowSignal(idx);
      isDemoUpdatingGreyZone = false;
    };

    const demoHideSig = () => {
      if (typeof window.__greyZoneHideSignal !== "function") return;
      isDemoUpdatingGreyZone = true;
      window.__greyZoneHideSignal();
      isDemoUpdatingGreyZone = false;
    };

    greyZoneDemoTl = gsap.timeline({
      delay: 0.75,
      onComplete: () => killGreyZoneDemo()
    });

    greyZoneDemoTl.to(cursor, {
      opacity: 1,
      duration: 0.55,
      ease: "sine.out",
      onComplete: () => demoShowSig(0)
    });
    greyZoneDemoTl.to({}, { duration: 2.2 });

    greyZoneDemoTl.to(cursor, {
      x: () => getDemoRelativePoint(desk, chip1, 0, 28).x,
      y: () => getDemoRelativePoint(desk, chip1, 0, 28).y,
      duration: 1.35,
      ease: "sine.inOut",
      onStart: () => {
        demoHideSig();
        if (cursorText) cursorText.textContent = "Inspect hidden risks & needs";
      },
      onComplete: () => demoShowSig(1)
    });
    greyZoneDemoTl.to({}, { duration: 2.2 });

    greyZoneDemoTl.to(cursor, {
      x: () => getDemoRelativePoint(desk, stanceBtn, 0, -26).x,
      y: () => getDemoRelativePoint(desk, stanceBtn, 0, -26).y,
      duration: 1.4,
      ease: "sine.inOut",
      onStart: () => {
        demoHideSig();
        if (cursorText) cursorText.textContent = "Then choose Waythrough's response";
      },
      onComplete: () => stanceBtn.classList.add("demo-highlight")
    });
    greyZoneDemoTl.to({}, { duration: 1.75 });

    greyZoneDemoTl.to(cursor, {
      opacity: 0,
      duration: 0.55,
      ease: "sine.in",
      onStart: () => stanceBtn.classList.remove("demo-highlight")
    });
  }

  function killAllChapterDemos() {
    killQuizDemo();
    killPriorityDemo();
    killPlaygroundDemo(true);
    killSpectrumDemo(true);
    killTriangleDemo(true);
    killGreyZoneDemo();
  }

  function launchChapterDemo(spokeNum, slideIdx) {
    if (spokeNum === 1 && slideIdx === 0) {
      const resultsContainer = document.getElementById("quizResultsContainer");
      if (resultsContainer && resultsContainer.classList.contains("active")) {
        demonstratePriorityRanking();
      } else {
        demonstrateQuizWidget();
      }
    } else if (spokeNum === 1 && slideIdx === 1) {
      setupPlaygroundIntro();
    } else if (spokeNum === 1 && slideIdx === 2) {
      demonstrateSpectrumWidget();
    } else if (spokeNum === 3 && slideIdx === 0) {
      demonstrateTriangleWidget();
    } else if (spokeNum === 3 && slideIdx === 1) {
      demonstrateGreyZoneDesk();
    }
  }

  function setupLandingWidgets() {
    const stage = document.getElementById('landingNodeStage');
    const nodes = document.querySelectorAll('.perspective-node');
    if (!stage || nodes.length === 0) return;

    let activeDragId = null;
    let hasDragged = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let suppressClickUntil = 0;

    // Position node at (px, py) anywhere within the interactive canvas
    function setNodePosition(id, px, py, animate = false) {
      const data = perspectivesData[id];
      if (!data) return;

      // Keep within canvas boundaries
      let clampedX = Math.max(75, Math.min(785, px));
      let clampedY = Math.max(22, Math.min(348, py));

      let dx = clampedX - CX;
      let dy = clampedY - CY;
      let r = Math.sqrt(dx * dx + dy * dy);

      // Prevent overlapping the central "ME" node circle
      if (r < 55) {
        if (r === 0) { dx = 1; r = 1; }
        clampedX = Math.round(CX + (dx / r) * 55);
        clampedY = Math.round(CY + (dy / r) * 55);
        r = 55;
      }

      data.x = clampedX;
      data.y = clampedY;
      data.r = r;

      const nodeEl = document.getElementById('node-' + id);
      const spokeLine = document.getElementById('spokeLine-' + id);

      // Distance fading beyond 120px down to 0.22 at max canvas reach
      const fadeStart = 120;
      const fadeMax = 300;
      let opacity = 1.0;
      if (r > fadeStart) {
        opacity = Math.max(0.22, 1.0 - 0.78 * Math.min(1, (r - fadeStart) / (fadeMax - fadeStart)));
      }

      if (nodeEl) {
        if (animate && typeof gsap !== 'undefined') {
          gsap.to(nodeEl, { left: clampedX, top: clampedY, opacity: opacity, duration: 0.35, ease: 'power2.out' });
        } else {
          nodeEl.style.left = clampedX + 'px';
          nodeEl.style.top = clampedY + 'px';
          nodeEl.style.opacity = opacity.toFixed(2);
        }

        if (opacity <= 0.55) {
          nodeEl.classList.add('faded');
        } else {
          nodeEl.classList.remove('faded');
        }
      }

      if (spokeLine) {
        const lineOpacity = Math.max(0.06, 0.42 * opacity);
        if (animate && typeof gsap !== 'undefined') {
          gsap.to(spokeLine, { attr: { x2: clampedX, y2: clampedY }, opacity: lineOpacity, duration: 0.35, ease: 'power2.out' });
        } else {
          spokeLine.setAttribute('x1', CX);
          spokeLine.setAttribute('y1', CY);
          spokeLine.setAttribute('x2', clampedX);
          spokeLine.setAttribute('y2', clampedY);
          spokeLine.style.opacity = lineOpacity.toFixed(2);
        }

        const norm = Math.max(0, Math.min(1, 1 - (r - 55) / (340 - 55)));
        if (norm >= 0.65) {
          spokeLine.classList.add('active');
        } else {
          spokeLine.classList.remove('active');
        }
      }

      // Update combined persona description card
      updateCombinedPersona();
    }

    // Radial helper for click/keyboard adjustments
    function setNodeRadius(id, r, animate = false) {
      const data = perspectivesData[id];
      if (!data) return;
      const dx = (data.x || 0) - CX;
      const dy = (data.y || 0) - CY;
      const angle = (dx === 0 && dy === 0) ? (data.angle * Math.PI) / 180 : Math.atan2(dy, dx);
      const nx = Math.round(CX + r * Math.cos(angle));
      const ny = Math.round(CY + r * Math.sin(angle));
      setNodePosition(id, nx, ny, animate);
    }

    // Resolves and displays the combined persona archetype
    function updateCombinedPersona() {
      // Calculate normalized affinity (0..1) for each persona
      const scores = {};
      const list = [];
      Object.keys(perspectivesData).forEach(id => {
        const d = perspectivesData[id];
        const norm = Math.max(0, Math.min(1, 1 - (d.r - 55) / (340 - 55)));
        scores[id] = norm;
        list.push({ id, key: d.key, norm, color: d.color, name: d.name });
      });

      // Sort descending by affinity
      list.sort((a, b) => b.norm - a.norm);

      const top1 = list[0];
      const top2 = list[1];
      const top3 = list[2];
      const top4 = list[3];
      const minScore = list[list.length - 1].norm;
      const maxScore = list[0].norm;
      const spread = maxScore - minScore;

      let matchedArchetype = null;

      // 1. Check Global Boundaries
      if (minScore >= 0.58) {
        matchedArchetype = combinedArchetypes['ALL_HIGH'];
      } else if (maxScore <= 0.35) {
        matchedArchetype = combinedArchetypes['ALL_LOW'];
      } else if (spread <= 0.12 && maxScore >= 0.35 && maxScore <= 0.62) {
        matchedArchetype = combinedArchetypes['ALL_MID'];
      } else if (scores['overwhelmed'] >= 0.55 && scores['ignore'] >= 0.55 && scores['explorer'] < 0.35 && scores['pragmatist'] < 0.35 && scores['anchor'] < 0.35 && scores['skeptic'] < 0.35) {
        matchedArchetype = combinedArchetypes['O+I'];
      } else if (scores['explorer'] >= 0.48 && scores['pragmatist'] >= 0.48 && scores['anchor'] >= 0.48 && scores['skeptic'] >= 0.48 && scores['overwhelmed'] < 0.35 && scores['ignore'] < 0.35) {
        matchedArchetype = combinedArchetypes['E+P+A+S'];
      }

      // 2. Focused Dual Extremes
      if (!matchedArchetype) {
        if (scores['anchor'] >= 0.60 && scores['pragmatist'] >= 0.60 && scores['explorer'] < 0.35 && scores['skeptic'] < 0.35) {
          matchedArchetype = combinedArchetypes['A+P_HIGH'];
        } else if (scores['anchor'] >= 0.60 && scores['explorer'] >= 0.60 && scores['pragmatist'] < 0.35 && scores['skeptic'] < 0.35) {
          matchedArchetype = combinedArchetypes['A+E_HIGH'];
        } else if (scores['explorer'] >= 0.60 && scores['skeptic'] >= 0.60 && scores['anchor'] < 0.35 && scores['pragmatist'] < 0.35) {
          matchedArchetype = combinedArchetypes['E+S_HIGH'];
        }
      }

      // 3. Match by Active Personas
      if (!matchedArchetype) {
        // Active threshold: within 0.20 of top score and above 0.38
        const activeThreshold = Math.max(0.38, top1.norm - 0.20);
        const activeList = list.filter(item => item.norm >= activeThreshold);

        if (activeList.length === 1 || (top1.norm - top2.norm >= 0.28)) {
          // Single dominant
          matchedArchetype = combinedArchetypes[top1.key];
        } else if (activeList.length === 2) {
          // Pairwise
          const pairKey = [activeList[0].key, activeList[1].key].sort().join('+');
          matchedArchetype = combinedArchetypes[pairKey];
        } else if (activeList.length === 3) {
          // Triad
          const triadKey = [activeList[0].key, activeList[1].key, activeList[2].key].sort().join('+');
          matchedArchetype = combinedArchetypes[triadKey];
        } else if (activeList.length === 4) {
          // Quad
          const quadKey = [activeList[0].key, activeList[1].key, activeList[2].key, activeList[3].key].sort().join('+');
          matchedArchetype = combinedArchetypes[quadKey];
        }

        // Fallbacks if exact cluster not matched
        if (!matchedArchetype) {
          const fallbackTriad = [top1.key, top2.key, top3.key].sort().join('+');
          matchedArchetype = combinedArchetypes[fallbackTriad];
        }
        if (!matchedArchetype) {
          const fallbackPair = [top1.key, top2.key].sort().join('+');
          matchedArchetype = combinedArchetypes[fallbackPair];
        }
      }

      if (!matchedArchetype) {
        matchedArchetype = combinedArchetypes['ALL_MID'];
      }

      // Render to DOM
      const titleEl = document.getElementById('descTitle');
      const indicatorEl = document.getElementById('descIndicator');
      const badgeEl = document.getElementById('descAffinityBadge');
      const bodyEl = document.getElementById('descBodyText');

      if (titleEl) titleEl.textContent = matchedArchetype.title;
      if (badgeEl) {
        badgeEl.textContent = matchedArchetype.badge;
        badgeEl.className = 'desc-affinity-badge ' + (
          matchedArchetype === combinedArchetypes['ALL_LOW'] ? 'badge-low' :
          matchedArchetype === combinedArchetypes['ALL_HIGH'] ? 'badge-high' : 'badge-med'
        );
      }
      if (bodyEl) bodyEl.textContent = matchedArchetype.body;

      state.userCompassData = {
        title: matchedArchetype.title,
        badge: matchedArchetype.badge,
        icon: matchedArchetype.icon || 'compass',
        body: matchedArchetype.body,
        perspectiveScores: { ...scores },
        timestamp: new Date().toISOString()
      };
      try {
        localStorage.setItem('waythrough_compass_data', JSON.stringify(state.userCompassData));
      } catch (_) {}

      if (indicatorEl) {
        if (matchedArchetype === combinedArchetypes['ALL_LOW']) {
          indicatorEl.style.background = '#888888';
        } else {
          indicatorEl.style.background = top1.color;
        }
      }

      // Update Central ME Circle Persona Icon & Border
      const meNode = document.getElementById('nodeCenterMe');
      const meIconWrap = document.getElementById('meIconWrap');
      if (meIconWrap) {
        const iconKey = matchedArchetype.icon || 'compass';
        const iconSvg = getPersonaIconSvg(iconKey);
        if (meIconWrap.getAttribute('data-icon') !== iconKey) {
          meIconWrap.setAttribute('data-icon', iconKey);
          meIconWrap.innerHTML = iconSvg;
          const compIcon = document.getElementById('companionIconWrap');
          if (compIcon) compIcon.innerHTML = iconSvg;
          if (typeof gsap !== 'undefined') {
            gsap.fromTo(meIconWrap, { scale: 0.72, opacity: 0.5 }, { scale: 1, opacity: 1, duration: 0.28, ease: 'back.out(1.5)' });
          }
        }
      }
      if (meNode) {
        meNode.setAttribute('aria-label', `Your Persona: ${matchedArchetype.title}`);
        let outlineColor = 'var(--wt-green-sage)';
        if (matchedArchetype === combinedArchetypes['ALL_LOW']) {
          outlineColor = '#888888';
        } else if (matchedArchetype === combinedArchetypes['ALL_HIGH']) {
          outlineColor = 'var(--wt-green-mint)';
        } else if (top1 && top1.color) {
          outlineColor = top1.color;
        }
        meNode.style.borderColor = outlineColor;

        // Apply matching colourful outline and subtle glow to cursor companion
        const comp = document.getElementById('personaCursorCompanion');
        if (comp) {
          comp.style.setProperty('--companion-outline-color', outlineColor);
          comp.style.setProperty('--companion-shadow-color', outlineColor + '44');
        }
      }
    }

    // Initialize all node positions at distant starting positions
    Object.keys(perspectivesData).forEach(id => {
      const d = perspectivesData[id];
      setNodePosition(id, d.initX, d.initY, false);
    });

    // Pointer event handlers for free 2D dragging anywhere on canvas
    function onPointerMove(e) {
      if (!activeDragId) return;
      e.preventDefault();

      if (!hasDragged && Math.hypot(e.clientX - dragStartX, e.clientY - dragStartY) > 4) {
        hasDragged = true;
      }

      const rect = stage.getBoundingClientRect();
      const scaleX = 860 / (rect.width || 860);
      const scaleY = 370 / (rect.height || 370);

      const px = (e.clientX - rect.left) * scaleX;
      const py = (e.clientY - rect.top) * scaleY;

      setNodePosition(activeDragId, px, py, false);
    }

    function onPointerUp() {
      if (!activeDragId) return;
      const nodeEl = document.getElementById('node-' + activeDragId);
      if (nodeEl) nodeEl.classList.remove('dragging');

      if (hasDragged) {
        suppressClickUntil = Date.now() + 350;
      }
      activeDragId = null;

      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    }

    nodes.forEach(node => {
      const id = node.getAttribute('data-id');

      node.addEventListener('pointerdown', (e) => {
        killOnboardingAnimation();
        activeDragId = id;
        hasDragged = false;
        dragStartX = e.clientX;
        dragStartY = e.clientY;

        const nodeEl = document.getElementById('node-' + id);
        const spokeLine = document.getElementById('spokeLine-' + id);
        if (typeof gsap !== 'undefined') {
          if (nodeEl) gsap.killTweensOf(nodeEl);
          if (spokeLine) gsap.killTweensOf(spokeLine);
        }
        if (nodeEl) nodeEl.classList.add('dragging');

        window.addEventListener('pointermove', onPointerMove, { passive: false });
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointercancel', onPointerUp);
      });

      // Click to toggle proximity between close and far along current angle (only if NOT dragged)
      node.addEventListener('click', (e) => {
        if (hasDragged || Date.now() < suppressClickUntil) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        const data = perspectivesData[id];
        if (!data) return;
        const dx = data.x - CX;
        const dy = data.y - CY;
        const currentR = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        const targetR = currentR > 160 ? 95 : 270;
        const targetX = Math.round(CX + targetR * Math.cos(angle));
        const targetY = Math.round(CY + targetR * Math.sin(angle));
        setNodePosition(id, targetX, targetY, true);
      }, true);

      // Keyboard accessibility (Enter / Space to toggle close/far, Arrows to adjust in 2D)
      node.addEventListener('keydown', (e) => {
        killOnboardingAnimation();
        const data = perspectivesData[id];
        if (!data) return;

        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const dx = data.x - CX;
          const dy = data.y - CY;
          const currentR = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);
          const targetR = currentR > 160 ? 95 : 270;
          const targetX = Math.round(CX + targetR * Math.cos(angle));
          const targetY = Math.round(CY + targetR * Math.sin(angle));
          setNodePosition(id, targetX, targetY, true);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setNodePosition(id, data.x, data.y - 25, true);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          setNodePosition(id, data.x, data.y + 25, true);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setNodePosition(id, data.x - 25, data.y, true);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          setNodePosition(id, data.x + 25, data.y, true);
        }
      });
    });

    stage.addEventListener('pointerdown', killOnboardingAnimation);

    // --- Onboarding Demo Animation: Drags two perspectives in & out to teach the mechanic ---
    let onboardingTl = null;
    let hasUserInteracted = false;

    function killOnboardingAnimation() {
      hasUserInteracted = true;
      if (onboardingTl) {
        onboardingTl.kill();
        onboardingTl = null;
      }
      const expNode = document.getElementById('node-explorer');
      const skpNode = document.getElementById('node-skeptic');
      if (expNode) expNode.classList.remove('dragging');
      if (skpNode) skpNode.classList.remove('dragging');
      const cursor = document.getElementById('landingDemoCursor');
      if (cursor) cursor.remove();
    }

    function playOnboardingAnimation() {
      killOnboardingAnimation();
      hasUserInteracted = false;
      if (typeof gsap === 'undefined') return;

      const expData = perspectivesData['explorer'];
      const skpData = perspectivesData['skeptic'];
      if (!expData || !skpData) return;

      const expNode = document.getElementById('node-explorer');
      const skpNode = document.getElementById('node-skeptic');

      const expStartX = expData.initX;
      const expStartY = expData.initY;
      const expDx = expStartX - CX;
      const expDy = expStartY - CY;
      const expDist = Math.hypot(expDx, expDy);
      const expCloseR = 95;
      const expTargetX = Math.round(CX + (expDx / expDist) * expCloseR);
      const expTargetY = Math.round(CY + (expDy / expDist) * expCloseR);

      const skpStartX = skpData.initX;
      const skpStartY = skpData.initY;
      const skpDx = skpStartX - CX;
      const skpDy = skpStartY - CY;
      const skpDist = Math.hypot(skpDx, skpDy);
      const skpCloseR = 95;
      const skpTargetX = Math.round(CX + (skpDx / skpDist) * skpCloseR);
      const skpTargetY = Math.round(CY + (skpDy / skpDist) * skpCloseR);

      const anim = { exp: 0, skp: 0 };

      // Mount demo cursor with requested tooltip text
      const { cursor } = mountDemoCursor(
        stage,
        "landingDemoCursor",
        "landingDemoCursorText",
        "Drag the perspectives you agree with closer to you"
      );

      // Start cursor right on the Curious Explorer node
      gsap.set(cursor, { x: expStartX, y: expStartY + 28, opacity: 0 });

      onboardingTl = gsap.timeline({
        delay: 0.75,
        onComplete: () => {
          onboardingTl = null;
          if (cursor) cursor.remove();
        }
      });

      // 1. Fade demo cursor in pointing to Curious Explorer
      onboardingTl.to(cursor, {
        opacity: 1,
        duration: 0.45,
        ease: 'sine.out'
      });

      // 2. Curious Explorer glides unhurriedly in toward ME
      onboardingTl.to(anim, {
        exp: 1,
        duration: 1.45,
        ease: 'sine.inOut',
        onStart: () => {
          if (expNode) expNode.classList.add('dragging');
        },
        onUpdate: () => {
          if (hasUserInteracted) return;
          const x = expStartX + (expTargetX - expStartX) * anim.exp;
          const y = expStartY + (expTargetY - expStartY) * anim.exp;
          setNodePosition('explorer', Math.round(x), Math.round(y), false);
          gsap.set(cursor, { x: Math.round(x), y: Math.round(y + 28) });
        },
        onComplete: () => {
          if (expNode) expNode.classList.remove('dragging');
        }
      });

      // Generous reading pause so viewer can read the shifted persona & icon
      onboardingTl.to({}, { duration: 1.85 });

      // 3. Curious Explorer glides back out to rest position
      onboardingTl.to(anim, {
        exp: 0,
        duration: 1.25,
        ease: 'sine.inOut',
        onStart: () => {
          if (expNode) expNode.classList.add('dragging');
        },
        onUpdate: () => {
          if (hasUserInteracted) return;
          const x = expStartX + (expTargetX - expStartX) * anim.exp;
          const y = expStartY + (expTargetY - expStartY) * anim.exp;
          setNodePosition('explorer', Math.round(x), Math.round(y), false);
          gsap.set(cursor, { x: Math.round(x), y: Math.round(y + 28) });
        },
        onComplete: () => {
          if (expNode) expNode.classList.remove('dragging');
        }
      });

      // 4. Glide pointer across to Ethical Skeptic
      onboardingTl.to(cursor, {
        x: skpStartX,
        y: skpStartY + 28,
        duration: 0.95,
        ease: 'sine.inOut'
      });

      // 5. Ethical Skeptic glides unhurriedly in toward ME
      onboardingTl.to(anim, {
        skp: 1,
        duration: 1.45,
        ease: 'sine.inOut',
        onStart: () => {
          if (skpNode) skpNode.classList.add('dragging');
        },
        onUpdate: () => {
          if (hasUserInteracted) return;
          const x = skpStartX + (skpTargetX - skpStartX) * anim.skp;
          const y = skpStartY + (skpTargetY - skpStartY) * anim.skp;
          setNodePosition('skeptic', Math.round(x), Math.round(y), false);
          gsap.set(cursor, { x: Math.round(x), y: Math.round(y + 28) });
        },
        onComplete: () => {
          if (skpNode) skpNode.classList.remove('dragging');
        }
      });

      // Generous reading pause so viewer can read the shifted persona & icon
      onboardingTl.to({}, { duration: 1.85 });

      // 6. Ethical Skeptic glides back out
      onboardingTl.to(anim, {
        skp: 0,
        duration: 1.25,
        ease: 'sine.inOut',
        onStart: () => {
          if (skpNode) skpNode.classList.add('dragging');
        },
        onUpdate: () => {
          if (hasUserInteracted) return;
          const x = skpStartX + (skpTargetX - skpStartX) * anim.skp;
          const y = skpStartY + (skpTargetY - skpStartY) * anim.skp;
          setNodePosition('skeptic', Math.round(x), Math.round(y), false);
          gsap.set(cursor, { x: Math.round(x), y: Math.round(y + 28) });
        },
        onComplete: () => {
          if (skpNode) skpNode.classList.remove('dragging');
        }
      });

      // 7. Fade demo cursor out
      onboardingTl.to(cursor, {
        opacity: 0,
        duration: 0.5,
        ease: 'sine.in',
        onComplete: () => {
          if (cursor) cursor.remove();
        }
      });
    }

    // Expose node position and demo animation APIs
    window.__setNodePosition = setNodePosition;
    window.__setNodeRadius = setNodeRadius;
    window.__playOnboardingAnimation = playOnboardingAnimation;
    window.__killOnboardingAnimation = killOnboardingAnimation;
  }

  // --- Isometric Flowing River & Stepping-Stone Pebbles Scene ---
  function setupRiverScene() {
    const sceneEl = document.getElementById('riverScene');
    const canvas = document.getElementById('riverWaterCanvas');
    const tooltip = document.getElementById('riverTooltip');
    const tooltipPill = document.getElementById('riverTooltipPill');
    const tooltipStep = document.getElementById('riverTooltipStep');
    const tooltipTitle = document.getElementById('riverTooltipTitle');
    const tooltipDesc = document.getElementById('riverTooltipDesc');
    const pebbles = Array.from(document.querySelectorAll('.river-pebble'));

    // Speech bubble elements on cursor companion
    const companionEl = document.getElementById('personaCursorCompanion');
    const bubbleEl = document.getElementById('companionSpeechBubble');
    const bubblePill = document.getElementById('speechBubblePill');
    const bubbleStep = document.getElementById('speechBubbleStep');
    const bubbleTitle = document.getElementById('speechBubbleTitle');
    const bubbleDesc = document.getElementById('speechBubbleDesc');

    if (!sceneEl || pebbles.length === 0) return;

    renderRiverPebbleStates();

    function showPebbleTooltip(pebbleEl) {
      const idx = parseInt(pebbleEl.getAttribute('data-deck-index'), 10);
      const deck = RIVER_DECKS[idx];
      if (!deck) return;

      const status = getPebbleStatus(idx);
      const stepText = `STONE ${idx + 1} OF ${RIVER_DECKS.length}`;
      const titleText = (status === 'locked') ? 'Locked Stepping Stone' : deck.title;
      const descText = (status === 'locked')
        ? `${deck.desc.trim().replace(/\.?$/, '.')} Complete the previous stepping stone to unlock.`
        : deck.desc;

      // Update static fallback tooltip
      if (tooltipStep) tooltipStep.textContent = stepText;
      if (tooltipPill) {
        tooltipPill.classList.remove('pill-new', 'pill-locked');
        if (status === 'newly-unlocked') {
          tooltipPill.textContent = 'NEWLY UNLOCKED';
          tooltipPill.classList.add('pill-new');
        } else if (status === 'locked') {
          tooltipPill.textContent = 'LOCKED';
          tooltipPill.classList.add('pill-locked');
        } else {
          tooltipPill.textContent = 'VIEWED';
        }
      }
      if (tooltipTitle) tooltipTitle.textContent = titleText;
      if (tooltipDesc) tooltipDesc.textContent = descText;

      // Update Speech Bubble emerging directly from Cursor Companion
      if (bubbleStep) bubbleStep.textContent = stepText;
      if (bubblePill) {
        bubblePill.classList.remove('pill-new', 'pill-locked');
        if (status === 'newly-unlocked') {
          bubblePill.textContent = 'NEWLY UNLOCKED';
          bubblePill.classList.add('pill-new');
        } else if (status === 'locked') {
          bubblePill.textContent = 'LOCKED';
          bubblePill.classList.add('pill-locked');
        } else {
          bubblePill.textContent = 'VIEWED';
        }
      }
      if (bubbleTitle) bubbleTitle.textContent = titleText;
      if (bubbleDesc) bubbleDesc.textContent = descText;

      if (bubbleEl && companionEl) {
        const cRect = companionEl.getBoundingClientRect();
        if (cRect.right > window.innerWidth - 320) {
          bubbleEl.style.left = 'auto';
          bubbleEl.style.right = '48px';
          bubbleEl.style.transformOrigin = 'right bottom';
          const tail = bubbleEl.querySelector('.speech-bubble-tail');
          if (tail) {
            tail.style.left = 'auto';
            tail.style.right = '-8px';
            tail.style.borderLeft = 'none';
            tail.style.borderBottom = 'none';
            tail.style.borderRight = '2px solid var(--companion-outline-color, var(--wt-green-dark))';
            tail.style.borderTop = '2px solid var(--companion-outline-color, var(--wt-green-dark))';
          }
        } else {
          bubbleEl.style.left = '48px';
          bubbleEl.style.right = 'auto';
          bubbleEl.style.transformOrigin = 'left bottom';
          const tail = bubbleEl.querySelector('.speech-bubble-tail');
          if (tail) {
            tail.style.left = '-8px';
            tail.style.right = 'auto';
            tail.style.borderRight = 'none';
            tail.style.borderTop = 'none';
            tail.style.borderLeft = '2px solid var(--companion-outline-color, var(--wt-green-dark))';
            tail.style.borderBottom = '2px solid var(--companion-outline-color, var(--wt-green-dark))';
          }
        }
        bubbleEl.classList.add('visible');
        bubbleEl.setAttribute('aria-hidden', 'false');
      }

      if (tooltip) {
        tooltip.classList.add('visible');
        tooltip.setAttribute('aria-hidden', 'false');
      }
    }

    function hidePebbleTooltip() {
      if (bubbleEl) {
        bubbleEl.classList.remove('visible');
        bubbleEl.setAttribute('aria-hidden', 'true');
      }
      if (tooltip) {
        tooltip.classList.remove('visible');
        tooltip.setAttribute('aria-hidden', 'true');
      }
    }

    pebbles.forEach(pebble => {
      pebble.addEventListener('pointerenter', () => showPebbleTooltip(pebble));
      pebble.addEventListener('pointerleave', hidePebbleTooltip);
      pebble.addEventListener('focus', () => showPebbleTooltip(pebble));
      pebble.addEventListener('blur', hidePebbleTooltip);

      pebble.addEventListener('click', () => {
        const idx = parseInt(pebble.getAttribute('data-deck-index'), 10);
        const status = getPebbleStatus(idx);
        if (status === 'locked') {
          showPebbleTooltip(pebble);
          const surface = pebble.querySelector('.pebble-surface');
          const lockImg = pebble.querySelector('.pebble-padlock-icon');
          if (typeof gsap !== 'undefined') {
            if (surface) {
              gsap.fromTo(surface,
                { x: -6 },
                { x: 0, duration: 0.42, ease: 'elastic.out(1.2, 0.25)', clearProps: 'transform' }
              );
            }
            if (lockImg) {
              gsap.fromTo(lockImg,
                { rotation: -14 },
                { rotation: 0, duration: 0.48, ease: 'elastic.out(1.2, 0.28)', clearProps: 'transform' }
              );
            }
          }
          return;
        }
        hidePebbleTooltip();
        openDeckByIndex(idx);
      });
    });

    // --- 60FPS HTML5 Canvas Isometric Flowing River Simulation ---
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 1440;
    const H = 810;
    // Isometric river flow unit vector (+28.4 deg: top-left -> bottom-right)
    const UX = 0.8796;
    const UY = 0.4756;
    // Cross-river unit vector (Near Bank -> Far Bank)
    const NX = 0.4756;
    const NY = -0.8796;
    const ISO_ANG = Math.atan2(UY, UX);

    // Pre-generate fluid streamlines across the channel width
    const streamlines = [];
    const numLanes = 44;
    for (let i = 0; i < numLanes; i++) {
      const qNorm = i / (numLanes - 1); // 0 near bottom-left bank, 1 near top-right bank
      const q = -425 + qNorm * 805;
      streamlines.push({
        q,
        speed: 48 + Math.sin(qNorm * Math.PI) * 44 + (i % 5) * 5,
        dashLen: 55 + (i % 7) * 24,
        gapLen: 85 + ((i * 3) % 6) * 26,
        phase: (i * 73) % 320,
        amp: 4 + (i % 4) * 2.2,
        freq: 0.0065 + (i % 3) * 0.0018,
        alpha: 0.14 + Math.sin(qNorm * Math.PI) * 0.17,
        width: (i % 4 === 0) ? 2.5 : 1.5,
        bright: (i % 5 === 0)
      });
    }

    // Specular sunlit sparkles & drifting botanical leaves
    const sparkles = [];
    for (let i = 0; i < 34; i++) {
      sparkles.push({
        p: (i * 53) % 1750 - 120,
        q: -380 + ((i * 97) % 720),
        speed: 34 + (i % 5) * 9,
        twinkleOffset: i * 0.7
      });
    }

    const leaves = [];
    const leafColors = ['#77c29c', '#b1e7cc', '#ffcfa5', '#d8f3e6'];
    for (let i = 0; i < 9; i++) {
      leaves.push({
        p: (i * 210) % 1800 - 150,
        q: -340 + ((i * 137) % 650),
        speed: 38 + (i % 4) * 11,
        spin: i * 0.8,
        color: leafColors[i % leafColors.length]
      });
    }

    const unlockSplashes = [];
    window.__triggerRiverUnlockSplash = function(deckIdx) {
      const d = RIVER_DECKS[deckIdx];
      if (!d) return;
      unlockSplashes.push({ x: d.x, y: d.y, startTime: performance.now() });
    };

    // Map river coordinates (p along flow, q across river) -> screen (x, y) with smooth deflection around pebbles
    function riverToScreen(p, q, tSec) {
      const wave = Math.sin(p * 0.007 - tSec * 1.6 + q * 0.01) * 5.5;
      let x = UX * p + NX * (q + wave);
      let y = UY * p + NY * (q + wave);

      // Smooth laminar potential-flow deflection around the 7 stepping stones (C-infinity smooth, zero kinks)
      for (let s = 0; s < RIVER_DECKS.length; s++) {
        const st = RIVER_DECKS[s];
        const dx = x - st.x;
        const dy = (y - st.y) * 1.52; // Isometric vertical foreshortening compensation
        const distSq = dx * dx + dy * dy;
        if (distSq < 26000) {
          const crossDot = dx * NX + (y - st.y) * NY;
          const deflect = Math.tanh(crossDot / 30) * 26 * Math.exp(-distSq / 6200);
          x += NX * deflect;
          y += NY * deflect;
        }
      }
      return { x, y };
    }

    let rafId = null;
    let isRunning = false;

    function drawRiverFrame(nowMs) {
      const t = nowMs * 0.001;

      // 1. Cross-channel depth gradient (Near Shore -> Deep Midstream -> Far Shore)
      const grad = ctx.createLinearGradient(220, 690, 1140, 125);
      grad.addColorStop(0.0, '#2b8f74');
      grad.addColorStop(0.16, '#1a6e58');
      grad.addColorStop(0.48, '#0f4c3c');
      grad.addColorStop(0.82, '#1a6e58');
      grad.addColorStop(1.0, '#2e9478');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // 2. Soft Undulating Isometric Caustic Current Ribbons
      for (let b = 0; b < 7; b++) {
        const qBand = -330 + b * 108 + Math.sin(t * 0.65 + b) * 14;
        ctx.beginPath();
        for (let p = -140; p <= 1780; p += 80) {
          const wob = Math.sin(p * 0.0055 - t * 1.25 + b * 1.4) * 18;
          const bx = UX * p + NX * (qBand + wob);
          const by = UY * p + NY * (qBand + wob);
          if (p === -140) ctx.moveTo(bx, by);
          else ctx.lineTo(bx, by);
        }
        ctx.strokeStyle = (b % 2 === 0) ? 'rgba(82, 183, 152, 0.13)' : 'rgba(177, 231, 204, 0.09)';
        ctx.lineWidth = 38;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      // 3. Stone Submerged Shallows Halos + Downstream V-Wakes + Upstream Foam Caps
      for (let s = 0; s < RIVER_DECKS.length; s++) {
        const st = RIVER_DECKS[s];
        const status = getPebbleStatus(s);
        const isHero = (status === 'newly-unlocked');
        const rxBase = isHero ? 104 : (status === 'viewed' ? 88 : 80);
        const ryBase = isHero ? 62 : (status === 'viewed' ? 53 : 48);

        // Submerged turquoise shoal around stone base
        ctx.save();
        ctx.translate(st.x, st.y + 8);
        ctx.beginPath();
        ctx.ellipse(0, 0, rxBase * 1.18, ryBase * 1.16, 0, 0, Math.PI * 2);
        ctx.fillStyle = isHero ? 'rgba(119, 194, 156, 0.34)' : 'rgba(82, 183, 152, 0.20)';
        ctx.fill();
        ctx.restore();

        // Downstream V-Wake arms trailing toward bottom-right (ISO_ANG)
        ctx.save();
        ctx.translate(st.x, st.y + 6);
        ctx.rotate(ISO_ANG);
        for (let arm = -1; arm <= 1; arm += 2) {
          ctx.beginPath();
          ctx.moveTo(rxBase * 0.35, arm * ryBase * 0.52);
          const wakeLen = 82 + Math.sin(t * 2.6 + s + arm) * 10;
          ctx.quadraticCurveTo(
            rxBase * 0.78,
            arm * (ryBase * 0.76 + Math.sin(t * 3.1 + s) * 3),
            rxBase * 0.45 + wakeLen,
            arm * (ryBase * 0.96)
          );
          ctx.strokeStyle = isHero ? 'rgba(216, 243, 230, 0.52)' : 'rgba(177, 231, 204, 0.30)';
          ctx.lineWidth = isHero ? 2.6 : 1.8;
          ctx.lineCap = 'round';
          ctx.stroke();
        }

        // Upstream Bow Foam Crescent (top-left edge where river current hits the stone)
        const foamPulse = Math.sin(t * 3.2 + s * 1.3) * 2.5;
        ctx.beginPath();
        ctx.ellipse(-8, 0, rxBase * 0.88 + foamPulse, ryBase * 0.82 + foamPulse * 0.6, 0, Math.PI * 0.68, Math.PI * 1.32);
        ctx.strokeStyle = isHero ? 'rgba(255, 255, 255, 0.78)' : 'rgba(216, 243, 230, 0.48)';
        ctx.lineWidth = isHero ? 3.5 : 2.4;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.restore();

        // Extra Concentric Water Rings on Newly Unlocked Stone
        if (isHero) {
          for (let r = 0; r < 3; r++) {
            const prog = ((t * 0.55 + r / 3) % 1);
            const rxRing = rxBase * (0.98 + prog * 0.68);
            const ryRing = ryBase * (0.98 + prog * 0.68);
            const alphaRing = (1 - prog) * 0.58;
            ctx.beginPath();
            ctx.ellipse(st.x, st.y + 6, rxRing, ryRing, 0, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(216, 243, 230, ${alphaRing.toFixed(3)})`;
            ctx.lineWidth = 2.4 - prog * 1.2;
            ctx.stroke();
          }
        }
      }

      // 4. Celebratory Unlock Water Splash Rings
      for (let k = unlockSplashes.length - 1; k >= 0; k--) {
        const sp = unlockSplashes[k];
        const age = (nowMs - sp.startTime) / 1400;
        if (age >= 1) {
          unlockSplashes.splice(k, 1);
          continue;
        }
        for (let ring = 0; ring < 3; ring++) {
          const rp = Math.max(0, Math.min(1, age * 1.25 - ring * 0.14));
          if (rp <= 0 || rp >= 1) continue;
          ctx.beginPath();
          ctx.ellipse(sp.x, sp.y + 6, 92 + rp * 115, 56 + rp * 70, 0, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 255, 255, ${((1 - rp) * 0.75).toFixed(3)})`;
          ctx.lineWidth = 3 * (1 - rp);
          ctx.stroke();
        }
      }

      // 5. Animated Fluid Streamlines Deflecting Around Stones
      ctx.save();
      for (let i = 0; i < streamlines.length; i++) {
        const sl = streamlines[i];
        ctx.beginPath();
        for (let p = -120; p <= 1760; p += 18) {
          const pt = riverToScreen(p, sl.q, t);
          if (p === -120) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.setLineDash([sl.dashLen, sl.gapLen]);
        ctx.lineDashOffset = -(t * sl.speed + sl.phase);
        ctx.strokeStyle = sl.bright
          ? `rgba(255, 255, 255, ${(sl.alpha * 1.15).toFixed(3)})`
          : `rgba(177, 231, 204, ${sl.alpha.toFixed(3)})`;
        ctx.lineWidth = sl.width;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.restore();

      // 6. Sunlit Specular Water Glints
      for (let i = 0; i < sparkles.length; i++) {
        const sp = sparkles[i];
        const curP = ((sp.p + t * sp.speed) % 1860 + 1860) % 1860 - 120;
        const twinkle = Math.max(0, Math.sin(t * 2.7 + sp.twinkleOffset));
        if (twinkle < 0.15) continue;
        const pt = riverToScreen(curP, sp.q, t);
        ctx.save();
        ctx.translate(pt.x, pt.y);
        ctx.rotate(ISO_ANG);
        ctx.beginPath();
        ctx.ellipse(0, 0, 5.5 * twinkle, 1.8 * twinkle, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${(twinkle * 0.58).toFixed(3)})`;
        ctx.fill();
        ctx.restore();
      }

      // 7. Gently Drifting Flat-Vector River Leaves
      for (let i = 0; i < leaves.length; i++) {
        const lf = leaves[i];
        const curP = ((lf.p + t * lf.speed) % 1920 + 1920) % 1920 - 150;
        const pt = riverToScreen(curP, lf.q, t);
        ctx.save();
        ctx.translate(pt.x, pt.y);
        ctx.rotate(ISO_ANG + Math.sin(t * 1.4 + lf.spin) * 0.45);
        ctx.beginPath();
        ctx.ellipse(0, 0, 7.5, 3.2, 0, 0, Math.PI * 2);
        ctx.fillStyle = lf.color;
        ctx.globalAlpha = 0.72;
        ctx.fill();
        ctx.restore();
      }
    }

    function tick(now) {
      if (!isRunning) return;
      drawRiverFrame(now);
      rafId = requestAnimationFrame(tick);
    }

    function startRiverAnimation() {
      if (isRunning) return;
      isRunning = true;
      drawRiverFrame(performance.now());
      rafId = requestAnimationFrame(tick);
    }

    function stopRiverAnimation() {
      isRunning = false;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    // Draw initial crisp frame immediately
    drawRiverFrame(performance.now());

    window.__startRiverAnimation = startRiverAnimation;
    window.__stopRiverAnimation = stopRiverAnimation;
  }

  // ==========================================================================
  // --- Pre-Read Completed State & Hopping Persona Icons Animation System ---
  // ==========================================================================

  const HOPPING_PALETTES = [
    { bg: '#ffffff', border: '#125332', icon: '#125332', shadow: 'rgba(18, 83, 50, 0.25)' }, // dark green
    { bg: '#ffffff', border: '#427d5f', icon: '#427d5f', shadow: 'rgba(66, 125, 95, 0.22)' }, // sage green
    { bg: '#d8f3e6', border: '#2e7d58', icon: '#125332', shadow: 'rgba(18, 83, 50, 0.20)' }, // mint
    { bg: '#fff6ef', border: '#e07a3c', icon: '#a64a13', shadow: 'rgba(224, 122, 60, 0.22)' }, // peach
    { bg: '#f4f1ff', border: '#705ec9', icon: '#4c3a9d', shadow: 'rgba(112, 94, 201, 0.22)' }, // lavender
    { bg: '#fff0ef', border: '#d8524d', icon: '#9b2622', shadow: 'rgba(216, 82, 77, 0.22)' },  // rose
    { bg: '#fffbe8', border: '#c7841e', icon: '#82510b', shadow: 'rgba(199, 132, 30, 0.22)' }, // amber
    { bg: '#eef8f5', border: '#2f8f7c', icon: '#1b5e51', shadow: 'rgba(47, 143, 124, 0.22)' }  // teal
  ];

  let hoppingLoopTimer = null;
  let isHoppingLoopRunning = false;
  let personaIconPool = [];

  function getNextPersonaIconKey() {
    if (personaIconPool.length === 0) {
      personaIconPool = Object.keys(personaIconSvgs);
      for (let i = personaIconPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = personaIconPool[i];
        personaIconPool[i] = personaIconPool[j];
        personaIconPool[j] = temp;
      }
    }
    return personaIconPool.pop() || 'compass';
  }

  function isAllExercisesComplete() {
    return RIVER_DECKS.length > 0 && RIVER_DECKS.every(d => journey.viewedDecks.has(d.index));
  }

  function completeAllExercises() {
    RIVER_DECKS.forEach(d => {
      journey.viewedDecks.add(d.index);
    });
    journey.unlockedUpTo = RIVER_DECKS.length - 1;
    renderRiverPebbleStates();
    if (state.view === 'hub') {
      updatePreReadCompletedState(true);
    }
  }

  function updatePreReadCompletedState(isComplete) {
    const badge = document.getElementById('prereadCompletionBadge');
    if (isComplete) {
      if (badge) {
        badge.classList.add('is-visible');
        badge.setAttribute('aria-hidden', 'false');
        if (typeof gsap !== 'undefined') {
          gsap.fromTo(badge,
            { y: -26, opacity: 0, scale: 0.94 },
            { y: 0, opacity: 1, scale: 1, duration: 0.65, ease: 'back.out(1.8)', overwrite: 'auto' }
          );
        }
      }
      startHoppingPersonaLoop();
    } else {
      if (badge) {
        badge.classList.remove('is-visible');
        badge.setAttribute('aria-hidden', 'true');
        badge.style.opacity = '0';
      }
      stopHoppingPersonaLoop();
    }
  }

  function getHoppingWaypoints(jitter = {}) {
    const stage = document.getElementById('completedIconStage');
    const sRect = stage ? stage.getBoundingClientRect() : null;
    const W = (sRect && sRect.width) || 1440;
    const H = (sRect && sRect.height) || 810;
    const jx = (jitter && jitter.dx) || 0;
    const jy = (jitter && jitter.dy) || 0;

    // 1. Bottom Left Corner Spawn point (emerges right from bottom left corner)
    const pStart = {
      x: W * 0.045 + jx,
      y: H * 0.925 + jy
    };

    // 2. Near Bank Trailhead Flagstone stepping down to the river
    const pTrailhead = {
      x: W * 0.105 + jx * 0.6,
      y: H * 0.81 + jy * 0.6,
      isFlagstone: true
    };

    // 3. Stepping stones 1 to 6 (read from DOM or fallback)
    const stonePoints = [];
    const fallbackRatios = [
      { xr: 0.1889 + 0.045, yr: 0.7111 + 0.05 },
      { xr: 0.3201 + 0.045, yr: 0.6370 + 0.05 },
      { xr: 0.4486 + 0.045, yr: 0.5593 + 0.05 },
      { xr: 0.5729 + 0.045, yr: 0.4741 + 0.05 },
      { xr: 0.6931 + 0.045, yr: 0.3840 + 0.05 },
      { xr: 0.8111 + 0.045, yr: 0.2889 + 0.05 }
    ];

    for (let i = 0; i < 6; i++) {
      const pebble = document.querySelector(`.river-pebble[data-deck-index="${i}"]`);
      if (pebble && sRect) {
        const pRect = pebble.getBoundingClientRect();
        stonePoints.push({
          x: (pRect.left + pRect.width / 2) - sRect.left + jx * 0.35,
          y: (pRect.top + pRect.height / 2) - sRect.top + jy * 0.35,
          isStone: true,
          deckIndex: i
        });
      } else {
        const fb = fallbackRatios[i] || { xr: 0.5, yr: 0.5 };
        stonePoints.push({
          x: W * fb.xr + jx * 0.35,
          y: H * fb.yr + jy * 0.35,
          isStone: true,
          deckIndex: i
        });
      }
    }

    // 4. Far Bank Destination Flagstones climbing up the far shore
    const pFlag1 = {
      x: W * 0.896 + jx * 0.3,
      y: H * 0.193 + jy * 0.3,
      isFlagstone: true
    };
    const pFlag2 = {
      x: W * 0.955 + jx * 0.2,
      y: H * 0.109 + jy * 0.2,
      isFlagstone: true
    };

    // 5. Offscreen Exit in the Top Right
    const pExit = {
      x: W * 1.05 + 24,
      y: H * 0.02 - 12
    };

    return [
      pStart,
      pTrailhead,
      ...stonePoints,
      pFlag1,
      pFlag2,
      pExit
    ];
  }

  function createHopLandingRipple(x, y, color = '#52b798') {
    const stage = document.getElementById('completedIconStage');
    if (!stage) return;
    const ripple = document.createElement('div');
    ripple.className = 'completed-hop-ripple';
    ripple.style.left = `${Math.round(x)}px`;
    ripple.style.top = `${Math.round(y)}px`;
    ripple.style.borderColor = color;
    stage.appendChild(ripple);

    if (typeof gsap !== 'undefined') {
      gsap.fromTo(ripple,
        { scale: 0.25, opacity: 0.65 },
        { scale: 1.6, opacity: 0, duration: 0.38, ease: 'power1.out', onComplete: () => {
          if (ripple.parentNode) ripple.remove();
        }}
      );
    } else {
      setTimeout(() => { if (ripple.parentNode) ripple.remove(); }, 400);
    }
  }

  function triggerStonePebbleReaction(deckIndex) {
    const pebble = document.querySelector(`.river-pebble[data-deck-index="${deckIndex}"] .pebble-surface`);
    if (pebble && typeof gsap !== 'undefined') {
      gsap.fromTo(pebble,
        { y: 3 },
        { y: 0, duration: 0.24, ease: 'back.out(2.5)', overwrite: 'auto' }
      );
    }
  }

  function spawnSingleHoppingIcon(jitter = {}) {
    const stage = document.getElementById('completedIconStage');
    if (!stage || typeof gsap === 'undefined') return;

    const iconKey = getNextPersonaIconKey();
    const iconSvg = getPersonaIconSvg(iconKey);
    const pal = HOPPING_PALETTES[Math.floor(Math.random() * HOPPING_PALETTES.length)];

    const el = document.createElement('div');
    el.className = 'completed-hopping-icon';
    el.style.borderColor = pal.border;
    el.style.background = pal.bg;
    el.style.boxShadow = `0 6px 16px ${pal.shadow}`;
    el.setAttribute('data-icon', iconKey);
    el.innerHTML = `<div class="hopping-icon-inner" style="color: ${pal.icon};">${iconSvg}</div>`;
    stage.appendChild(el);

    const waypoints = getHoppingWaypoints(jitter);
    const startPt = waypoints[0];

    gsap.set(el, {
      x: startPt.x,
      y: startPt.y,
      scale: 0,
      opacity: 0,
      rotation: -10
    });

    const tl = gsap.timeline({
      onComplete: () => {
        if (el.parentNode) el.remove();
      }
    });

    // Pop into existence at bottom-left corner
    tl.to(el, {
      scale: 1,
      opacity: 1,
      duration: 0.24,
      ease: 'back.out(2)'
    });

    tl.add(() => {
      createHopLandingRipple(startPt.x, startPt.y, '#427d5f');
    }, 0.08);

    // Sequential hop arcs
    for (let i = 1; i < waypoints.length; i++) {
      const prev = waypoints[i - 1];
      const curr = waypoints[i];
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const dist = Math.hypot(dx, dy);

      const baseDur = Math.min(0.46, Math.max(0.30, dist * 0.0016)) * (jitter.speedMult || 1);
      const arcHeight = 36 + Math.min(32, dist * 0.12) + (jitter.arcBonus || 0);
      const midY = Math.min(prev.y, curr.y) - arcHeight;
      const rotDelta = (dx > 0 ? 1 : -1) * (14 + Math.random() * 10);

      tl.to(el, {
        x: curr.x,
        duration: baseDur,
        ease: 'power1.inOut'
      });

      tl.to(el, {
        y: midY,
        scaleX: 0.88,
        scaleY: 1.15,
        rotation: `+=${rotDelta * 0.5}`,
        duration: baseDur * 0.48,
        ease: 'power2.out'
      }, `<`);

      tl.to(el, {
        y: curr.y,
        scaleX: 1.14,
        scaleY: 0.86,
        rotation: `+=${rotDelta * 0.5}`,
        duration: baseDur * 0.52,
        ease: 'power2.in',
        onComplete: () => {
          createHopLandingRipple(curr.x, curr.y, curr.isStone ? pal.border : '#52b798');
          if (curr.isStone && typeof curr.deckIndex === 'number') {
            triggerStonePebbleReaction(curr.deckIndex);
          }
        }
      });

      tl.to(el, {
        scaleX: 1,
        scaleY: 1,
        duration: 0.08,
        ease: 'power1.out'
      });
    }

    // Exit offscreen top right
    tl.to(el, {
      opacity: 0,
      scale: 0.75,
      duration: 0.18,
      ease: 'power1.in'
    });
  }

  function launchHoppingWave() {
    if (!isAllExercisesComplete() || state.view !== 'hub') {
      isHoppingLoopRunning = false;
      return;
    }

    isHoppingLoopRunning = true;

    // Variety: alone (1 icon) vs packs (2 to 5 icons)
    const roll = Math.random();
    let packSize = 1;
    if (roll > 0.75) {
      packSize = Math.floor(Math.random() * 2) + 4; // 4 or 5 icons (large pack)
    } else if (roll > 0.45) {
      packSize = Math.floor(Math.random() * 2) + 2; // 2 or 3 icons (small pack)
    } else {
      packSize = 1; // alone
    }

    for (let i = 0; i < packSize; i++) {
      const staggerDelay = i * (0.16 + Math.random() * 0.12);
      const jitter = {
        dx: (Math.random() - 0.5) * 26,
        dy: (Math.random() - 0.5) * 18,
        arcBonus: (Math.random() - 0.5) * 16,
        speedMult: 0.94 + Math.random() * 0.12
      };
      setTimeout(() => {
        if (state.view === 'hub' && isAllExercisesComplete()) {
          spawnSingleHoppingIcon(jitter);
        }
      }, staggerDelay * 1000);
    }

    // Interval before launching next wave
    const delay = (packSize > 1 ? (2.2 + Math.random() * 1.6) : (1.2 + Math.random() * 1.2)) * 1000;
    hoppingLoopTimer = setTimeout(launchHoppingWave, delay);
  }

  function startHoppingPersonaLoop() {
    if (isHoppingLoopRunning) return;
    if (!isAllExercisesComplete() || state.view !== 'hub') return;
    if (hoppingLoopTimer) clearTimeout(hoppingLoopTimer);
    hoppingLoopTimer = setTimeout(launchHoppingWave, 250);
  }

  function stopHoppingPersonaLoop() {
    isHoppingLoopRunning = false;
    if (hoppingLoopTimer) {
      clearTimeout(hoppingLoopTimer);
      hoppingLoopTimer = null;
    }
    const stage = document.getElementById('completedIconStage');
    if (stage) {
      if (typeof gsap !== 'undefined') gsap.killTweensOf(stage.children);
      stage.innerHTML = '';
    }
  }

  // --- Initialize Presentation ---
  let isInitialized = false;

  async function loadSteppingStonesConfig() {
    try {
      const res = await fetch("stepping-stones-config.json");
      if (!res.ok) return;
      const config = await res.json();
      if (Array.isArray(config)) {
        config.forEach(item => {
          if (typeof item.index === "number" && RIVER_DECKS[item.index]) {
            if (item.title) RIVER_DECKS[item.index].title = item.title;
            if (item.desc) RIVER_DECKS[item.index].desc = item.desc;
          }
        });
        const pebbles = document.querySelectorAll('.river-pebble');
        pebbles.forEach(pebble => {
          const idx = parseInt(pebble.getAttribute('data-deck-index'), 10);
          const deck = RIVER_DECKS[idx];
          if (!deck) return;
          const titleEl = pebble.querySelector('.pebble-deck-title');
          if (titleEl) titleEl.textContent = deck.title;
        });
        renderRiverPebbleStates();
      }
    } catch (e) {
      // Gracefully fall back to built-in RIVER_DECKS if offline or blocked by CORS
    }
  }

  function initPresentation() {
    if (isInitialized) return;
    queryDOMElements();
    if (!viewHub) return;
    isInitialized = true;
    autoFitPresentationStage();

    setupNavigationControls();
    setupIntroInteractions();
    setupRiverScene();
    setupPersonaCursorCompanion();
    updateHUD();
    setupLandingWidgets();
    setupDebateDrawers();
    setupSpectrumWidget();
    setupShadowAiQuiz();
    setupPlaygroundOfPossibilities();
    setupTriangleWidget();
    setupGreyZoneCaseDesk();
    loadSteppingStonesConfig();

    // Export test hooks
    window.__presentation = {
      autoFitPresentationStage,
      goToIntro,
      goToLanding,
      goToHub,
      goToSpoke,
      goToSlide,
      nextSlide,
      prevSlide,
      resetJourneyProgress,
      openDeckByIndex,
      completeAllExercises,
      isAllExercisesComplete,
      triggerHoppingWave: launchHoppingWave,
      getJourneyState: () => ({
        unlockedUpTo: journey.unlockedUpTo,
        viewedDecks: Array.from(journey.viewedDecks),
        statuses: RIVER_DECKS.map(d => ({ index: d.index, title: d.title, status: getPebbleStatus(d.index) }))
      }),
      setNodePosition: window.__setNodePosition,
      setNodeRadius: window.__setNodeRadius,
      playOnboardingAnimation: window.__playOnboardingAnimation,
      killOnboardingAnimation: window.__killOnboardingAnimation,
      introResetPosition: window.__introResetPosition,
      demonstrateQuizWidget,
      killQuizDemo,
      demonstratePriorityRanking,
      killPriorityDemo,
      reorderPriorityItem: (from, to) => { if (typeof window.__reorderPriorityItem === 'function') window.__reorderPriorityItem(from, to); },
      getPriorityItems: () => { if (typeof window.__getPriorityItems === 'function') return window.__getPriorityItems(); return []; },
      getUserScores: () => ({
        compass: state.userCompassData || null,
        priorities: state.userPriorityData || null
      }),
      setupPlaygroundIntro,
      demonstratePlaygroundWidget,
      killPlaygroundDemo,
      demonstrateSpectrumWidget,
      killSpectrumDemo,
      demonstrateTriangleWidget,
      killTriangleDemo,
      demonstrateGreyZoneDesk,
      killGreyZoneDemo,
      killAllChapterDemos,
      revealQuizAnswers: () => { if (typeof window.__quizRevealAnswers === 'function') window.__quizRevealAnswers(); },
      triggerShrugHorizontalWipe: () => { if (typeof window.__triggerShrugHorizontalWipe === 'function') window.__triggerShrugHorizontalWipe(); },
      triggerAutumnShrugTumble: () => { if (typeof window.__triggerShrugHorizontalWipe === 'function') window.__triggerShrugHorizontalWipe(); },
      getCompanionState: () => {
        const comp = document.getElementById('personaCursorCompanion');
        const iconWrap = document.getElementById('companionIconWrap');
        return {
          exists: !!comp,
          visible: comp ? comp.classList.contains('visible') : false,
          hasIcon: iconWrap ? iconWrap.innerHTML.trim().length > 0 : false,
          transform: comp ? comp.style.transform : ''
        };
      },
      getState: () => ({ ...state })
    };
    window.__presentationLoaded = true;

    // Start on the Workshop Intro & Welcome Page
    goToIntro();
  }

  window.initWaythroughPresentation = initPresentation;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPresentation);
  } else {
    initPresentation();
  }

})();
