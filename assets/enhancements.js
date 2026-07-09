/* ═══════════════════════════════════════════════════════════════════════════
   Kivora Learning — Feature Enhancements
   Loaded AFTER app.js. Self-contained: injects its own styles + overlay modal.

   Adds:
     1. Login gate for worlds / activity player
     2. Centered ~6in login modal (CSS)
     3. Interactive "Test Your Knowledge" quizzes
     4. Workable Creativity Hub tools (draw / music / story / build)
     5. Special Needs accessibility toolkit + social stories + calm corner
     6. Full "Learning Tips for Parents" article reader
     7. Clean, de-duplicated on-screen colouring studio
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── tiny helpers ─────────────────────────────────────────────── */
  var LS = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) { if (k === 'style') e.style.cssText = attrs[k]; else e.setAttribute(k, attrs[k]); }
    if (html != null) e.innerHTML = html;
    return e;
  }
  function isLoggedIn() {
    try { return typeof getActiveChild === 'function' && !!getActiveChild(); } catch (e) { return false; }
  }

  /* ── shared toast (reuse app's showToast if present) ──────────── */
  function toast(msg) {
    if (typeof window.showToast === 'function') { window.showToast(msg); return; }
    var t = el('div', { style: 'position:fixed;left:50%;bottom:32px;transform:translateX(-50%);z-index:20000;background:#1e293b;color:#fff;padding:12px 20px;border-radius:14px;font-weight:700;font-size:.9rem;box-shadow:0 8px 30px rgba(0,0,0,.3)' }, msg);
    document.body.appendChild(t);
    setTimeout(function () { t.style.transition = 'opacity .4s'; t.style.opacity = '0'; setTimeout(function () { t.remove(); }, 400); }, 2200);
  }

  /* ══════════════════════════════════════════════════════════════
     STYLES
     ══════════════════════════════════════════════════════════════ */
  var css = document.createElement('style');
  css.id = 'kivora-enhance-css';
  css.textContent = [
    /* 6-inch centered auth modal */
    '#modalContent:has(> .modal-page.ep-auth.active){min-height:100vh;display:flex;align-items:flex-start;justify-content:center;background:linear-gradient(135deg,#EAF4FE 0%,#F5EEFA 50%,#FFF0F8 100%);padding:56px 16px 40px;}',
    '.dark #modalContent:has(> .modal-page.ep-auth.active){background:linear-gradient(135deg,#0f172a,#111c33);}',
    '#modalContent > .modal-page.ep-auth.active{width:100%;max-width:560px;height:max-content;background:#fff;border-radius:24px;box-shadow:0 18px 60px rgba(30,41,59,.22);padding:34px 34px 30px;}',
    '.dark #modalContent > .modal-page.ep-auth.active{background:#1e293b;}',
    /* overlay modal */
    '.kv-ov{position:fixed;inset:0;z-index:15000;background:rgba(15,23,42,.62);backdrop-filter:blur(4px);display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:40px 14px;}',
    '.kv-card{width:100%;max-width:560px;background:#fff;border-radius:24px;box-shadow:0 20px 70px rgba(15,23,42,.3);padding:26px;position:relative;font-family:Nunito,system-ui,sans-serif;animation:kvpop .25s ease;}',
    '.kv-card.wide{max-width:760px;}',
    '.dark .kv-card{background:#1e293b;color:#e2e8f0;}',
    '@keyframes kvpop{from{transform:translateY(14px) scale(.98);opacity:0}to{transform:none;opacity:1}}',
    '.kv-x{position:absolute;top:14px;right:14px;width:38px;height:38px;border-radius:50%;border:none;background:#f1f5f9;color:#334155;font-size:1.1rem;cursor:pointer;font-weight:800;line-height:1;}',
    '.kv-x:hover{background:#ff4e8b;color:#fff;}',
    '.kv-h{font-family:"Baloo 2",cursive;font-weight:800;color:#1e293b;}',
    '.dark .kv-h{color:#fff;}',
    '.kv-btn{border:none;cursor:pointer;font-family:inherit;font-weight:800;border-radius:14px;padding:13px 20px;font-size:1rem;color:#fff;background:linear-gradient(to right,#7C3AED,#4F46E5);transition:transform .12s,opacity .2s;}',
    '.kv-btn:hover{opacity:.9;transform:translateY(-1px);}',
    '.kv-btn.ghost{background:#f1f5f9;color:#334155;}',
    '.dark .kv-btn.ghost{background:#334155;color:#e2e8f0;}',
    /* quiz */
    '.kv-opt{display:block;width:100%;text-align:left;margin:8px 0;padding:14px 16px;border-radius:14px;border:2px solid #e2e8f0;background:#fff;font-family:inherit;font-size:1rem;font-weight:700;color:#1e293b;cursor:pointer;transition:all .15s;}',
    '.dark .kv-opt{background:#0f172a;border-color:#334155;color:#e2e8f0;}',
    '.kv-opt:hover{border-color:#7C3AED;background:#f5f3ff;}',
    '.dark .kv-opt:hover{background:#312e81;}',
    '.kv-opt.right{border-color:#22C55E;background:#dcfce7;color:#166534;}',
    '.kv-opt.wrong{border-color:#ef4444;background:#fee2e2;color:#991b1b;}',
    '.kv-opt:disabled{cursor:default;}',
    '.kv-bar{height:8px;border-radius:99px;background:#ede9fe;overflow:hidden;margin-bottom:6px;}',
    '.kv-bar>i{display:block;height:100%;background:linear-gradient(to right,#7C3AED,#FF4E8B);transition:width .3s;}',
    '.kv-explain{margin-top:12px;padding:12px 14px;border-radius:14px;background:#fffbeb;border:1px solid #fde68a;font-size:.9rem;font-weight:600;color:#92400e;line-height:1.5;}',
    '.dark .kv-explain{background:#3b2f0b;border-color:#a16207;color:#fde68a;}',
    /* creativity picker grid */
    '.kv-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px;}',
    '.kv-tile{border:none;cursor:pointer;font-family:inherit;text-align:left;padding:16px;border-radius:18px;color:#fff;font-weight:800;transition:transform .12s;}',
    '.kv-tile:hover{transform:translateY(-3px);}',
    '.kv-tile small{display:block;font-weight:600;opacity:.9;font-size:.78rem;margin-top:4px;}',
    /* palette swatches */
    '.kv-sw{width:34px;height:34px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 1px #cbd5e1;cursor:pointer;}',
    '.kv-sw.sel{box-shadow:0 0 0 3px #7C3AED;transform:scale(1.12);}',
    /* music pads */
    '.kv-pad{flex:1;min-width:38px;height:120px;border:none;border-radius:12px;cursor:pointer;color:#fff;font-weight:800;font-size:.8rem;display:flex;align-items:flex-end;justify-content:center;padding-bottom:10px;transition:transform .06s,filter .1s;}',
    '.kv-pad:active{transform:scale(.95);filter:brightness(1.25);}',
    /* accessibility toggles */
    '.kv-tog{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 16px;border-radius:14px;background:#f8fafc;margin:8px 0;}',
    '.dark .kv-tog{background:#0f172a;}',
    '.kv-tog b{font-size:.92rem;color:#1e293b;}.dark .kv-tog b{color:#e2e8f0;}',
    '.kv-tog small{display:block;font-weight:600;color:#64748b;font-size:.76rem;}',
    '.kv-switch{position:relative;width:50px;height:28px;border-radius:99px;background:#cbd5e1;border:none;cursor:pointer;flex:0 0 auto;transition:background .2s;}',
    '.kv-switch.on{background:#7C3AED;}',
    '.kv-switch i{position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#fff;transition:transform .2s;}',
    '.kv-switch.on i{transform:translateX(22px);}',
    /* build grid */
    '.kv-build{display:grid;gap:2px;background:#e2e8f0;border-radius:10px;overflow:hidden;touch-action:none;}',
    '.kv-build>i{background:#fff;aspect-ratio:1;cursor:pointer;}',
    /* breathing */
    '@keyframes kvbreathe{0%,100%{transform:scale(.55);background:#a5b4fc}45%,55%{transform:scale(1);background:#7C3AED}}',
    '.kv-breathe{width:150px;height:150px;border-radius:50%;margin:18px auto;animation:kvbreathe 8s ease-in-out infinite;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-family:"Baloo 2",cursive;}',
    /* article */
    '.kv-article{font-size:1rem;line-height:1.75;color:#334155;}',
    '.dark .kv-article{color:#cbd5e1;}',
    '.kv-article h3{font-family:"Baloo 2",cursive;font-weight:800;color:#1e293b;margin:20px 0 8px;font-size:1.15rem;}',
    '.dark .kv-article h3{color:#fff;}',
    '.kv-article p{margin:0 0 12px;}',
    '.kv-article li{margin:5px 0;}',
    /* body accessibility modes */
    'body.kv-dyslexic,body.kv-dyslexic *{font-family:"Comic Sans MS","Trebuchet MS",Verdana,sans-serif !important;letter-spacing:.02em;word-spacing:.12em;}',
    'body.kv-bigtext{font-size:118%;}',
    'body.kv-contrast{filter:contrast(1.32) saturate(1.15);}',
    'body.kv-nomotion *{animation:none !important;transition:none !important;scroll-behavior:auto !important;}',
    /* clickable enhancement affordance */
    '.kv-click{cursor:pointer;}'
  ].join('\n');
  document.head.appendChild(css);

  /* ══════════════════════════════════════════════════════════════
     OVERLAY MODAL
     ══════════════════════════════════════════════════════════════ */
  var _ov = null;
  function closeOverlay() {
    if (_ov) { _ov.remove(); _ov = null; document.body.style.overflow = ''; }
    if (window._kvAudioStop) { try { window._kvAudioStop(); } catch (e) {} }
  }
  function openOverlay(bodyHtml, opts) {
    opts = opts || {};
    closeOverlay();
    _ov = el('div', { class: 'kv-ov' });
    var card = el('div', { class: 'kv-card' + (opts.wide ? ' wide' : '') });
    card.appendChild(el('button', { class: 'kv-x', 'aria-label': 'Close' }, '✕')).onclick = closeOverlay;
    var body = el('div');
    body.innerHTML = bodyHtml;
    card.appendChild(body);
    _ov.appendChild(card);
    _ov.addEventListener('click', function (e) { if (e.target === _ov) closeOverlay(); });
    document.body.appendChild(_ov);
    document.body.style.overflow = 'hidden';
    return body;
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeOverlay(); });
  window.kivoraCloseOverlay = closeOverlay;

  /* ══════════════════════════════════════════════════════════════
     1. LOGIN GATE FOR WORLDS / PLAYER
     ══════════════════════════════════════════════════════════════ */
  function promptLogin(afterSlug) {
    window._kivoraPendingPlayer = afterSlug || null;
    closeOverlay();
    if (typeof openPage === 'function') openPage('login');
    toast('🔐 Please log in to enter the learning worlds');
  }

  // Wrap openWorldInPlayer
  if (typeof window.openWorldInPlayer === 'function') {
    var _origOpenWorld = window.openWorldInPlayer;
    window.openWorldInPlayer = function (num) {
      if (!isLoggedIn()) {
        var NUM = { 1: 'alphabet-island', 2: 'math-mountain', 3: 'story-cove', 4: 'creativity-kingdom', 5: 'science-safari', 6: 'life-skills-village', 7: 'coding-city', 8: 'music-meadow', 9: 'brain-game-galaxy' };
        window._kivoraPendingWorldNum = num;
        window._kivoraPendingWorldSlug = NUM[num] || 'alphabet-island';
        promptLogin('player');
        return;
      }
      return _origOpenWorld.apply(this, arguments);
    };
  }

  // Wrap spaNavigate so directly reaching #player requires login
  if (typeof window.spaNavigate === 'function') {
    var _origSpaNav = window.spaNavigate;
    window.spaNavigate = function (slug, hash) {
      if (slug === 'player' && !isLoggedIn()) { promptLogin('player'); return; }
      return _origSpaNav.apply(this, arguments);
    };
  }

  // If someone deep-links directly to #player with no session, bounce to home + login
  function guardDeepLink() {
    if ((location.hash || '').slice(1) === 'player' && !isLoggedIn()) {
      if (typeof window.spaNavigate === 'function') _origSpaNav('home');
      promptLogin('player');
    }
  }

  // Resume pending world after a successful login
  function resumeAfterLogin() {
    var pending = window._kivoraPendingPlayer;
    if (!pending || !isLoggedIn()) return;
    window._kivoraPendingPlayer = null;
    if (typeof closePageModal === 'function') closePageModal();
    setTimeout(function () {
      if (window._kivoraPendingWorldNum && typeof _origOpenWorld === 'function') {
        var n = window._kivoraPendingWorldNum; window._kivoraPendingWorldNum = null; _origOpenWorld(n);
      } else if (typeof _origSpaNav === 'function') {
        _origSpaNav('player');
        if (typeof unlockAndStart === 'function') setTimeout(unlockAndStart, 200);
      }
    }, 120);
  }
  ['loginAsChild', 'startLearning', 'startLearningAsChild'].forEach(function (fn) {
    if (typeof window[fn] === 'function') {
      var orig = window[fn];
      window[fn] = function () { var r = orig.apply(this, arguments); resumeAfterLogin(); return r; };
    }
  });

  /* ══════════════════════════════════════════════════════════════
     3. TEST YOUR KNOWLEDGE — QUIZ ENGINE
     ══════════════════════════════════════════════════════════════ */
  var QUIZ = {
    alphabet: { title: 'Alphabet Island', emoji: '🏝️', color: '#EC4899', q: [
      { q: 'Which letter does 🍎 Apple start with?', o: ['A', 'E', 'O', 'B'], a: 0, e: 'Apple begins with the letter A — /a/ /a/ Apple!' },
      { q: 'What sound does the letter "S" make?', o: ['/b/', '/sss/', '/mmm/', '/t/'], a: 1, e: 'S makes a soft hissing /sss/ sound, like a snake!' },
      { q: 'Which word rhymes with "cat"?', o: ['dog', 'hat', 'sun', 'car'], a: 1, e: '"Hat" rhymes with "cat" — they both end in -at.' },
      { q: 'How many vowels are in the word "rain"?', o: ['1', '2', '3', '0'], a: 1, e: '"Rain" has two vowels: a and i.' },
      { q: 'Which letter comes AFTER "M"?', o: ['L', 'N', 'P', 'K'], a: 1, e: 'The alphabet goes …L, M, N… so N comes after M.' },
      { q: 'Pick the word that begins with the /f/ sound.', o: ['sun', 'fish', 'dog', 'nest'], a: 1, e: '"Fish" starts with F, which makes the /f/ sound.' },
      { q: 'What is the FIRST letter of the alphabet?', o: ['Z', 'B', 'A', 'C'], a: 2, e: 'A is the very first letter of the alphabet.' },
      { q: 'Which is a "naming" word (noun)?', o: ['run', 'happy', 'dog', 'quickly'], a: 2, e: '"Dog" names a thing, so it is a noun.' }
    ]},
    math: { title: 'Math Mountain', emoji: '⛰️', color: '#0D9488', q: [
      { q: 'What is 2 + 3?', o: ['4', '5', '6', '7'], a: 1, e: '2 + 3 = 5. Count on: 2… then 3 and 4 and 5!' },
      { q: 'How many sides does a triangle have?', o: ['2', '3', '4', '5'], a: 1, e: 'A triangle always has 3 sides and 3 corners.' },
      { q: 'What comes next: 5, 10, 15, __ ?', o: ['16', '20', '25', '18'], a: 1, e: 'Counting by 5s: 15 + 5 = 20.' },
      { q: 'What is 10 − 4?', o: ['5', '6', '7', '8'], a: 1, e: '10 − 4 = 6. Take 4 away from 10 and 6 are left.' },
      { q: 'Which number is the LARGEST?', o: ['17', '71', '27', '7'], a: 1, e: '71 is the largest — 7 tens and 1 one.' },
      { q: 'A pizza is cut into 4 equal slices. Each slice is a…', o: ['half', 'quarter', 'third', 'whole'], a: 1, e: 'Four equal parts means each part is a quarter (1/4).' },
      { q: 'What is 3 × 2?', o: ['5', '6', '8', '9'], a: 1, e: '3 groups of 2 = 6. (2 + 2 + 2 = 6).' },
      { q: 'How many minutes are in one hour?', o: ['30', '45', '60', '100'], a: 2, e: 'There are 60 minutes in one hour.' }
    ]},
    science: { title: 'Science Safari', emoji: '🔬', color: '#16A34A', q: [
      { q: 'What do plants need to make their food?', o: ['Sunlight', 'Candy', 'Rocks', 'Plastic'], a: 0, e: 'Plants use sunlight, water and air to make food — this is photosynthesis!' },
      { q: 'Which of these is a MAMMAL?', o: ['Shark', 'Dolphin', 'Frog', 'Eagle'], a: 1, e: 'A dolphin is a mammal — it breathes air and feeds its babies milk.' },
      { q: 'Water turns into ice when it gets…', o: ['very hot', 'very cold', 'windy', 'loud'], a: 1, e: 'When water gets very cold it freezes into solid ice.' },
      { q: 'How many legs does an insect have?', o: ['4', '6', '8', '10'], a: 1, e: 'All insects have 6 legs. Spiders (8 legs) are NOT insects!' },
      { q: 'Which planet do we live on?', o: ['Mars', 'Earth', 'Jupiter', 'Venus'], a: 1, e: 'We live on planet Earth — the blue and green planet.' },
      { q: 'What part of a plant takes in water from the soil?', o: ['Leaf', 'Flower', 'Roots', 'Petal'], a: 2, e: 'Roots drink water and hold the plant in the ground.' },
      { q: 'The Sun gives us…', o: ['light and heat', 'rain', 'snow', 'thunder'], a: 0, e: 'The Sun is a star that gives Earth light and heat.' },
      { q: 'Which is a way to stay healthy?', o: ['Never sleep', 'Eat vegetables', 'Skip water', 'No exercise'], a: 1, e: 'Eating vegetables helps your body grow strong and healthy.' }
    ]},
    brain: { title: 'Brain Game Galaxy', emoji: '🧠', color: '#CA8A04', q: [
      { q: 'Which shape is the ODD one out? 🔴 🔴 🟦 🔴', o: ['1st', '2nd', '3rd', '4th'], a: 2, e: 'The 3rd one is a blue square — the rest are red circles.' },
      { q: 'Finish the pattern: 🍎🍌🍎🍌🍎__', o: ['🍎', '🍌', '🍇', '🍊'], a: 1, e: 'The pattern is apple, banana, apple, banana… so 🍌 is next.' },
      { q: 'If today is Monday, what is TOMORROW?', o: ['Sunday', 'Tuesday', 'Friday', 'Monday'], a: 1, e: 'The day after Monday is Tuesday.' },
      { q: 'Which is HEAVIER?', o: ['A feather', 'An elephant', 'A leaf', 'A balloon'], a: 1, e: 'An elephant is much heavier than the others!' },
      { q: 'What number is hidden? 1, 2, __, 4, 5', o: ['6', '3', '0', '9'], a: 1, e: 'Counting in order, 3 fits between 2 and 4.' },
      { q: 'A cat has whiskers. Which animal ALSO has whiskers?', o: ['Fish', 'Tiger', 'Bird', 'Snake'], a: 1, e: 'A tiger is a big cat — it also has whiskers.' },
      { q: 'Which does NOT belong: car, bus, banana, bike?', o: ['car', 'bus', 'banana', 'bike'], a: 2, e: 'A banana is a fruit — the others are ways to travel.' },
      { q: 'Mia is taller than Sam. Sam is taller than Bo. Who is TALLEST?', o: ['Sam', 'Bo', 'Mia', 'Same'], a: 2, e: 'Mia is taller than Sam, and Sam is taller than Bo — so Mia is tallest.' }
    ]},
    story: { title: 'Story Cove', emoji: '🌊', color: '#EA580C', q: [
      { q: 'Who is usually the MAIN person in a story?', o: ['The author', 'The character', 'The reader', 'The page'], a: 1, e: 'The main character is the person the story is mostly about.' },
      { q: 'Where a story happens is called the…', o: ['setting', 'ending', 'title', 'cover'], a: 0, e: 'The setting is where and when a story takes place.' },
      { q: 'A word that means the same as "big" is…', o: ['tiny', 'large', 'fast', 'sad'], a: 1, e: '"Large" is a synonym for "big".' },
      { q: 'What usually comes at the END of a story?', o: ['The beginning', 'The problem', 'The solution', 'The title'], a: 2, e: 'Stories often end by solving the problem — the resolution.' },
      { q: 'Which sentence asks a question?', o: ['I like cake.', 'Run fast!', 'Where is my hat?', 'The dog barked.'], a: 2, e: 'A question ends with a question mark (?) — "Where is my hat?"' },
      { q: 'The opposite (antonym) of "happy" is…', o: ['glad', 'joyful', 'sad', 'merry'], a: 2, e: '"Sad" is the opposite of "happy".' },
      { q: 'Reading the pictures can help you…', o: ['understand the story', 'eat lunch', 'run faster', 'sleep'], a: 0, e: 'Pictures give clues that help you understand what is happening.' },
      { q: 'A group of sentences about one idea is a…', o: ['letter', 'paragraph', 'word', 'sound'], a: 1, e: 'A paragraph is a group of sentences about one idea.' }
    ]},
    more: { title: 'Music • Coding • Life Skills', emoji: '🎵', color: '#7C3AED', q: [
      { q: 'How many musical notes are in "Do Re Mi Fa So La Ti"?', o: ['5', '6', '7', '8'], a: 2, e: 'The solfège scale has 7 notes: Do Re Mi Fa So La Ti.' },
      { q: 'In coding, a set of steps to solve a problem is called an…', o: ['apple', 'algorithm', 'answer', 'arrow'], a: 1, e: 'An algorithm is a step-by-step set of instructions.' },
      { q: 'Which is the SAFEST thing to do when you cross a road?', o: ['Run without looking', 'Look both ways', 'Close your eyes', 'Play a game'], a: 1, e: 'Always stop and look both ways before crossing.' },
      { q: 'A drum makes sound when you…', o: ['hit it', 'read it', 'freeze it', 'smell it'], a: 0, e: 'A drum makes sound from vibrations when you hit it.' },
      { q: 'When you make a mistake in code, you should…', o: ['give up', 'debug it', 'hide it', 'delete everything'], a: 1, e: 'Debugging means finding and fixing mistakes — everyone does it!' },
      { q: 'Which is a kind way to treat a friend?', o: ['Share', 'Grab', 'Ignore', 'Push'], a: 0, e: 'Sharing is a kind and caring way to treat friends.' },
      { q: 'A loud sound is described as…', o: ['soft', 'high volume', 'silent', 'quiet'], a: 1, e: 'Loud sounds have a high volume; quiet sounds are low volume.' },
      { q: 'Before eating, it is healthy to…', o: ['wash your hands', 'jump 10 times', 'shout', 'nothing'], a: 0, e: 'Washing your hands keeps germs away before you eat.' }
    ]}
  };

  function startQuiz(key) {
    var quiz = QUIZ[key];
    if (!quiz) return;
    var idx = 0, score = 0, answered = false;
    var body = openOverlay('', {});
    function render() {
      if (idx >= quiz.q.length) { renderResult(); return; }
      var item = quiz.q[idx];
      answered = false;
      var pct = Math.round((idx) / quiz.q.length * 100);
      body.innerHTML =
        '<div style="text-align:center;margin-bottom:6px"><span style="font-size:2.2rem">' + quiz.emoji + '</span></div>' +
        '<div class="kv-h" style="text-align:center;font-size:1.15rem;margin-bottom:12px">' + quiz.title + ' Quiz</div>' +
        '<div class="kv-bar"><i style="width:' + pct + '%"></i></div>' +
        '<div style="font-size:.8rem;font-weight:700;color:#64748b;text-align:right;margin-bottom:12px">Question ' + (idx + 1) + ' of ' + quiz.q.length + '</div>' +
        '<div class="kv-h" style="font-size:1.1rem;margin-bottom:14px;color:inherit">' + item.q + '</div>' +
        '<div id="kvOpts"></div><div id="kvFoot"></div>';
      var wrap = body.querySelector('#kvOpts');
      item.o.forEach(function (opt, i) {
        var b = el('button', { class: 'kv-opt' }, opt);
        b.onclick = function () { pick(i, b, item); };
        wrap.appendChild(b);
      });
    }
    function pick(i, btn, item) {
      if (answered) return;
      answered = true;
      var opts = body.querySelectorAll('.kv-opt');
      opts.forEach(function (o) { o.disabled = true; });
      if (i === item.a) { btn.classList.add('right'); score++; }
      else { btn.classList.add('wrong'); opts[item.a].classList.add('right'); }
      var foot = body.querySelector('#kvFoot');
      foot.innerHTML = '<div class="kv-explain">🦊 <b>Kivi says:</b> ' + item.e + '</div>';
      var next = el('button', { class: 'kv-btn', style: 'width:100%;margin-top:14px' }, idx + 1 >= quiz.q.length ? 'See My Score →' : 'Next Question →');
      next.onclick = function () { idx++; render(); };
      foot.appendChild(next);
    }
    function renderResult() {
      var pct = Math.round(score / quiz.q.length * 100);
      var msg = pct === 100 ? 'Perfect! You are a superstar! 🌟' : pct >= 70 ? 'Great job! Keep it up! 🎉' : pct >= 40 ? 'Nice try — practice makes perfect! 💪' : 'Good start! Let us try again! 🦊';
      body.innerHTML =
        '<div style="text-align:center">' +
        '<div style="font-size:3.4rem;margin-bottom:6px">' + (pct >= 70 ? '🏆' : '⭐') + '</div>' +
        '<div class="kv-h" style="font-size:1.5rem">' + score + ' / ' + quiz.q.length + '</div>' +
        '<div style="font-weight:700;color:#64748b;margin:6px 0 18px">' + msg + '</div>' +
        '<button class="kv-btn" id="kvAgain" style="width:100%;margin-bottom:10px">Play Again 🔁</button>' +
        '<button class="kv-btn ghost" id="kvPick" style="width:100%">Try Another Quiz 🧩</button>' +
        '</div>';
      body.querySelector('#kvAgain').onclick = function () { idx = 0; score = 0; render(); };
      body.querySelector('#kvPick').onclick = openQuizPicker;
      // save a light progress marker if logged in
      if (isLoggedIn()) {
        try {
          var c = getActiveChild();
          var k = 'kivora_quiz_' + c.id;
          var d = LS.get(k, {}); d[key] = Math.max(d[key] || 0, pct); LS.set(k, d);
        } catch (e) {}
      }
    }
    render();
  }
  window.kivoraStartQuiz = startQuiz;

  function openQuizPicker() {
    var body = openOverlay('<div class="kv-h" style="text-align:center;font-size:1.4rem;margin-bottom:4px">Test Your Knowledge 🧩</div><div style="text-align:center;color:#64748b;font-weight:600;font-size:.9rem;margin-bottom:4px">Pick a quiz — Kivi always explains the answer!</div><div class="kv-grid" id="kvQGrid"></div>', { wide: true });
    var grid = body.querySelector('#kvQGrid');
    Object.keys(QUIZ).forEach(function (key) {
      var q = QUIZ[key];
      var t = el('button', { class: 'kv-tile', style: 'background:linear-gradient(135deg,' + q.color + ',' + shade(q.color, -18) + ')' },
        '<span style="font-size:1.6rem">' + q.emoji + '</span><div style="margin-top:6px">' + q.title + '</div><small>' + q.q.length + ' questions · tap to start</small>');
      t.onclick = function () { startQuiz(key); };
      grid.appendChild(t);
    });
  }
  window.kivoraOpenQuizPicker = openQuizPicker;

  function shade(hex, amt) {
    var n = parseInt(hex.slice(1), 16), r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
    r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
    return '#' + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
  }

  /* ══════════════════════════════════════════════════════════════
     4. CREATIVITY HUB — WORKABLE TOOLS
     ══════════════════════════════════════════════════════════════ */
  var PALETTE = ['#000000', '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#22C55E', '#14B8A6', '#3B82F6', '#6366F1', '#A855F7', '#EC4899', '#8B4513', '#94A3B8', '#FFFFFF'];

  function creativeHome() {
    var body = openOverlay('<div class="kv-h" style="text-align:center;font-size:1.5rem;margin-bottom:2px">Creativity Hub 🎨</div><div style="text-align:center;color:#64748b;font-weight:600;font-size:.9rem;margin-bottom:2px">Draw, make music, tell stories & build — tap a studio!</div><div class="kv-grid" id="kvCGrid"></div>', { wide: true });
    var grid = body.querySelector('#kvCGrid');
    [['draw', '🖌️', 'Drawing Studio', 'Paint on a real canvas', '#EC4899', '#8B5CF6'],
     ['music', '🎵', 'Music Maker', 'Play & record a tune', '#14B8A6', '#0EA5E9'],
     ['story', '📖', 'Story Builder', 'Build your own story', '#F59E0B', '#EF4444'],
     ['build', '🧱', 'Build & Design', 'Make pixel-art creations', '#22C55E', '#16A34A']
    ].forEach(function (t) {
      var b = el('button', { class: 'kv-tile', style: 'background:linear-gradient(135deg,' + t[4] + ',' + t[5] + ')' },
        '<span style="font-size:1.7rem">' + t[1] + '</span><div style="margin-top:6px">' + t[2] + '</div><small>' + t[3] + '</small>');
      b.onclick = function () { creativeTool(t[0]); };
      grid.appendChild(b);
    });
  }
  window.kivoraCreativeHome = creativeHome;
  function creativeTool(which) {
    if (which === 'draw') return drawStudio();
    if (which === 'music') return musicMaker();
    if (which === 'story') return storyBuilder();
    if (which === 'build') return buildDesign();
  }
  window.kivoraCreative = creativeTool;

  /* -- Drawing Studio -- */
  function drawStudio() {
    var body = openOverlay('<div class="kv-h" style="text-align:center;font-size:1.3rem;margin-bottom:10px">🖌️ Drawing Studio</div>' +
      '<div id="kvPal" style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:10px"></div>' +
      '<canvas id="kvCanvas" width="680" height="420" style="width:100%;background:#fff;border:2px solid #e2e8f0;border-radius:16px;touch-action:none;cursor:crosshair"></canvas>' +
      '<div style="display:flex;align-items:center;gap:10px;margin-top:12px;flex-wrap:wrap;justify-content:center">' +
      '<label style="font-weight:700;font-size:.85rem;color:#64748b">Brush <input id="kvSize" type="range" min="2" max="40" value="8"></label>' +
      '<button class="kv-btn ghost" id="kvErase">🧽 Eraser</button>' +
      '<button class="kv-btn ghost" id="kvClear">🗑️ Clear</button>' +
      '<button class="kv-btn" id="kvSave">💾 Save PNG</button>' +
      '<button class="kv-btn" id="kvPrintD">🖨️ Print</button></div>', { wide: true });
    var pal = body.querySelector('#kvPal'), cur = '#000000', erasing = false;
    PALETTE.forEach(function (c, i) {
      var s = el('span', { class: 'kv-sw' + (i === 0 ? ' sel' : ''), style: 'background:' + c });
      s.onclick = function () { cur = c; erasing = false; pal.querySelectorAll('.kv-sw').forEach(function (x) { x.classList.remove('sel'); }); s.classList.add('sel'); };
      pal.appendChild(s);
    });
    var cv = body.querySelector('#kvCanvas'), ctx = cv.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    var drawing = false, size = 8;
    body.querySelector('#kvSize').oninput = function () { size = +this.value; };
    function pos(e) {
      var r = cv.getBoundingClientRect(), t = e.touches ? e.touches[0] : e;
      return { x: (t.clientX - r.left) * (cv.width / r.width), y: (t.clientY - r.top) * (cv.height / r.height) };
    }
    function down(e) { drawing = true; var p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); e.preventDefault(); }
    function move(e) { if (!drawing) return; var p = pos(e); ctx.strokeStyle = erasing ? '#fff' : cur; ctx.lineWidth = erasing ? size * 2 : size; ctx.lineTo(p.x, p.y); ctx.stroke(); e.preventDefault(); }
    function up() { drawing = false; }
    cv.addEventListener('mousedown', down); cv.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
    cv.addEventListener('touchstart', down); cv.addEventListener('touchmove', move); cv.addEventListener('touchend', up);
    body.querySelector('#kvErase').onclick = function () { erasing = true; };
    body.querySelector('#kvClear').onclick = function () { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height); };
    body.querySelector('#kvSave').onclick = function () { var a = el('a'); a.download = 'my-kivora-art.png'; a.href = cv.toDataURL('image/png'); a.click(); };
    body.querySelector('#kvPrintD').onclick = function () { printImage(cv.toDataURL('image/png'), 'My Drawing'); };
  }

  /* -- Music Maker -- */
  function musicMaker() {
    var notes = [['C', 261.63, '#EF4444'], ['D', 293.66, '#F97316'], ['E', 329.63, '#EAB308'], ['F', 349.23, '#22C55E'], ['G', 392.00, '#14B8A6'], ['A', 440.00, '#3B82F6'], ['B', 493.88, '#8B5CF6'], ['C²', 523.25, '#EC4899']];
    var body = openOverlay('<div class="kv-h" style="text-align:center;font-size:1.3rem;margin-bottom:6px">🎵 Music Maker</div>' +
      '<div style="text-align:center;color:#64748b;font-weight:600;font-size:.85rem;margin-bottom:12px">Tap the coloured keys to play. Press <b>Record</b>, play a tune, then <b>Play</b> it back!</div>' +
      '<div id="kvPads" style="display:flex;gap:6px;margin-bottom:14px"></div>' +
      '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">' +
      '<button class="kv-btn" id="kvRec">⏺ Record</button>' +
      '<button class="kv-btn ghost" id="kvPlay">▶ Play</button>' +
      '<button class="kv-btn ghost" id="kvClr">🗑 Clear</button></div>' +
      '<div style="text-align:center;font-weight:700;color:#64748b;font-size:.82rem;margin-top:10px" id="kvRecMsg"></div>', {});
    var AC = window.AudioContext || window.webkitAudioContext, actx = null;
    var recording = false, seq = [], startT = 0;
    function tone(freq, dur) {
      try {
        if (!actx) actx = new AC();
        var o = actx.createOscillator(), g = actx.createGain();
        o.type = 'sine'; o.frequency.value = freq; o.connect(g); g.connect(actx.destination);
        g.gain.setValueAtTime(0.001, actx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.3, actx.currentTime + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + (dur || 0.5));
        o.start(); o.stop(actx.currentTime + (dur || 0.5) + 0.02);
      } catch (e) {}
    }
    window._kvAudioStop = function () { try { if (actx) actx.close(); } catch (e) {} actx = null; };
    var pads = body.querySelector('#kvPads');
    notes.forEach(function (n) {
      var p = el('button', { class: 'kv-pad', style: 'background:' + n[2] }, n[0]);
      p.onclick = function () { tone(n[1]); if (recording) seq.push({ f: n[1], t: Date.now() - startT }); };
      pads.appendChild(p);
    });
    var msg = body.querySelector('#kvRecMsg');
    body.querySelector('#kvRec').onclick = function () {
      recording = !recording;
      this.textContent = recording ? '⏹ Stop' : '⏺ Record';
      if (recording) { seq = []; startT = Date.now(); msg.textContent = '🔴 Recording… play some keys!'; }
      else { msg.textContent = seq.length ? '✅ Recorded ' + seq.length + ' notes — press Play!' : 'No notes recorded yet.'; }
    };
    body.querySelector('#kvPlay').onclick = function () {
      if (!seq.length) { msg.textContent = 'Record a tune first! ⏺'; return; }
      msg.textContent = '🎶 Playing your tune…';
      seq.forEach(function (n) { setTimeout(function () { tone(n.f); }, n.t); });
      setTimeout(function () { msg.textContent = '✨ That was your tune!'; }, (seq[seq.length - 1].t) + 600);
    };
    body.querySelector('#kvClr').onclick = function () { seq = []; msg.textContent = 'Cleared. Ready to record! ⏺'; };
  }

  /* -- Story Builder -- */
  function storyBuilder() {
    var chars = ['🦊 Kivi the Fox', '🐘 Ellie the Elephant', '🚀 Astro the Robot', '🧚 Luna the Fairy', '🦁 Leo the Lion', '🐢 Pip the Turtle'];
    var places = ['a magical forest', 'outer space', 'a sunny beach', 'a busy city', 'under the ocean', 'a tall mountain'];
    var probs = ['lost their way home', 'found a mysterious door', 'wanted to make a new friend', 'discovered a hidden treasure map', 'had to be very brave', 'learned something amazing'];
    var body = openOverlay('<div class="kv-h" style="text-align:center;font-size:1.3rem;margin-bottom:6px">📖 Story Builder</div>' +
      '<div style="text-align:center;color:#64748b;font-weight:600;font-size:.85rem;margin-bottom:14px">Choose the parts of your story, then let Kivi write it with you!</div>' +
      pick('Hero', 'kvHero', chars) + pick('Place', 'kvPlace', places) + pick('Adventure', 'kvProb', probs) +
      '<input id="kvNamer" placeholder="Give your story a title (optional)" style="width:100%;padding:12px 14px;border-radius:12px;border:2px solid #e2e8f0;font-family:inherit;font-weight:700;margin:6px 0 14px;box-sizing:border-box">' +
      '<button class="kv-btn" id="kvMake" style="width:100%">✨ Make My Story</button>' +
      '<div id="kvStoryOut"></div>', {});
    function pick(label, id, arr) {
      return '<label style="font-weight:800;font-size:.82rem;color:#475569;display:block;margin:8px 0 4px">' + label + '</label>' +
        '<select id="' + id + '" style="width:100%;padding:11px 14px;border-radius:12px;border:2px solid #e2e8f0;font-family:inherit;font-weight:700;background:#fff;margin-bottom:4px">' +
        arr.map(function (o) { return '<option>' + o + '</option>'; }).join('') + '</select>';
    }
    body.querySelector('#kvMake').onclick = function () {
      var hero = body.querySelector('#kvHero').value, place = body.querySelector('#kvPlace').value, prob = body.querySelector('#kvProb').value;
      var name = hero.replace(/^\S+\s/, '').split(' ')[0];
      var title = (body.querySelector('#kvNamer').value || '').trim() || ('The Adventure of ' + name);
      var story =
        '<h3>' + title + '</h3>' +
        '<p>Once upon a time, ' + hero + ' lived in ' + place + '. Every day was full of wonder, but one morning something special happened.</p>' +
        '<p>' + name + ' ' + prob + '. At first ' + name + ' felt a little unsure — but taking a deep breath, ' + name + ' decided to be curious and kind.</p>' +
        '<p>Along the way, ' + name + ' met new friends who helped out. Together they worked as a team, solved the puzzle, and learned that trying your best is what matters most.</p>' +
        '<p>By the end of the day, ' + name + ' returned happy and proud. And ' + place + ' was an even brighter place because of the kindness they shared.</p>' +
        '<p style="text-align:center;font-weight:800;color:#7C3AED">The End 🌟</p>';
      var out = body.querySelector('#kvStoryOut');
      out.innerHTML = '<div class="kv-article" style="margin-top:16px;background:#faf5ff;border:1px solid #e9d5ff;border-radius:16px;padding:18px">' + story + '</div>' +
        '<div style="display:flex;gap:10px;margin-top:12px"><button class="kv-btn" id="kvReadStory" style="flex:1">🔊 Read Aloud</button><button class="kv-btn ghost" id="kvPrintStory" style="flex:1">🖨️ Print</button></div>';
      out.querySelector('#kvReadStory').onclick = function () { speak(out.querySelector('.kv-article').textContent); };
      out.querySelector('#kvPrintStory').onclick = function () { printHtml(title, out.querySelector('.kv-article').innerHTML); };
      out.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
  }

  /* -- Build & Design (pixel art) -- */
  function buildDesign() {
    var N = 12, cur = '#3B82F6';
    var body = openOverlay('<div class="kv-h" style="text-align:center;font-size:1.3rem;margin-bottom:6px">🧱 Build & Design</div>' +
      '<div style="text-align:center;color:#64748b;font-weight:600;font-size:.85rem;margin-bottom:10px">Pick a colour and tap the squares to build pixel-art!</div>' +
      '<div id="kvBPal" style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:12px"></div>' +
      '<div class="kv-build" id="kvBoard" style="grid-template-columns:repeat(' + N + ',1fr)"></div>' +
      '<div style="display:flex;gap:10px;justify-content:center;margin-top:14px;flex-wrap:wrap">' +
      '<button class="kv-btn ghost" id="kvBClr">🗑 Clear</button><button class="kv-btn" id="kvBPrint">🖨️ Print</button></div>', {});
    var pal = body.querySelector('#kvBPal');
    PALETTE.forEach(function (c, i) {
      var s = el('span', { class: 'kv-sw' + (c === cur ? ' sel' : ''), style: 'background:' + c });
      s.onclick = function () { cur = c; pal.querySelectorAll('.kv-sw').forEach(function (x) { x.classList.remove('sel'); }); s.classList.add('sel'); };
      pal.appendChild(s);
    });
    var board = body.querySelector('#kvBoard'), painting = false;
    for (var i = 0; i < N * N; i++) {
      var cell = el('i');
      cell.onmousedown = function () { painting = true; this.style.background = cur; };
      cell.onmouseover = function () { if (painting) this.style.background = cur; };
      cell.onclick = function () { this.style.background = cur; };
      cell.addEventListener('touchstart', function (e) { this.style.background = cur; e.preventDefault(); });
      board.appendChild(cell);
    }
    window.addEventListener('mouseup', function () { painting = false; });
    body.querySelector('#kvBClr').onclick = function () { board.querySelectorAll('i').forEach(function (c) { c.style.background = '#fff'; }); };
    body.querySelector('#kvBPrint').onclick = function () {
      var cells = board.querySelectorAll('i'), html = '<div style="display:grid;grid-template-columns:repeat(' + N + ',24px);gap:1px;background:#e2e8f0;width:max-content;margin:0 auto">';
      cells.forEach(function (c) { html += '<div style="width:24px;height:24px;background:' + (c.style.background || '#fff') + '"></div>'; });
      html += '</div>';
      printHtml('My Pixel Creation', html);
    };
  }

  /* ══════════════════════════════════════════════════════════════
     5. SPECIAL NEEDS — ACCESSIBILITY TOOLKIT + STORIES + CALM
     ══════════════════════════════════════════════════════════════ */
  var A11Y = [
    ['kv-dyslexic', '📖', 'Dyslexia-Friendly Font', 'Rounder letters with more spacing'],
    ['kv-bigtext', '🔎', 'Larger Text', 'Increase text size across the site'],
    ['kv-contrast', '🌗', 'High Contrast', 'Bolder colours for easier reading'],
    ['kv-nomotion', '🧘', 'Reduce Motion', 'Turn off animations & movement'],
    ['kv-readaloud', '🔊', 'Read Aloud on Tap', 'Tap any text to hear it spoken']
  ];
  function applyA11y() {
    var s = LS.get('kivora_a11y', {});
    A11Y.forEach(function (t) { if (t[0] !== 'kv-readaloud') document.body.classList.toggle(t[0], !!s[t[0]]); });
    setReadAloud(!!s['kv-readaloud']);
  }
  var _readHandler = null;
  function setReadAloud(on) {
    if (on && !_readHandler) {
      _readHandler = function (e) {
        var t = e.target.closest('p,h1,h2,h3,li,button,a,span,div.kv-article');
        if (!t) return; var txt = (t.innerText || '').trim();
        if (txt && txt.length < 400) speak(txt);
      };
      document.addEventListener('click', _readHandler, true);
    } else if (!on && _readHandler) {
      document.removeEventListener('click', _readHandler, true); _readHandler = null;
    }
  }
  function openA11y() {
    var s = LS.get('kivora_a11y', {});
    var body = openOverlay('<div class="kv-h" style="text-align:center;font-size:1.4rem;margin-bottom:2px">♾️ Accessibility Toolkit</div>' +
      '<div style="text-align:center;color:#64748b;font-weight:600;font-size:.88rem;margin-bottom:14px">Turn on the supports that help you learn best. Your choices are saved on this device.</div>' +
      '<div id="kvTogs"></div>' +
      '<div style="text-align:center;margin-top:8px"><button class="kv-btn ghost" id="kvResetA11y">Reset all</button></div>', {});
    var wrap = body.querySelector('#kvTogs');
    A11Y.forEach(function (t) {
      var row = el('div', { class: 'kv-tog' }, '<div><b>' + t[1] + ' ' + t[2] + '</b><small>' + t[3] + '</small></div>');
      var sw = el('button', { class: 'kv-switch' + (s[t[0]] ? ' on' : ''), 'aria-label': t[2] }, '<i></i>');
      sw.onclick = function () {
        s = LS.get('kivora_a11y', {}); s[t[0]] = !s[t[0]]; LS.set('kivora_a11y', s);
        sw.classList.toggle('on', !!s[t[0]]); applyA11y();
      };
      row.appendChild(sw); wrap.appendChild(row);
    });
    body.querySelector('#kvResetA11y').onclick = function () { LS.set('kivora_a11y', {}); applyA11y(); openA11y(); };
  }
  window.kivoraOpenA11y = openA11y;

  var STORIES = [
    { t: 'Going to School', e: '🏫', p: ['In the morning, I wake up and get ready for school. I put on my clothes and eat my breakfast.', 'My grown-up takes me to school. I say goodbye and I know they will come back for me later.', 'At school I hang up my bag. My teacher is happy to see me. I sit in my special spot.', 'We learn, we play, and we have snack time. If I feel worried, I can take a deep breath.', 'At the end of the day, my grown-up comes back. I had a good day at school!'] },
    { t: 'Making a New Friend', e: '🤝', p: ['Sometimes I want to play with someone new. That can feel a little scary, and that is okay.', 'I can walk up and say "Hi, my name is ___. Can I play?" in a friendly voice.', 'If they say yes, we can share and take turns. Taking turns is a kind thing to do.', 'If they say "not now", that is okay too. I can find another friend or another game.', 'Being friendly and kind helps me make new friends.'] },
    { t: 'When I Feel Big Feelings', e: '💗', p: ['Sometimes I feel angry, sad, or worried. Everybody has big feelings — even grown-ups.', 'When my body feels fizzy, I can stop and notice how I feel. I can name it: "I feel angry."', 'I can take slow belly breaths: in like smelling a flower, out like blowing a candle.', 'I can ask for a break, hug a soft toy, or squeeze my hands. These help my body calm down.', 'Big feelings always pass, like clouds in the sky. I am safe, and I am okay.'] },
    { t: 'Trying Something New', e: '🌟', p: ['New things can feel tricky. My tummy might feel funny — that means I am being brave!', 'It is okay to make mistakes. Mistakes help my brain grow stronger.', 'I can try one small step at a time. I do not have to be perfect.', 'If it is hard, I can say "I will try again" instead of "I can\'t".', 'Every time I try, I learn a little more. I am proud of myself for trying!'] }
  ];
  function openStories() {
    var body = openOverlay('<div class="kv-h" style="text-align:center;font-size:1.4rem;margin-bottom:2px">📖 Social Stories</div>' +
      '<div style="text-align:center;color:#64748b;font-weight:600;font-size:.88rem;margin-bottom:14px">Calm, predictable stories that help children know what to expect.</div>' +
      '<div id="kvStoryList" style="display:flex;flex-direction:column;gap:10px"></div>', {});
    var list = body.querySelector('#kvStoryList');
    STORIES.forEach(function (st, i) {
      var b = el('button', { class: 'kv-opt', style: 'display:flex;align-items:center;gap:12px' }, '<span style="font-size:1.6rem">' + st.e + '</span><b>' + st.t + '</b>');
      b.onclick = function () { readStory(i); };
      list.appendChild(b);
    });
  }
  window.kivoraOpenStories = openStories;
  function readStory(i) {
    var st = STORIES[i], page = 0;
    var body = openOverlay('', {});
    function render() {
      body.innerHTML =
        '<div style="text-align:center;font-size:2.6rem">' + st.e + '</div>' +
        '<div class="kv-h" style="text-align:center;font-size:1.3rem;margin-bottom:12px">' + st.t + '</div>' +
        '<div class="kv-bar"><i style="width:' + Math.round((page + 1) / st.p.length * 100) + '%"></i></div>' +
        '<div class="kv-article" style="min-height:96px;font-size:1.15rem;text-align:center;padding:14px 6px">' + st.p[page] + '</div>' +
        '<div style="display:flex;gap:10px;margin-top:8px">' +
        (page > 0 ? '<button class="kv-btn ghost" id="kvPrev" style="flex:1">← Back</button>' : '') +
        '<button class="kv-btn ghost" id="kvSpeak" style="flex:1">🔊 Read</button>' +
        '<button class="kv-btn" id="kvNext" style="flex:1">' + (page + 1 < st.p.length ? 'Next →' : 'Done ✓') + '</button></div>' +
        '<div style="text-align:center;font-size:.78rem;font-weight:700;color:#94a3b8;margin-top:8px">Page ' + (page + 1) + ' of ' + st.p.length + '</div>';
      if (body.querySelector('#kvPrev')) body.querySelector('#kvPrev').onclick = function () { page--; render(); };
      body.querySelector('#kvSpeak').onclick = function () { speak(st.p[page]); };
      body.querySelector('#kvNext').onclick = function () { if (page + 1 < st.p.length) { page++; render(); } else openStories(); };
    }
    render();
  }
  function openCalm() {
    var body = openOverlay('<div class="kv-h" style="text-align:center;font-size:1.4rem;margin-bottom:2px">🌿 Calm-Down Corner</div>' +
      '<div style="text-align:center;color:#64748b;font-weight:600;font-size:.88rem;margin-bottom:6px">Follow the circle. Breathe in as it grows, breathe out as it shrinks.</div>' +
      '<div class="kv-breathe">Breathe</div>' +
      '<div style="text-align:center;color:#64748b;font-weight:700;font-size:.9rem" id="kvBreatheTxt">In… 2… 3… 4 · Out… 2… 3… 4</div>' +
      '<div style="margin-top:16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:14px;padding:14px;font-size:.9rem;font-weight:600;color:#166534;line-height:1.6">Other things that help:<br>🖐️ Press your hands together · 🧸 Hug a soft toy · 💧 Sip some water · 🔢 Count 5 things you can see</div>', {});
  }
  window.kivoraOpenCalm = openCalm;

  /* ══════════════════════════════════════════════════════════════
     6. LEARNING TIPS — ARTICLE READER
     ══════════════════════════════════════════════════════════════ */
  var ARTICLES = {
    '7 Ways to Make Reading Fun at Home': { emoji: '📚', body:
      '<p>Reading should feel like a treat, not a task. When children associate books with warmth and fun, they read more — and read better. Here are seven simple ways to make reading a joyful part of home life.</p>' +
      '<h3>1. Let them choose</h3><p>Give your child a say in what they read. Comics, joke books and picture books all count. Choice builds ownership and motivation.</p>' +
      '<h3>2. Read aloud together</h3><p>Even after children can read alone, reading aloud builds vocabulary and connection. Use silly voices for characters!</p>' +
      '<h3>3. Make a cozy reading nook</h3><p>A beanbag, some cushions and good light turn reading into a special place-and-time ritual.</p>' +
      '<h3>4. Follow their interests</h3><p>Dinosaur-mad? Get dinosaur books. Interest is the strongest engine for reading stamina.</p>' +
      '<h3>5. Keep sessions short</h3><p>Ten focused minutes beats a frustrating half hour. Stop while it is still fun.</p>' +
      '<h3>6. Talk about the story</h3><p>Ask "What do you think happens next?" Predicting and discussing deepens comprehension.</p>' +
      '<h3>7. Be a reading role model</h3><p>Let your child catch you enjoying your own book. Children copy what they see.</p>' +
      '<p><b>Takeaway:</b> Small, positive, daily reading moments matter far more than long, pressured ones.</p>' },
    'How Games Actually Improve Math Skills': { emoji: '🎮', body:
      '<p>"Screen time" gets a bad reputation, but well-designed learning games can genuinely strengthen math ability. Here is why play and numbers are such good partners.</p>' +
      '<h3>Games remove the fear of mistakes</h3><p>In a game, a wrong answer is just "try again" — no red pen, no embarrassment. This lowers math anxiety, the biggest barrier to progress.</p>' +
      '<h3>Instant feedback speeds learning</h3><p>Games tell children immediately whether they are right, so misconceptions are corrected on the spot instead of weeks later.</p>' +
      '<h3>Repetition without boredom</h3><p>Mastering number facts needs practice. Games disguise that repetition as fun, so children happily do far more of it.</p>' +
      '<h3>Real-world problem solving</h3><p>Scoring points, managing resources and beating levels all use estimation, comparison and logic — real math thinking.</p>' +
      '<h3>What to look for in a good math game</h3><ul><li>Clear learning goal, not just flashy rewards</li><li>Adjusts difficulty to your child</li><li>Explains <i>why</i> an answer is right</li><li>No pressure timers by default</li></ul>' +
      '<p><b>Takeaway:</b> The best math games make thinking feel like playing — aim for 10–15 focused minutes a day.</p>' },
    'Screen Time: Finding the Right Balance': { emoji: '⏱️', body:
      '<p>The question is no longer just "how much" screen time, but "what kind". A balanced approach focuses on quality, context and co-viewing.</p>' +
      '<h3>Not all screen time is equal</h3><p>Creating, learning and connecting are very different from passive scrolling. Judge the activity, not just the minutes.</p>' +
      '<h3>Use the 3 C\'s</h3><ul><li><b>Content</b> — is it age-appropriate and enriching?</li><li><b>Context</b> — is it replacing sleep, play or family time?</li><li><b>Child</b> — how does your child behave during and after?</li></ul>' +
      '<h3>Practical limits that work</h3><p>Set clear, consistent rules: no screens at meals, no screens an hour before bed, and a daily cap you both agree on. Predictable rules cause fewer battles.</p>' +
      '<h3>Watch together when you can</h3><p>Co-viewing lets you talk about what you see and turns screen time into shared time.</p>' +
      '<p><b>Takeaway:</b> Aim for screens that are active, educational and balanced with plenty of offline play, movement and sleep.</p>' },
    'The Science Behind Reward Systems': { emoji: '🧠', body:
      '<p>Stars, badges and points are everywhere in learning apps. Used well, they build motivation. Used badly, they can undermine it. Here is the science.</p>' +
      '<h3>Two kinds of motivation</h3><p><b>Intrinsic</b> motivation comes from within (curiosity, mastery). <b>Extrinsic</b> motivation comes from outside (rewards). The goal is to use rewards to spark effort that becomes its own reward.</p>' +
      '<h3>Reward effort, not just results</h3><p>Praising effort ("you kept trying!") builds a growth mindset. Praising only outcomes ("you\'re so smart") can make children avoid challenges.</p>' +
      '<h3>Make rewards immediate and specific</h3><p>The brain links behaviour to reward best when the reward comes quickly and clearly names what earned it.</p>' +
      '<h3>Fade rewards over time</h3><p>As a skill becomes enjoyable, gradually reduce external rewards so the activity itself becomes the motivator.</p>' +
      '<p><b>Takeaway:</b> Reward systems work best when they celebrate progress and effort, then quietly step back as confidence grows.</p>' },
    'Building a Home Learning Routine': { emoji: '🏡', body:
      '<p>Children thrive on predictability. A gentle, consistent routine reduces daily negotiation and helps learning become a natural habit.</p>' +
      '<h3>Anchor learning to existing habits</h3><p>Attach 15 minutes of learning to something that already happens daily — after breakfast, before dinner. Anchors make habits stick.</p>' +
      '<h3>Keep it short and same-time</h3><p>The same slot each day trains the brain to expect it. Short sessions protect focus and prevent burnout.</p>' +
      '<h3>Create a "ready to learn" signal</h3><p>A tidy table, a favourite pencil, a quiet space — small rituals tell the brain it is time to focus.</p>' +
      '<h3>Build in choice and breaks</h3><p>Let your child pick the order of tasks, and schedule movement breaks. Autonomy plus rest keeps motivation high.</p>' +
      '<h3>Review and celebrate weekly</h3><p>End the week by looking back at what was learned. Celebrating progress makes children want to continue.</p>' +
      '<p><b>Takeaway:</b> A short, same-time, low-pressure daily routine beats occasional marathon sessions every time.</p>' },
    'Creative Activities for Rainy Days': { emoji: '🎨', body:
      '<p>Stuck indoors? Rainy days are perfect for creativity, which builds fine motor skills, problem solving and self-expression. Try these low-mess, high-fun ideas.</p>' +
      '<h3>1. Build a blanket fort library</h3><p>Make a cozy den, fill it with cushions and books, and read by torchlight.</p>' +
      '<h3>2. Kitchen science</h3><p>Mix baking soda and vinegar, float and sink objects, or make rainbow milk. Wonder is the start of science.</p>' +
      '<h3>3. Draw & Design online</h3><p>Use Kivora\'s Drawing Studio and Build & Design tools to create art, then print your masterpiece.</p>' +
      '<h3>4. Make up a story</h3><p>Take turns adding one sentence each to build a silly story — or use the Story Builder for inspiration.</p>' +
      '<h3>5. Indoor treasure hunt</h3><p>Write simple clues that lead around the house. Great for reading and logic.</p>' +
      '<h3>6. Musical moments</h3><p>Turn pots into drums or try the Music Maker to compose a rainy-day tune.</p>' +
      '<p><b>Takeaway:</b> A rainy afternoon is a blank canvas — a little structure sparks hours of independent creativity.</p>' }
  };
  function openArticle(title) {
    var a = ARTICLES[title];
    if (!a) { toast('📝 This article is coming soon!'); return; }
    var body = openOverlay('<div style="text-align:center;font-size:3rem">' + a.emoji + '</div>' +
      '<div class="kv-h" style="text-align:center;font-size:1.5rem;margin-bottom:14px">' + title + '</div>' +
      '<div class="kv-article">' + a.body + '</div>' +
      '<div style="display:flex;gap:10px;margin-top:16px"><button class="kv-btn" id="kvReadArt" style="flex:1">🔊 Read Aloud</button><button class="kv-btn ghost" id="kvCloseArt" style="flex:1">Close</button></div>', { wide: true });
    body.querySelector('#kvReadArt').onclick = function () { speak(body.querySelector('.kv-article').innerText); };
    body.querySelector('#kvCloseArt').onclick = closeOverlay;
  }
  window.kivoraOpenArticle = openArticle;

  /* ══════════════════════════════════════════════════════════════
     7. ON-SCREEN COLOURING STUDIO (clean, no duplicates)
     ══════════════════════════════════════════════════════════════ */
  var COLOUR_SCENES = {
    animals: [
      { t: 'Elephant', shapes: [['body', 'M120,230 q0,-90 90,-90 q90,0 90,90 l0,60 l-180,0 z'], ['head', 'M95,180 a55,55 0 1,0 0.1,0'], ['ear', 'M60,150 a38,48 0 1,0 0.1,0'], ['trunk', 'M95,215 q-30,40 -10,80 q6,14 22,6 q-16,-40 8,-70'], ['leg1', 'M140,290 l0,50 l34,0 l0,-50 z'], ['leg2', 'M230,290 l0,50 l34,0 l0,-50 z'] ] },
      { t: 'Fish', shapes: [['body', 'M110,200 q80,-70 170,0 q-80,70 -170,0'], ['tail', 'M280,200 l50,-40 l0,80 z'], ['eye', 'M150,185 a10,10 0 1,0 0.1,0'], ['fin', 'M190,150 q20,-25 40,0 z'] ] },
      { t: 'Butterfly', shapes: [['wingTL', 'M195,190 q-90,-80 -110,10 q-10,60 110,20'], ['wingTR', 'M205,190 q90,-80 110,10 q10,60 -110,20'], ['wingBL', 'M195,205 q-80,80 -70,120 q40,30 70,-90'], ['wingBR', 'M205,205 q80,80 70,120 q-40,30 -70,-90'], ['body', 'M198,150 l4,0 l0,180 l-4,0 z'] ] }
    ],
    nature: [
      { t: 'Flower', shapes: [['p1', 'M200,150 a34,44 0 1,0 0.1,0'], ['p2', 'M150,200 a44,34 0 1,0 0.1,0'], ['p3', 'M200,250 a34,44 0 1,0 0.1,0'], ['p4', 'M250,200 a44,34 0 1,0 0.1,0'], ['center', 'M200,200 a26,26 0 1,0 0.1,0'], ['stem', 'M196,224 l8,0 l0,110 l-8,0 z'], ['leaf', 'M200,300 q40,-14 60,10 q-30,26 -60,-10'] ] },
      { t: 'Tree', shapes: [['top', 'M200,90 a90,80 0 1,0 0.1,0'], ['trunk', 'M182,240 l36,0 l0,90 l-36,0 z'] ] },
      { t: 'Sun & Cloud', shapes: [['sun', 'M140,150 a55,55 0 1,0 0.1,0'], ['cloud', 'M210,230 q10,-40 55,-28 q30,-25 60,10 q40,-2 30,40 l-150,0 q-14,-14 5,-22'] ] }
    ],
    space: [
      { t: 'Rocket', shapes: [['body', 'M200,110 q40,50 34,150 l-68,0 q-6,-100 34,-150'], ['window', 'M200,190 a20,20 0 1,0 0.1,0'], ['finL', 'M166,240 l-30,40 l30,0 z'], ['finR', 'M234,240 l30,40 l-30,0 z'], ['flame', 'M180,262 q20,60 40,0 q-10,26 -20,26 q-10,0 -20,-26'] ] },
      { t: 'Planet', shapes: [['planet', 'M200,200 a70,70 0 1,0 0.1,0'], ['ring', 'M110,205 q90,55 180,0 q-90,35 -180,0'] ] },
      { t: 'Star & Moon', shapes: [['star', 'M180,140 l14,42 l44,0 l-36,26 l14,42 l-40,-26 l-40,26 l14,-42 l-36,-26 l44,0 z'], ['moon', 'M280,230 a44,44 0 1,0 4,-40 a34,34 0 0,1 -4,40'] ] }
    ]
  };
  var COLOUR_CATS = [['animals', '🐘 Animals'], ['nature', '🌸 Nature'], ['space', '🚀 Space']];

  function openColouring(cat) {
    cat = cat && COLOUR_SCENES[cat] ? cat : 'animals';
    var scenes = COLOUR_SCENES[cat], sceneIdx = 0, cur = '#EF4444';
    var body = openOverlay('', { wide: true });
    function render() {
      var scene = scenes[sceneIdx];
      body.innerHTML =
        '<div class="kv-h" style="text-align:center;font-size:1.4rem;margin-bottom:2px">🖍️ Colour On-Screen</div>' +
        '<div style="text-align:center;color:#64748b;font-weight:600;font-size:.85rem;margin-bottom:8px">Pick a colour, then tap a shape to fill it in!</div>' +
        '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:10px">' +
          COLOUR_CATS.map(function (c) { return '<button class="kv-btn ' + (c[0] === cat ? '' : 'ghost') + '" data-cat="' + c[0] + '" style="padding:8px 14px;font-size:.82rem">' + c[1] + '</button>'; }).join('') + '</div>' +
        '<div id="kvColPal" style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:10px"></div>' +
        '<div style="text-align:center;font-weight:800;color:#475569;margin-bottom:6px">' + scene.t + ' <span style="font-weight:600;color:#94a3b8;font-size:.82rem">(' + (sceneIdx + 1) + '/' + scenes.length + ')</span></div>' +
        '<div style="background:#fff;border:2px solid #e2e8f0;border-radius:16px;padding:8px"><svg id="kvColSvg" viewBox="0 0 400 360" style="width:100%;height:auto;display:block"></svg></div>' +
        '<div style="display:flex;gap:8px;justify-content:center;margin-top:12px;flex-wrap:wrap">' +
        '<button class="kv-btn ghost" id="kvColPrev">← Prev</button>' +
        '<button class="kv-btn ghost" id="kvColReset">🗑 Reset</button>' +
        '<button class="kv-btn" id="kvColPrint">🖨️ Print</button>' +
        '<button class="kv-btn ghost" id="kvColNext">Next →</button></div>';
      var pal = body.querySelector('#kvColPal');
      PALETTE.slice(0, 12).forEach(function (c) {
        var s = el('span', { class: 'kv-sw' + (c === cur ? ' sel' : ''), style: 'background:' + c });
        s.onclick = function () { cur = c; pal.querySelectorAll('.kv-sw').forEach(function (x) { x.classList.remove('sel'); }); s.classList.add('sel'); };
        pal.appendChild(s);
      });
      var svg = body.querySelector('#kvColSvg');
      scene.shapes.forEach(function (sh) {
        var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        p.setAttribute('d', sh[1]); p.setAttribute('fill', '#fff'); p.setAttribute('stroke', '#334155'); p.setAttribute('stroke-width', '3'); p.style.cursor = 'pointer';
        p.onclick = function () { p.setAttribute('fill', cur); };
        svg.appendChild(p);
      });
      body.querySelectorAll('[data-cat]').forEach(function (b) { b.onclick = function () { openColouring(this.getAttribute('data-cat')); }; });
      body.querySelector('#kvColPrev').onclick = function () { sceneIdx = (sceneIdx - 1 + scenes.length) % scenes.length; render(); };
      body.querySelector('#kvColNext').onclick = function () { sceneIdx = (sceneIdx + 1) % scenes.length; render(); };
      body.querySelector('#kvColReset').onclick = function () { svg.querySelectorAll('path').forEach(function (p) { p.setAttribute('fill', '#fff'); }); };
      body.querySelector('#kvColPrint').onclick = function () {
        printHtml('My Colouring — ' + scene.t, '<div style="text-align:center">' + svg.outerHTML + '</div>');
      };
    }
    render();
  }
  window.kivoraOpenColouring = openColouring;

  /* ══════════════════════════════════════════════════════════════
     SHARED: speech + print helpers
     ══════════════════════════════════════════════════════════════ */
  function speak(text) {
    try {
      if (!('speechSynthesis' in window)) { toast('🔊 Read-aloud is not supported on this device'); return; }
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text); u.rate = 0.95; u.pitch = 1.05;
      speechSynthesis.speak(u);
    } catch (e) {}
  }
  function printHtml(title, inner) {
    var w = window.open('', '_blank');
    if (!w) { toast('Please allow pop-ups to print'); return; }
    w.document.write('<!doctype html><html><head><title>' + title + '</title><style>body{font-family:Nunito,Arial,sans-serif;padding:30px;color:#1e293b}h1{font-family:"Baloo 2",cursive}</style></head><body><h1>' + title + '</h1>' + inner + '<scr' + 'ipt>window.onload=function(){window.print()}</scr' + 'ipt></body></html>');
    w.document.close();
  }
  function printImage(dataUrl, title) { printHtml(title, '<img src="' + dataUrl + '" style="max-width:100%">'); }

  /* ══════════════════════════════════════════════════════════════
     WIRING — attach behaviour to existing homepage sections
     ══════════════════════════════════════════════════════════════ */
  function wireQuizzes() {
    var sec = document.getElementById('quizzes');
    if (!sec) return;
    var keys = ['alphabet', 'math', 'science', 'brain', 'story', 'more'];
    var cards = sec.querySelectorAll('.grid > div');
    cards.forEach(function (c, i) {
      if (!keys[i]) return;
      c.classList.add('kv-click', 'card-lift');
      c.setAttribute('role', 'button'); c.setAttribute('tabindex', '0');
      c.addEventListener('click', function () { startQuiz(keys[i]); });
      c.addEventListener('keydown', function (e) { if (e.key === 'Enter') startQuiz(keys[i]); });
    });
    // "Explore All 280 Quizzes" button
    var cta = sec.querySelector('a[href="./activities.html"]');
    if (cta) cta.addEventListener('click', function (e) { e.preventDefault(); openQuizPicker(); });
  }

  function wireCreativity() {
    // The creativity section has no id — find by heading text
    var hub = null;
    document.querySelectorAll('h2').forEach(function (h) { if (/Creativity Hub/i.test(h.textContent)) hub = h.closest('section'); });
    if (!hub) return;
    var map = ['draw', 'music', 'story', 'build'];
    var tiles = hub.querySelectorAll('.grid.grid-cols-2 > div');
    tiles.forEach(function (t, i) {
      if (!map[i]) return;
      t.classList.add('kv-click');
      t.setAttribute('role', 'button'); t.setAttribute('tabindex', '0');
      t.addEventListener('click', function () { creativeTool(map[i]); });
      t.addEventListener('keydown', function (e) { if (e.key === 'Enter') creativeTool(map[i]); });
    });
    var cta = hub.querySelector('a[href="./worlds.html#creativity-kingdom"]');
    if (cta) cta.addEventListener('click', function (e) { e.preventDefault(); creativeHome(); });
  }

  function wireSpecialNeeds() {
    var sec = document.getElementById('special-needs');
    if (sec) {
      var actions = [openStories, openA11y, openA11y, openStories, openCalm];
      var cards = sec.querySelectorAll('.grid > div');
      cards.forEach(function (c, i) {
        c.classList.add('kv-click');
        c.setAttribute('role', 'button'); c.setAttribute('tabindex', '0');
        c.addEventListener('click', actions[i] || openA11y);
      });
      var cta = sec.querySelector('a[href="./special-needs.html"]');
      if (cta) cta.addEventListener('click', function (e) { e.preventDefault(); openA11y(); });
    }
    // Replace the "Coming Soon: Special Needs Dashboard" block on the SPA page with a working toolkit
    var spa = document.getElementById('spa-special-needs');
    if (spa) {
      spa.querySelectorAll('h2').forEach(function (h) {
        if (/Coming Soon: Special Needs Dashboard/i.test(h.textContent)) {
          var box = h.parentElement;
          box.innerHTML =
            '<div style="font-size:3rem;margin-bottom:12px">🧰</div>' +
            '<h2 style="font-family:\'Baloo 2\',cursive;font-size:1.8rem;font-weight:800;color:#1e293b;margin:0 0 12px">Your Accessibility Toolkit</h2>' +
            '<p style="color:#475569;font-size:.95rem;line-height:1.7;max-width:480px;margin:0 auto 22px">Turn on supports that make learning comfortable — dyslexia-friendly text, larger fonts, high contrast, reduced motion and tap-to-hear read-aloud. Plus calm-down tools and social stories, ready right now.</p>' +
            '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">' +
            '<button class="kv-btn" onclick="kivoraOpenA11y()">♾️ Open Toolkit</button>' +
            '<button class="kv-btn ghost" onclick="kivoraOpenStories()">📖 Social Stories</button>' +
            '<button class="kv-btn ghost" onclick="kivoraOpenCalm()">🌿 Calm Corner</button></div>';
        }
      });
    }
  }

  function wireBlog() {
    var grid = document.getElementById('blogGrid');
    if (!grid) return;
    function attach() {
      Array.prototype.slice.call(grid.children).forEach(function (card) {
        if (card._kvWired) return; card._kvWired = true;
        card.classList.add('kv-click');
        var h = card.querySelector('h3');
        var title = h ? h.textContent.trim() : '';
        card.addEventListener('click', function () { openArticle(title); });
      });
    }
    attach();
    // blog is rendered by app.js on DOMContentLoaded; re-attach shortly after in case order differs
    setTimeout(attach, 400);
  }

  function wireColouring() {
    // Homepage #coloring teaser + spa-coloring category cards → open on-screen colouring studio
    // (keeps the existing print packs working too, but gives a clean de-duplicated on-screen tool)
    var teaser = document.getElementById('coloring');
    if (teaser) {
      var btn = el('div', { style: 'text-align:center;margin-top:18px' });
      var b = el('button', { class: 'kv-btn' }, '🖍️ Colour On-Screen Now');
      b.onclick = function () { openColouring('animals'); };
      btn.appendChild(b);
      var container = teaser.querySelector('.max-w-7xl') || teaser;
      container.appendChild(btn);
    }
  }

  /* ══════════════════════════════════════════════════════════════
     INIT
     ══════════════════════════════════════════════════════════════ */
  function safe(fn) { try { fn(); } catch (e) { if (window.console) console.warn('[kivora-enhance]', e); } }
  function init() {
    safe(applyA11y);
    safe(guardDeepLink);
    safe(wireQuizzes);
    safe(wireCreativity);
    safe(wireSpecialNeeds);
    safe(wireBlog);
    safe(wireColouring);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  // run again after a tick in case app.js renders dynamic content after us
  setTimeout(function () { wireBlog(); }, 600);

})();
