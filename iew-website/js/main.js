(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const hasGSAP = !!window.gsap;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = matchMedia('(hover: none)').matches;
  $('#yr').textContent = new Date().getFullYear();

  /* ---------- Images (Unsplash, with fallbacks) ---------- */
  const unsplash = (id, w) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;
  const IMGS = window.IEW_IMAGES || {};
  $$('img[data-img]').forEach(img => {
    const key = img.dataset.img;
    const big = img.closest('.hero-bg,.hse-bg');
    const w = big ? 2000 : 1200;
    // own photo first (jpg / webp / png), then Unsplash fallbacks
    const srcs = [`assets/img/${key}.jpg`, `assets/img/${key}.webp`, `assets/img/${key}.png`, ...(IMGS[key] || []).map(id => unsplash(id, w))];
    let i = 0;
    img.loading = big ? 'eager' : 'lazy';
    img.decoding = 'async';
    img.onerror = () => {
      i++;
      if (i < srcs.length) img.src = srcs[i];
      else { img.classList.add('img-fail'); img.parentElement.classList.add('img-fail-wrap'); }
    };
    img.onload = () => window.ScrollTrigger && ScrollTrigger.refresh();
    img.src = srcs[0];
  });

  /* ---------- Fallback when GSAP fails to load ---------- */
  if (!hasGSAP) {
    $$('.hero-title .line>span').forEach(s => s.style.transform = 'none');
    $('#preloader').remove();
    document.body.classList.remove('loading');
    if ($('#plTable')) buildProjects(false);
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  document.body.classList.add('loading');
  const has = sel => !!$(sel);
  // full preloader on first visit, quick one when moving between pages
  let seen = false;
  try { seen = sessionStorage.getItem('iew-seen') === '1'; sessionStorage.setItem('iew-seen', '1'); } catch (e) {}

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    const target = id === '#top' ? 0 : $(id);
    if (target === null) return;
    e.preventDefault();
    closeMenu();
    lenis ? lenis.scrollTo(target, { offset: -20, duration: 1.6 }) : (target === 0 ? scrollTo({ top: 0, behavior: 'smooth' }) : target.scrollIntoView({ behavior: 'smooth' }));
  }));

  /* ---------- Split text into words ---------- */
  $$('.split').forEach(el => {
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w';
            const s = document.createElement('span'); s.textContent = part;
            w.appendChild(s); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') {
          if (n.tagName === 'EM') {
            const w = document.createElement('span'); w.className = 'w';
            n.replaceWith(w); const s = document.createElement('span'); s.appendChild(n); w.appendChild(s);
          } else walk(n);
        }
      });
    };
    walk(el);
  });

  /* ---------- Preloader ---------- */
  const num = $('#preNum'), bar = $('#preBar');
  const counter = { v: 0 };
  gsap.to(counter, {
    v: 100, duration: reduce ? .2 : seen ? .45 : 2, ease: 'power2.inOut',
    onUpdate: () => { const v = Math.round(counter.v); num.textContent = v; bar.style.width = v + '%'; },
    onComplete: exitLoader
  });
  function exitLoader() {
    const tl = gsap.timeline({ onComplete: () => { $('#preloader').remove(); document.body.classList.remove('loading'); lenis && lenis.start(); ScrollTrigger.refresh(); } });
    tl.to('.pre-inner', { opacity: 0, y: -30, duration: .5, ease: 'power2.in' })
      .to('.pre-panel.p1', { yPercent: -100, duration: 1, ease: 'expo.inOut' }, '-=.1')
      .to('.pre-panel.p2', { yPercent: 100, duration: 1, ease: 'expo.inOut' }, '<')
      .add(heroIntro, '-=.55');
  }
  function heroIntro() {
    const tl = gsap.timeline();
    tl.to('.hero-bg img', { scale: 1, duration: 2.2, ease: 'expo.out' })
      .to('.hero-title .line>span', { y: 0, duration: 1.3, stagger: .12, ease: 'expo.out' }, 0)
      .from('.hero .reveal-up', { y: 40, opacity: 0, duration: 1, stagger: .1, ease: 'power3.out' }, .35)
      .from('.nav', { y: -40, opacity: 0, duration: 1, ease: 'power3.out' }, .3)
      .from('.scroll-hint', { opacity: 0, duration: 1 }, 1);
    $$('.hero-side [data-count]').forEach(countUp);
  }

  /* ---------- Page transitions ---------- */
  const trans = document.createElement('div');
  trans.className = 'page-trans';
  trans.innerHTML = '<i></i><img src="assets/logo.png" alt=""><i></i>';
  document.body.appendChild(trans);
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    const href = a.getAttribute('href');
    if (!/^[\w-]+\.html(#.*)?$/.test(href)) return;
    e.preventDefault();
    closeMenu();
    gsap.timeline({ onComplete: () => { location.href = href; } })
      .to($$('i', trans), { scaleY: 1, duration: .6, ease: 'expo.inOut' })
      .to($('img', trans), { opacity: 1, duration: .25 }, '-=.2');
  });
  addEventListener('pageshow', e => { if (e.persisted) gsap.set([$$('i', trans), $('img', trans)], { clearProps: 'all' }); });

  /* ---------- Scroll animations ---------- */
  $$('.split').forEach(el => {
    gsap.from($$('.w>span', el), {
      yPercent: 110, rotate: 4, duration: 1.1, stagger: .045, ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 85%' }
    });
  });
  $$('.reveal-up').forEach(el => {
    if (el.closest('.hero')) return;
    gsap.from(el, { y: 50, opacity: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
  });
  $$('.reveal-stagger').forEach(el => {
    gsap.from(el.children, { y: 30, opacity: 0, duration: .9, stagger: .12, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 85%' } });
  });
  $$('.img-reveal').forEach(el => {
    const img = $('img', el);
    gsap.fromTo(el, { clipPath: 'inset(100% 0% 0% 0% round 18px)' }, { clipPath: 'inset(0% 0% 0% 0% round 18px)', duration: 1.5, ease: 'expo.inOut', scrollTrigger: { trigger: el, start: 'top 85%' } });
    gsap.to(img, { scale: 1, duration: 2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%' } });
  });
  $$('.parallax-img').forEach(img => {
    gsap.fromTo(img, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  if (has('.hero')) gsap.to('.hero-content', { yPercent: 25, opacity: .2, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  if (has('.badge-round')) gsap.from('.badge-round', { scale: 0, rotate: -180, duration: 1.4, ease: 'back.out(1.6)', scrollTrigger: { trigger: '.about-media', start: 'top 70%' } });

  const batchIn = (sel, opts = {}) => ScrollTrigger.batch(sel, {
    start: 'top 88%',
    onEnter: b => gsap.fromTo(b, { y: 70, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: .1, ease: 'power3.out', overwrite: true, ...opts })
  });
  ['.vm-card', '.wwd-card', '.val', '.member', '.hse-item', '.feat', '.person', '.logo-card'].forEach(sel => {
    if (!has(sel)) return;
    gsap.set(sel, { opacity: 0 });
    batchIn(sel);
  });
  if (has('.res-list')) gsap.from('.res-list.active li', { x: -40, opacity: 0, stagger: .07, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: '.res-list', start: 'top 80%' } });
  if (has('.cta')) gsap.from('.cta-btn', { scale: 0, rotate: -90, duration: 1.2, ease: 'back.out(1.7)', scrollTrigger: { trigger: '.cta', start: 'top 60%' } });
  gsap.from('.ft-big', { yPercent: 60, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.footer', start: 'top 80%' } });
  if (has('.strip')) gsap.from('.strip', { xPercent: -10, ease: 'none', scrollTrigger: { trigger: '.strip', start: 'top bottom', end: 'bottom top', scrub: true } });

  /* ---------- Counters ---------- */
  function countUp(el) {
    const end = +el.dataset.count, suf = el.dataset.suffix || '', plain = el.dataset.plain;
    const o = { v: plain ? end - 40 : 0 };
    gsap.to(o, { v: end, duration: 2.2, ease: 'power3.out', onUpdate: () => el.textContent = Math.round(o.v) + suf });
  }
  $$('[data-count]').forEach(el => {
    if (el.closest('.hero')) return;
    ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => countUp(el) });
  });

  /* ---------- Horizontal services ---------- */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 901px)', () => {
    const track = $('#hsTrack');
    if (!track) return;
    const dist = () => track.scrollWidth - innerWidth;
    gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: '.hscroll', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 }
    });
  });
  mm.add('(max-width: 900px)', () => { if (has('.svc')) batchIn('.svc'); });

  /* ---------- Nav / progress ---------- */
  const nav = $('#nav'), prog = $('#progress');
  let lastY = 0;
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: self => {
      const y = self.scroll();
      nav.classList.toggle('scrolled', y > 60);
      nav.classList.toggle('hide', y > 500 && y > lastY && !$('#navLinks').classList.contains('open'));
      lastY = y;
      prog.style.transform = `scaleX(${self.progress})`;
    }
  });
  const burger = $('#burger'), links = $('#navLinks');
  burger.addEventListener('click', () => {
    const open = links.classList.toggle('open'); burger.classList.toggle('open', open);
    open ? lenis && lenis.stop() : lenis && lenis.start();
    if (open) gsap.fromTo($$('a', links), { y: 40, opacity: 0 }, { y: 0, opacity: 1, stagger: .06, delay: .25, duration: .6, ease: 'power3.out' });
  });
  function closeMenu() { if (links.classList.contains('open')) { links.classList.remove('open'); burger.classList.remove('open'); lenis && lenis.start(); } }

  /* ---------- Cursor + magnetic + tilt ---------- */
  if (!isTouch) {
    const c = $('#cursor'), d = $('#cursorDot');
    const cx = gsap.quickTo(c, 'x', { duration: .45, ease: 'power3' }), cy = gsap.quickTo(c, 'y', { duration: .45, ease: 'power3' });
    const dx = gsap.quickTo(d, 'x', { duration: .1 }), dy = gsap.quickTo(d, 'y', { duration: .1 });
    addEventListener('mousemove', e => { cx(e.clientX); cy(e.clientY); dx(e.clientX); dy(e.clientY); });
    $$('a,button,.svc,.feat,input,select,textarea').forEach(el => {
      el.addEventListener('mouseenter', () => c.classList.add('hover'));
      el.addEventListener('mouseleave', () => c.classList.remove('hover'));
    });
    $$('.magnetic').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * .3, y: (e.clientY - r.top - r.height / 2) * .4, duration: .4, ease: 'power3' });
      });
      el.addEventListener('mouseleave', () => gsap.to(el, { x: 0, y: 0, duration: .7, ease: 'elastic.out(1,.4)' }));
    });
    $$('.tilt').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        el.style.setProperty('--mx', px * 100 + '%'); el.style.setProperty('--my', py * 100 + '%');
        gsap.to(el, { rotateY: (px - .5) * 8, rotateX: (.5 - py) * 8, transformPerspective: 900, duration: .5 });
      });
      el.addEventListener('mouseleave', () => gsap.to(el, { rotateX: 0, rotateY: 0, duration: .8, ease: 'power3' }));
    });
  }

  /* ---------- Tabs ---------- */
  $$('.tab').forEach(t => t.addEventListener('click', () => {
    $$('.tab').forEach(x => x.classList.toggle('active', x === t));
    $$('.res-list').forEach(p => p.classList.toggle('active', p.dataset.panel === t.dataset.tab));
    gsap.fromTo('.res-list.active li', { x: -30, opacity: 0 }, { x: 0, opacity: 1, stagger: .05, duration: .6, ease: 'power3.out' });
    ScrollTrigger.refresh();
  }));

  /* ---------- Form ---------- */
  if (has('#quoteForm')) $('#quoteForm').addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const body = `Name: ${f.get('name')}\nCompany: ${f.get('company')}\nPhone: ${f.get('phone')}\nEmail: ${f.get('email')}\nService: ${f.get('service')}\n\n${f.get('msg')}`;
    location.href = `mailto:info@ieworkspk.com?subject=${encodeURIComponent('Project inquiry – ' + f.get('service'))}&body=${encodeURIComponent(body)}`;
  });

  if (has('#plTable')) buildProjects(true);
  initHero3D();
  addEventListener('load', () => ScrollTrigger.refresh());

  /* ---------- Project table ---------- */
  function buildProjects(anim) {
    const data = window.IEW_PROJECTS || [];
    const table = $('#plTable'), filters = $('#plFilters'), search = $('#plSearch'), more = $('#plMore');
    const years = ['All', ...[...new Set(data.map(p => p[0].slice(-4)))].sort((a, b) => b - a)];
    let year = 'All', q = '', shown = 10;
    filters.innerHTML = years.map(y => `<button class="${y === 'All' ? 'active' : ''}" data-y="${y}">${y}</button>`).join('');
    const total = data.reduce((s, p) => s + p[4], 0);
    const totalEl = $('#plTotal');
    if (anim) ScrollTrigger.create({ trigger: totalEl, start: 'top 90%', once: true, onEnter: () => { const o = { v: 0 }; gsap.to(o, { v: total, duration: 2.4, ease: 'power3.out', onUpdate: () => totalEl.textContent = o.v.toFixed(1) + 'M' }); } });
    else totalEl.textContent = total.toFixed(1) + 'M';

    const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    function render(fresh) {
      const list = data.filter(p => (year === 'All' || p[0].endsWith(year)) && (!q || (p[1] + p[2] + p[3]).toLowerCase().includes(q)));
      const rows = list.slice(0, shown);
      table.innerHTML = `<div class="pl-row head"><span>Date</span><span>Project</span><span>Scope</span><span>Client</span><span style="text-align:right">PKR</span></div>` +
        (rows.length ? rows.map(p => `<div class="pl-row"><span class="pl-date">${p[0]}</span><span class="pl-name">${esc(p[1])}</span><span class="pl-desc">${esc(p[2])}</span><span class="pl-client">${esc(p[3])}</span><span class="pl-cost">${p[4]}M</span></div>`).join('')
          : `<div class="pl-empty">No projects match your search.</div>`);
      more.style.display = list.length > shown ? '' : 'none';
      if (anim && fresh) gsap.from($$('.pl-row:not(.head)', table), { y: 20, opacity: 0, stagger: .03, duration: .5, ease: 'power2.out' });
      if (anim) ScrollTrigger.refresh();
    }
    filters.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      year = b.dataset.y; shown = 10;
      $$('button', filters).forEach(x => x.classList.toggle('active', x === b));
      render(true);
    });
    search.addEventListener('input', () => { q = search.value.trim().toLowerCase(); shown = 10; render(false); });
    more.addEventListener('click', () => { shown += 15; render(false); });
    render(false);
  }

  /* ---------- Three.js hero: wave field + wire structure ---------- */
  function initHero3D() {
    const canvas = $('#hero3d');
    if (!window.THREE || !canvas) return;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(55, 1, .1, 200);
    cam.position.set(0, 6, 22);

    // point wave field
    const cols = innerWidth < 700 ? 60 : 110, rows = 60, gap = .55;
    const pos = new Float32Array(cols * rows * 3);
    let k = 0;
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      pos[k++] = (i - cols / 2) * gap; pos[k++] = 0; pos[k++] = (j - rows / 2) * gap;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({ size: .07, color: 0xff7a3d, transparent: true, opacity: .75 });
    const field = new THREE.Points(g, m);
    field.position.y = -4;
    scene.add(field);

    // wireframe "engineered" structure
    const group = new THREE.Group();
    const ico = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(3.2, 1)), new THREE.LineBasicMaterial({ color: 0x3fa9f5, transparent: true, opacity: .55 }));
    const inner = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.OctahedronGeometry(1.6, 0)), new THREE.LineBasicMaterial({ color: 0xff5b1f, transparent: true, opacity: .9 }));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(4.6, .015, 8, 120), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .25 }));
    ring.rotation.x = Math.PI / 2.4;
    const ring2 = ring.clone(); ring2.scale.setScalar(1.18); ring2.rotation.y = .5;
    group.add(ico, inner, ring, ring2);
    scene.add(group);

    const place = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
      group.position.set(w < 900 ? 0 : 8.5, w < 900 ? 4.5 : 2.5, 0);
      group.scale.setScalar(w < 900 ? .7 : 1);
    };
    place(); addEventListener('resize', place);

    let mx = 0, my = 0, visible = true;
    addEventListener('mousemove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });
    new IntersectionObserver(([en]) => visible = en.isIntersecting).observe(canvas);

    const arr = g.attributes.position.array;
    const clock = new THREE.Clock();
    (function loop() {
      requestAnimationFrame(loop);
      if (!visible) return;
      const t = reduce ? 0 : clock.getElapsedTime();
      for (let i = 0, n = 0; i < cols; i++) for (let j = 0; j < rows; j++, n += 3) {
        const x = arr[n], z = arr[n + 2];
        arr[n + 1] = Math.sin(x * .35 + t * .9) * .6 + Math.cos(z * .3 + t * .7) * .6;
      }
      g.attributes.position.needsUpdate = true;
      ico.rotation.x = t * .12; ico.rotation.y = t * .18;
      inner.rotation.x = -t * .3; inner.rotation.y = -t * .22;
      ring.rotation.z = t * .2; ring2.rotation.z = -t * .15;
      group.position.y += Math.sin(t * 1.2) * .003;
      cam.position.x += (mx * 4 - cam.position.x) * .04;
      cam.position.y += (6 - my * 3 - cam.position.y) * .04;
      cam.lookAt(0, 0, 0);
      renderer.render(scene, cam);
    })();
  }
})();
