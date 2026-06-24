
/* Kivora — shared.js  v1.0
   Injects nav + footer, handles mobile menu, dark mode, scroll reveal,
   back-to-top, and URL-param auth redirect. */

(function () {
  /* ── Data ─────────────────────────────────────────── */
  const NAV_LINKS = [
    { href: './activities.html', label: 'Activities', color: 'kivora-purple' },
    { href: './games.html',      label: 'Games',      color: 'kivora-orange' },
    { href: './stories.html',    label: 'Stories',    color: 'kivora-pink'   },
    { href: './printables.html', label: 'Printables', color: 'kivora-green'  },
    { href: './parents.html',    label: 'Parents',    color: 'kivora-indigo' },
    { href: './teachers.html',   label: 'Teachers',   color: 'kivora-teal'   },
    { href: './pricing.html',    label: 'Pricing',    color: 'kivora-yellow' },
  ];

  const WORLDS = [
    { slug:'alphabet-island',     emoji:'🏝️', name:'Alphabet Island'    },
    { slug:'math-mountain',       emoji:'⛰️', name:'Math Mountain'       },
    { slug:'story-cove',          emoji:'🌊', name:'Story Cove'          },
    { slug:'creativity-kingdom',  emoji:'🎨', name:'Creativity Kingdom'  },
    { slug:'science-safari',      emoji:'🔬', name:'Science Safari'      },
    { slug:'life-skills-village', emoji:'🏘️', name:'Life Skills Village' },
    { slug:'coding-city',         emoji:'💻', name:'Coding City'         },
    { slug:'music-meadow',        emoji:'🎵', name:'Music Meadow'        },
    { slug:'brain-game-galaxy',   emoji:'🧠', name:'Brain Game Galaxy'   },
  ];

  const isHome = location.pathname === '/' || location.pathname.endsWith('/index.html') || location.pathname.endsWith('/');

  function navHref(hash) {
    return isHome ? hash : '/' + hash;
  }

  /* ── Inject Nav ──────────────────────────────────── */
  const navHTML = `
<header id="mainHeader" style="position:sticky;top:0;z-index:50;background:rgba(255,255,255,.95);backdrop-filter:blur(12px);border-bottom:2px solid #FFD93D;box-shadow:0 1px 4px rgba(0,0,0,.06);transition:all .3s">
  <div style="max-width:80rem;margin:0 auto;padding:0 1.5rem;display:flex;align-items:center;justify-content:space-between;height:64px">
    <a href="./index.html" style="display:flex;align-items:center;gap:8px;text-decoration:none">
      <div style="width:40px;height:40px;background:linear-gradient(135deg,#7C3AED,#FF4E8B);border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:1.4rem" class="animate-wiggle">🦊</div>
      <span style="font-family:'Baloo 2',cursive;font-size:1.5rem;font-weight:800;background:linear-gradient(to right,#7C3AED,#FF4E8B);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Kivora Learning</span>
    </a>
    <nav id="desktopNav" style="display:none;align-items:center;gap:4px">
      ${NAV_LINKS.map(l => `<a href="${l.href}" style="padding:8px 14px;border-radius:10px;font-weight:700;font-size:.9rem;color:#475569;text-decoration:none;transition:all .2s" onmouseover="this.style.background='#7C3AED22';this.style.color='#7C3AED'" onmouseout="this.style.background='';this.style.color='#475569'">${l.label}</a>`).join('')}
    </nav>
    <div style="display:flex;align-items:center;gap:8px">
      <button id="darkToggle" style="padding:8px;border-radius:10px;background:#f1f5f9;border:none;cursor:pointer;font-size:1.1rem" title="Toggle dark mode">🌙</button>
      <a id="nav-login-btn" href="./index.html?auth=login" style="display:none;padding:8px 16px;border-radius:10px;font-weight:700;color:#7C3AED;border:2px solid #7C3AED;text-decoration:none;font-size:.88rem;transition:all .2s" onmouseover="this.style.background='#7C3AED';this.style.color='#fff'" onmouseout="this.style.background='';this.style.color='#7C3AED'">Login</a>
      <a id="nav-start-btn" href="./index.html?auth=register" style="display:none;padding:8px 16px;border-radius:10px;font-weight:700;color:#fff;background:linear-gradient(to right,#FF6B35,#FF4E8B);text-decoration:none;font-size:.88rem">Start Free 🚀</a>
      <a id="nav-dash-btn"  href="./index.html" style="display:none;padding:8px 16px;border-radius:10px;font-weight:700;color:#fff;background:linear-gradient(to right,#7C3AED,#4F46E5);text-decoration:none;font-size:.88rem">Dashboard ⚡</a>
      <button id="mobileMenuBtn" style="padding:8px;border-radius:10px;background:#f1f5f9;border:none;cursor:pointer;font-size:1.2rem">☰</button>
    </div>
  </div>
  <div id="mobileMenu" style="display:none;background:#fff;border-top:1px solid #f1f5f9;padding:12px 16px 16px">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
      ${NAV_LINKS.map(l => `<a href="${l.href}" style="padding:10px;border-radius:12px;background:#f8fafc;font-weight:700;font-size:.85rem;color:#475569;text-decoration:none;text-align:center">${l.label}</a>`).join('')}
    </div>
    <div style="display:flex;gap:8px">
      <a href="./index.html?auth=login"    style="flex:1;padding:10px;border-radius:12px;font-weight:700;color:#7C3AED;border:2px solid #7C3AED;text-decoration:none;text-align:center;font-size:.88rem">Login</a>
      <a href="./index.html?auth=register" style="flex:1;padding:10px;border-radius:12px;font-weight:700;color:#fff;background:linear-gradient(to right,#FF6B35,#FF4E8B);text-decoration:none;text-align:center;font-size:.88rem">Start Free 🚀</a>
    </div>
  </div>
</header>`;

  const footerHTML = `
<footer style="background:#0f172a;color:#fff;padding:64px 0 32px">
  <div style="max-width:80rem;margin:0 auto;padding:0 1.5rem">
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:32px;margin-bottom:48px">
      <div style="grid-column:span 2">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
          <span style="font-size:1.8rem">🦊</span>
          <span style="font-family:'Baloo 2',cursive;font-size:1.4rem;font-weight:800;background:linear-gradient(to right,#FFD93D,#FF6B35);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Kivora Learning</span>
        </div>
        <p style="color:#94a3b8;font-size:.85rem;font-weight:600;line-height:1.6;margin-bottom:14px">Where every child discovers the magic of learning! Pre-school to Grade 5 worldwide.</p>
        <div style="display:flex;gap:8px">
          <a href="#" style="width:34px;height:34px;background:#1e293b;border-radius:10px;display:flex;align-items:center;justify-content:center;text-decoration:none;font-size:.85rem;transition:background .2s" title="Facebook">📘</a>
          <a href="#" style="width:34px;height:34px;background:#1e293b;border-radius:10px;display:flex;align-items:center;justify-content:center;text-decoration:none;font-size:.85rem" title="Instagram">📸</a>
          <a href="#" style="width:34px;height:34px;background:#1e293b;border-radius:10px;display:flex;align-items:center;justify-content:center;text-decoration:none;font-size:.85rem" title="Twitter">🐦</a>
          <a href="#" style="width:34px;height:34px;background:#1e293b;border-radius:10px;display:flex;align-items:center;justify-content:center;text-decoration:none;font-size:.85rem" title="YouTube">▶️</a>
        </div>
      </div>
      <div>
        <h4 style="font-family:'Baloo 2',cursive;font-weight:800;font-size:1rem;margin-bottom:14px;color:#FFD93D">Learn</h4>
        <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px">
          <li><a href="./activities.html" style="color:#94a3b8;text-decoration:none;font-size:.85rem;font-weight:600;transition:color .2s" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#94a3b8'">Activities</a></li>
          <li><a href="./games.html"      style="color:#94a3b8;text-decoration:none;font-size:.85rem;font-weight:600;transition:color .2s" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#94a3b8'">Games</a></li>
          <li><a href="./stories.html"    style="color:#94a3b8;text-decoration:none;font-size:.85rem;font-weight:600;transition:color .2s" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#94a3b8'">Stories</a></li>
          <li><a href="./coloring.html"   style="color:#94a3b8;text-decoration:none;font-size:.85rem;font-weight:600;transition:color .2s" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#94a3b8'">Coloring</a></li>
          <li><a href="./printables.html" style="color:#94a3b8;text-decoration:none;font-size:.85rem;font-weight:600;transition:color .2s" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#94a3b8'">Printables</a></li>
          <li><a href="./paths.html"      style="color:#94a3b8;text-decoration:none;font-size:.85rem;font-weight:600;transition:color .2s" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#94a3b8'">Learning Paths</a></li>
        </ul>
      </div>
      <div>
        <h4 style="font-family:'Baloo 2',cursive;font-weight:800;font-size:1rem;margin-bottom:14px;color:#FF4E8B">Worlds</h4>
        <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px">
          <li><a href="./worlds.html#alphabet-island"    style="color:#94a3b8;text-decoration:none;font-size:.85rem;font-weight:600" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#94a3b8'">🏝️ Alphabet Island</a></li>
          <li><a href="./worlds.html#math-mountain"      style="color:#94a3b8;text-decoration:none;font-size:.85rem;font-weight:600" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#94a3b8'">⛰️ Math Mountain</a></li>
          <li><a href="./worlds.html#story-cove"         style="color:#94a3b8;text-decoration:none;font-size:.85rem;font-weight:600" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#94a3b8'">🌊 Story Cove</a></li>
          <li><a href="./worlds.html#science-safari"     style="color:#94a3b8;text-decoration:none;font-size:.85rem;font-weight:600" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#94a3b8'">🔬 Science Safari</a></li>
          <li><a href="./worlds.html#coding-city"        style="color:#94a3b8;text-decoration:none;font-size:.85rem;font-weight:600" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#94a3b8'">💻 Coding City</a></li>
          <li><a href="./worlds.html" style="color:#FFD93D;text-decoration:none;font-size:.85rem;font-weight:700" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#FFD93D'">→ All 9 Worlds</a></li>
        </ul>
      </div>
      <div>
        <h4 style="font-family:'Baloo 2',cursive;font-weight:800;font-size:1rem;margin-bottom:14px;color:#0EA5E9">Families</h4>
        <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px">
          <li><a href="./parents.html"  style="color:#94a3b8;text-decoration:none;font-size:.85rem;font-weight:600" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#94a3b8'">For Parents</a></li>
          <li><a href="./teachers.html" style="color:#94a3b8;text-decoration:none;font-size:.85rem;font-weight:600" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#94a3b8'">For Teachers</a></li>
          <li><a href="./pricing.html"  style="color:#94a3b8;text-decoration:none;font-size:.85rem;font-weight:600" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#94a3b8'">Pricing</a></li>
          <li><a href="./index.html?auth=login"   style="color:#94a3b8;text-decoration:none;font-size:.85rem;font-weight:600" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#94a3b8'">Login</a></li>
          <li><a href="./compliance.html" style="color:#94a3b8;text-decoration:none;font-size:.85rem;font-weight:600" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#94a3b8'">Compliance</a></li>
        </ul>
      </div>
      <div>
        <h4 style="font-family:'Baloo 2',cursive;font-weight:800;font-size:1rem;margin-bottom:14px;color:#A3E635">Company</h4>
        <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px">
          <li><a href="./about.html"      style="color:#94a3b8;text-decoration:none;font-size:.85rem;font-weight:600" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#94a3b8'">About Us</a></li>
          <li><a href="./blog.html"       style="color:#94a3b8;text-decoration:none;font-size:.85rem;font-weight:600" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#94a3b8'">Blog</a></li>
          <li><a href="./careers.html"    style="color:#94a3b8;text-decoration:none;font-size:.85rem;font-weight:600" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#94a3b8'">Careers</a></li>
          <li><a href="./privacy.html"    style="color:#94a3b8;text-decoration:none;font-size:.85rem;font-weight:600" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#94a3b8'">Privacy Policy</a></li>
          <li><a href="./terms.html"      style="color:#94a3b8;text-decoration:none;font-size:.85rem;font-weight:600" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#94a3b8'">Terms of Service</a></li>
        </ul>
      </div>
    </div>
    <div style="border-top:1px solid #1e293b;padding-top:24px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px">
      <div style="color:#64748b;font-size:.82rem;font-weight:600">© 2026 Kivora Learning. All rights reserved. Made with ❤️ for every child on earth. 🌍 Worldwide · English</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px">
        <span style="background:#1e293b;border-radius:999px;padding:4px 10px;font-size:.72rem;font-weight:700;color:#94a3b8">🔒 COPPA Safe</span>
        <span style="background:#1e293b;border-radius:999px;padding:4px 10px;font-size:.72rem;font-weight:700;color:#94a3b8">🛡️ GDPR-K Safe</span>
        <span style="background:#1e293b;border-radius:999px;padding:4px 10px;font-size:.72rem;font-weight:700;color:#94a3b8">👶 Child-Safe</span>
        <span style="background:#1e293b;border-radius:999px;padding:4px 10px;font-size:.72rem;font-weight:700;color:#94a3b8">🚫 Zero Ads</span>
      </div>
    </div>
  </div>
</footer>`;

  /* ── Inject ─────────────────────────────────────────── */
  const nr = document.getElementById('nav-root');
  const fr = document.getElementById('footer-root');
  if (nr) nr.innerHTML = navHTML;
  if (fr) fr.innerHTML = footerHTML;

  /* ── Desktop nav show ───────────────────────────────── */
  const dn = document.getElementById('desktopNav');
  if (dn) {
    const show = () => { if (window.innerWidth >= 1024) dn.style.display = 'flex'; else dn.style.display = 'none'; };
    show(); window.addEventListener('resize', show);
  }

  /* ── Auth state from localStorage ────────────────────── */
  const loginBtn = document.getElementById('nav-login-btn');
  const startBtn = document.getElementById('nav-start-btn');
  const dashBtn  = document.getElementById('nav-dash-btn');

  function _lsGetNav(k){ try{ return JSON.parse(localStorage.getItem(k)); }catch(e){ return null; } }

  function refreshNavAuth() {
    const activeId = _lsGetNav('kivora_active_child');
    const children = _lsGetNav('kivora_children') || [];
    const child    = children.find(c => c.id === activeId) || null;
    if (child) {
      if (loginBtn) loginBtn.style.display = 'none';
      if (startBtn) startBtn.style.display = 'none';
      if (dashBtn)  {
        dashBtn.style.display = 'inline-flex';
        dashBtn.textContent = child.avatar + ' ' + child.name;
        dashBtn.href = './index.html';
      }
    } else {
      if (loginBtn) loginBtn.style.display = 'inline-flex';
      if (startBtn) startBtn.style.display = 'inline-flex';
      if (dashBtn)  dashBtn.style.display  = 'none';
    }
  }

  refreshNavAuth();

  /* Keep nav in sync if another tab changes auth */
  window.addEventListener('storage', function(e) {
    if (e.key === 'kivora_active_child' || e.key === 'kivora_children') refreshNavAuth();
  });

  /* ── Mobile menu ─────────────────────────────────────── */
  const mBtn = document.getElementById('mobileMenuBtn');
  const mMenu = document.getElementById('mobileMenu');
  if (mBtn && mMenu) {
    mBtn.addEventListener('click', () => {
      const open = mMenu.style.display !== 'none';
      mMenu.style.display = open ? 'none' : 'block';
      mBtn.textContent = open ? '☰' : '✕';
    });
  }

  /* ── Dark mode ───────────────────────────────────────── */
  const dBtn = document.getElementById('darkToggle');
  const applyDark = (on) => { document.documentElement.classList.toggle('dark', on); if (dBtn) dBtn.textContent = on ? '☀️' : '🌙'; };
  applyDark(localStorage.getItem('kivora-dark') === '1');
  if (dBtn) dBtn.addEventListener('click', () => {
    const on = !document.documentElement.classList.contains('dark');
    applyDark(on); localStorage.setItem('kivora-dark', on ? '1' : '0');
  });

  /* ── Scroll reveal ───────────────────────────────────── */
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.12 });
  const revealAll = () => document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', revealAll);
  else revealAll();

  /* ── Back to top ─────────────────────────────────────── */
  const bt = document.getElementById('back-top');
  if (bt) window.addEventListener('scroll', () => {
    bt.style.display = scrollY > 400 ? 'flex' : 'none';
  });

  /* ── URL-param auth redirect (index.html handles the modal) */
  if (location.pathname === '/' || location.pathname.endsWith('index.html') || location.pathname.endsWith('/')) {
    const p = new URLSearchParams(location.search).get('auth');
    if (p === 'login')    { setTimeout(() => typeof openPage === 'function' && openPage('login'),    300); }
    if (p === 'register') { setTimeout(() => typeof openPage === 'function' && openPage('register'), 300); }
  }

  /* ── Auth nav update (called by Firebase module on each page) */
  /* kivoraSetNavAuth kept for compatibility */
  window.kivoraSetNavAuth = function() { refreshNavAuth(); };
  window.kivoraRefreshNav = refreshNavAuth;
})();
