/**
 * ANIMA WELLNESS FIGHT CLUB — Interactions
 * Hero video · nav · reveals · modals · FAQ · smooth scroll
 */
(function () {
  'use strict';

  var WA_BASE = 'https://wa.me/5511943870655';

  /* =========================================================================
     Scroll Progress Bar
     ========================================================================= */
  function initScrollProgress() {
    var bar = document.getElementById('navProgress');
    if (!bar) return;

    function update() {
      var scrollTop = window.scrollY;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = pct + '%';
    }

    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  /* =========================================================================
     Nav Active Section
     ========================================================================= */
  function initNavActive() {
    var links = document.querySelectorAll('.nav-links a[href^="#"]');
    if (!links.length || !('IntersectionObserver' in window)) return;

    var sections = [];
    links.forEach(function (link) {
      var id = link.getAttribute('href');
      var section = document.querySelector(id);
      if (section) sections.push({ link: link, section: section });
    });

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            links.forEach(function (l) {
              l.classList.remove('is-active');
            });
            sections.forEach(function (s) {
              if (s.section === entry.target) s.link.classList.add('is-active');
            });
          }
        });
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
    );

    sections.forEach(function (s) {
      io.observe(s.section);
    });
  }

  /* =========================================================================
     Hero Parallax
     ========================================================================= */
  function initParallax() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var inner = document.getElementById('heroParallax');
    var hero = document.querySelector('.hero');
    if (!inner || !hero) return;

    var ticking = false;

    function update() {
      ticking = false;
      var rect = hero.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      var offset = window.scrollY * 0.28;
      inner.style.transform = 'translate3d(0,' + offset + 'px,0) scale(1.06)';
    }

    window.addEventListener(
      'scroll',
      function () {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      },
      { passive: true }
    );
  }

  /* =========================================================================
     Stat Counter Animation
     ========================================================================= */
  function initCounters() {
    var counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;

    function animateCounter(el) {
      if (el.dataset.counted === '1') return;
      el.dataset.counted = '1';

      var target = parseFloat(el.dataset.count);
      var decimals = parseInt(el.dataset.decimals || '0', 10);
      var suffix = el.dataset.suffix || '';
      var duration = 1800;
      var start = performance.now();

      function step(now) {
        var progress = Math.min((now - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 4);
        var value = target * eased;
        el.textContent =
          (decimals > 0 ? value.toFixed(decimals) : Math.floor(value).toLocaleString('pt-BR')) +
          suffix;
        if (progress < 1) requestAnimationFrame(step);
      }

      requestAnimationFrame(step);
    }

    counters.forEach(function (el) {
      if (el.dataset.text) {
        el.textContent = el.dataset.text;
        return;
      }
    });

    if (!('IntersectionObserver' in window)) {
      counters.forEach(animateCounter);
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach(function (el) {
      io.observe(el);
    });

    setTimeout(function () {
      counters.forEach(function (el) {
        if (el.dataset.counted !== '1' && !el.dataset.text) animateCounter(el);
      });
    }, 800);
  }

  /* =========================================================================
     Hero Video Autoplay
     ========================================================================= */
  function initHeroVideo() {
    var heroVideo = document.getElementById('heroVideo');
    if (!heroVideo) return;

    heroVideo.controls = false;
    heroVideo.setAttribute('controlsList', 'nodownload noplaybackrate noremoteplayback');
    heroVideo.setAttribute('aria-hidden', 'true');
    heroVideo.muted = true;
    heroVideo.loop = true;
    heroVideo.playsInline = true;

    function ensureHeroPlaying() {
      if (!heroVideo.paused && !heroVideo.ended) return;
      var playPromise = heroVideo.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(function () {});
      }
    }

    heroVideo.addEventListener('pause', ensureHeroPlaying);
    heroVideo.addEventListener('ended', function () {
      heroVideo.currentTime = 0;
      ensureHeroPlaying();
    });

    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) ensureHeroPlaying();
    });

    window.addEventListener('focus', ensureHeroPlaying);
    ensureHeroPlaying();
  }

  /* =========================================================================
     Mobile Menu Toggle
     ========================================================================= */
  function initMobileMenu() {
    var menu = document.getElementById('mobileMenu');
    var toggle = document.getElementById('menuToggle');
    if (!menu || !toggle) return;

    function setMenu(open) {
      menu.classList.toggle('is-open', open);
      menu.dataset.open = open ? '1' : '0';
      toggle.classList.toggle('is-active', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    }

    toggle.addEventListener('click', function () {
      setMenu(menu.dataset.open !== '1');
    });

    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        setMenu(false);
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.dataset.open === '1') setMenu(false);
    });
  }

  /* =========================================================================
     Nav Scroll Effect
     ========================================================================= */
  function initNavScroll() {
    var nav = document.getElementById('mainNav');
    if (!nav) return;

    var onScroll = function () {
      var scrolled = window.scrollY > 40;
      nav.classList.toggle('is-scrolled', scrolled);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* =========================================================================
     IntersectionObserver Reveal Animations
     ========================================================================= */
  function initRevealAnimations() {
    var els = document.querySelectorAll('[data-reveal]');
    if (!els.length) return;

    var heroReveals = document.querySelectorAll('.hero [data-reveal], .hero-panel[data-reveal]');
    heroReveals.forEach(function (el, i) {
      setTimeout(function () {
        el.classList.add('is-visible');
      }, 120 + i * 90);
    });

    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) {
        el.classList.add('is-visible');
      });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );

    els.forEach(function (el) {
      if (!el.closest('.hero') && !el.classList.contains('hero-panel')) io.observe(el);
    });

    setTimeout(function () {
      els.forEach(function (el) {
        if (!el.classList.contains('is-visible')) {
          el.classList.add('is-visible');
        }
      });
    }, 1200);
  }

  /* =========================================================================
     Modal System — Modalities
     ========================================================================= */
  var MODAL_DATA = {
    kickboxing: {
      tag: 'kickboxing',
      title: 'Kickboxing',
      imgClass: 'mod-kickboxing',
      desc: 'Potência, resistência e técnica de combate com aulas dinâmicas e instrutores certificados.',
      features: [
        'Combinações de socos, chutes e joelhadas',
        'Aulas em grupo com turmas reduzidas',
        'Condicionamento cardiovascular intenso',
        'Equipamentos de proteção inclusos',
        'Progressão técnica para todos os níveis'
      ],
      wa: 'Olá! Gostaria de agendar uma aula experimental de Kickboxing na ANIMA.'
    },
    funcional: {
      tag: 'funcional',
      title: 'Funcional',
      imgClass: 'mod-funcional',
      desc: 'Movimento, mobilidade e condicionamento em circuitos dinâmicos.',
      features: [
        'Circuitos funcionais de alta intensidade',
        'Mobilidade e estabilidade articular',
        'Treinos em grupo motivadores',
        'Baixo impacto nas articulações',
        'Periodização mensal personalizada'
      ],
      wa: 'Olá! Gostaria de agendar uma aula experimental de Funcional na ANIMA.'
    },
    'gelo-sauna': {
      tag: 'gelo · sauna',
      title: 'Banheira de Gelo & Sauna',
      imgClass: 'mod-gelo-sauna',
      desc: 'Recuperação muscular, imunidade e relaxamento com contrastes de calor e frio.',
      features: [
        'Banheira de gelo premium',
        'Sauna seca e úmida',
        'Terapia de contraste calor/frio',
        'Recuperação pós-treino',
        'Ambiente reservado e silencioso'
      ],
      wa: 'Olá! Gostaria de conhecer a Banheira de Gelo & Sauna na ANIMA.'
    },
    performance: {
      tag: 'performance',
      title: 'Performance & Saúde',
      imgClass: 'mod-performance',
      desc: 'Avaliação física, nutrição e recuperação para a sua longevidade.',
      features: [
        'Avaliação física completa',
        'Acompanhamento nutricional',
        'Bioimpedância periódica',
        'Plano de longevidade individual',
        'Integração com sala de recuperação'
      ],
      wa: 'Olá! Gostaria de saber mais sobre Performance & Saúde na ANIMA.'
    },
    'muay-thai': {
      tag: 'muay thai',
      title: 'Muay Thai',
      imgClass: 'mod-muay-thai',
      desc: 'Chutes, joelhadas e clinch com foco em condicionamento e técnica tailandesa.',
      features: [
        'Oito extremidades: punhos, cotovelos, joelhos e canelas',
        'Trabalho de clinch e saco pesado',
        'Técnica tailandesa autêntica',
        'Sparring controlado e supervisionado',
        'Luvas e protetores inclusos'
      ],
      wa: 'Olá! Gostaria de agendar uma aula experimental de Muay Thai na ANIMA.'
    },
    boxe: {
      tag: 'boxe',
      title: 'Boxe',
      imgClass: 'mod-boxe',
      desc: 'Footwork, defesa e combinações de socos para força, agilidade e confiança.',
      features: [
        'Footwork e defesa avançada',
        'Trabalho no saco e mitts',
        'Sparring técnico supervisionado',
        'Condicionamento explosivo',
        'Aulas para iniciantes e avançados'
      ],
      wa: 'Olá! Gostaria de agendar uma aula experimental de Boxe na ANIMA.'
    },
    'jiu-jitsu': {
      tag: 'jiu-jítsu',
      title: 'Jiu-Jítsu',
      imgClass: 'mod-jiu-jitsu',
      desc: 'Alavancas, quedas e controle no solo para autodefesa e performance no tatame.',
      features: [
        'Gi e No-Gi',
        'Quedas, passagens e finalizações',
        'Rolling supervisionado',
        'Graduação por faixa',
        'Ambiente respeitoso e técnico'
      ],
      wa: 'Olá! Gostaria de agendar uma aula experimental de Jiu-Jítsu na ANIMA.'
    },
    'judo-kids': {
      tag: 'judo kids',
      title: 'Judo Kids',
      imgClass: 'mod-judo-kids',
      desc: 'Judo exclusivo para crianças, com foco em disciplina, coordenação e diversão segura.',
      features: [
        'Exclusivo para crianças (4 a 12 anos)',
        'Judo olímpico adaptado à infância',
        'Disciplina, coordenação e socialização',
        'Turmas reduzidas e seguras',
        'Professores especializados em kids'
      ],
      wa: 'Olá! Gostaria de agendar uma aula experimental de Judo Kids na ANIMA.'
    },
    'mma-executivo': {
      tag: 'mma executivo',
      title: 'MMA Executivo',
      imgClass: 'mod-mma-executivo',
      desc: 'Striking, grappling e condicionamento para quem vive a rotina corporativa — foco, energia e performance com horários flexíveis.',
      features: [
        'Horários flexíveis para executivos',
        'Striking + grappling integrado',
        'Treinos de alta eficiência',
        'Ambiente premium e reservado',
        'Acompanhamento personalizado'
      ],
      wa: 'Olá! Gostaria de agendar uma aula experimental de MMA Executivo na ANIMA.'
    },
    musculacao: {
      tag: 'musculação',
      title: 'Musculação',
      imgClass: 'mod-musculacao',
      desc: 'Treino de força com equipamentos premium, periodização inteligente e acompanhamento técnico contínuo.',
      features: [
        'Equipamentos de alto padrão',
        'Fichas periodizadas mensalmente',
        'Avaliação postural e biomecânica',
        'Ambiente climatizado e reservado',
        'Integração com sala de recuperação'
      ],
      wa: 'Olá! Gostaria de agendar uma aula experimental de Musculação na ANIMA.'
    },
    personal: {
      tag: 'personal trainer',
      title: 'Personal Trainer',
      imgClass: 'mod-personal',
      desc: 'Acompanhamento individual exclusivo com treinador dedicado, foco total nos seus objetivos e evolução mensurável.',
      features: [
        'Treinador exclusivo em cada sessão',
        'Plano 100% personalizado',
        'Ajustes semanais conforme progresso',
        'Horários flexíveis',
        'Integração com nutrição e recuperação'
      ],
      wa: 'Olá! Gostaria de saber mais sobre Personal Trainer na ANIMA.'
    }
  };

  function initModals() {
    var modModal = document.getElementById('modModal');
    var modModalImg = document.getElementById('modModalImg');
    var modModalTag = document.getElementById('modModalTag');
    var modModalTitle = document.getElementById('modModalTitle');
    var modModalDesc = document.getElementById('modModalDesc');
    var modModalFeatures = document.getElementById('modModalFeatures');
    var modModalCta = document.getElementById('modModalCta');
    var lastFocus = null;

    if (!modModal) return;

    function openModModal(key) {
      var data = MODAL_DATA[key];
      if (!data) return;

      lastFocus = document.activeElement;

      if (modModalImg) {
        modModalImg.className = 'mod-modal-img mod-img ' + data.imgClass;
      }
      if (modModalTag) modModalTag.textContent = data.tag;
      if (modModalTitle) modModalTitle.textContent = data.title;
      if (modModalDesc) modModalDesc.textContent = data.desc;
      if (modModalFeatures) {
        modModalFeatures.innerHTML = data.features
          .map(function (f) {
            return '<li><span>✦</span> ' + f + '</li>';
          })
          .join('');
      }
      if (modModalCta) {
        modModalCta.href = WA_BASE + '?text=' + encodeURIComponent(data.wa);
      }

      modModal.classList.add('is-open');
      modModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';

      var closeBtn = modModal.querySelector('.mod-modal-close');
      if (closeBtn) closeBtn.focus();
    }

    function closeModModal() {
      modModal.classList.remove('is-open');
      modModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    }

    document.querySelectorAll('.mod-card[data-mod]').forEach(function (card) {
      card.addEventListener('click', function () {
        openModModal(card.dataset.mod);
      });
    });

    modModal.querySelectorAll('[data-close-modal]').forEach(function (el) {
      el.addEventListener('click', closeModModal);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modModal.classList.contains('is-open')) {
        closeModModal();
      }
    });
  }

  /* =========================================================================
     FAQ Accordion
     ========================================================================= */
  function initFaqAccordion() {
    var items = document.querySelectorAll('.faq-item');
    if (!items.length) return;

    items.forEach(function (item) {
      var question = item.querySelector('.faq-question');
      if (!question) return;

      question.addEventListener('click', function () {
        var isOpen = item.classList.contains('is-open');

        items.forEach(function (other) {
          if (other !== item) {
            other.classList.remove('is-open');
            var otherQ = other.querySelector('.faq-question');
            if (otherQ) otherQ.setAttribute('aria-expanded', 'false');
          }
        });

        item.classList.toggle('is-open', !isOpen);
        question.setAttribute('aria-expanded', !isOpen ? 'true' : 'false');
      });

      question.setAttribute('aria-expanded', 'false');
    });
  }

  /* =========================================================================
     Smooth Anchor Scroll
     ========================================================================= */
  function initSmoothScroll() {
    var nav = document.getElementById('mainNav');
    var navHeight = nav ? nav.offsetHeight : 80;

    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      var href = anchor.getAttribute('href');
      if (!href || href === '#') return;

      anchor.addEventListener('click', function (e) {
        var target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();
        var top = target.getBoundingClientRect().top + window.scrollY - navHeight;

        window.scrollTo({
          top: top,
          behavior: 'smooth'
        });
      });
    });
  }

  /* =========================================================================
     Init
     ========================================================================= */
  function initHeroLoaded() {
    var hero = document.querySelector('.hero');
    if (hero) hero.classList.add('is-loaded');
  }

  function init() {
    initHeroVideo();
    initHeroLoaded();
    initMobileMenu();
    initNavScroll();
    initScrollProgress();
    initNavActive();
    initParallax();
    initRevealAnimations();
    initCounters();
    initModals();
    initFaqAccordion();
    initSmoothScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
