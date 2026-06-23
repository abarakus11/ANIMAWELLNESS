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
    if (window.CSS && CSS.supports && CSS.supports('animation-timeline', 'scroll()')) return;
  }

  /* =========================================================================
     Nav Scroll Effect (IntersectionObserver — no scroll listeners)
     ========================================================================= */
  function initNavScroll() {
    var nav = document.getElementById('mainNav');
    var sentinel = document.getElementById('navScrollSentinel');
    if (!nav || !sentinel || !('IntersectionObserver' in window)) return;

    var io = new IntersectionObserver(
      function (entries) {
        nav.classList.toggle('is-scrolled', !entries[0].isIntersecting);
      },
      { threshold: 0 }
    );

    io.observe(sentinel);
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
     Hero Parallax — static scale only (taste-skill: no scroll listeners)
     ========================================================================= */
  function initParallax() {
    /* Parallax via scroll is intentionally disabled. Hero uses CSS scale only. */
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
     Hero Video — background only (export do YouTube 7hd429vNaR4)
     ========================================================================= */
  function initHeroVideo() {
    var heroVideo = document.getElementById('heroVideo');
    if (!heroVideo || heroVideo.tagName !== 'VIDEO') return;

    heroVideo.controls = false;
    heroVideo.removeAttribute('controls');
    heroVideo.setAttribute('controlsList', 'nodownload nofullscreen noremoteplayback noplaybackrate');
    heroVideo.setAttribute('disablePictureInPicture', '');
    heroVideo.setAttribute('disableRemotePlayback', '');
    heroVideo.setAttribute('aria-hidden', 'true');
    heroVideo.muted = true;
    heroVideo.defaultMuted = true;
    heroVideo.loop = true;
    heroVideo.playsInline = true;
    heroVideo.tabIndex = -1;

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
    'judo-infantil': {
      tag: 'programa infantil · judô',
      title: 'Judô · Programa Infantil',
      imgClass: 'mod-judo-infantil',
      desc: 'Judô olímpico adaptado à infância, com foco em disciplina, coordenação, respeito e diversão segura.',
      features: [
        'Exclusivo para crianças (4 a 12 anos)',
        'Quedas, equilíbrio e coordenação motora',
        'Socialização e autoconfiança',
        'Turmas reduzidas e supervisionadas',
        'Professores especializados em kids'
      ],
      wa: 'Olá! Gostaria de agendar uma aula experimental de Judô Infantil na ANIMA.'
    },
    'karate-infantil': {
      tag: 'programa infantil · karatê',
      title: 'Karatê · Programa Infantil',
      imgClass: 'mod-karate-infantil',
      desc: 'Karatê para crianças com técnica progressiva, foco, respeito e desenvolvimento emocional.',
      features: [
        'Fundamentos de postura e kata',
        'Disciplina e concentração',
        'Autodefesa adaptada à idade',
        'Ambiente acolhedor e familiar',
        'Graduação por faixa'
      ],
      wa: 'Olá! Gostaria de agendar uma aula experimental de Karatê Infantil na ANIMA.'
    },
    boxe: {
      tag: 'masculino & feminino · boxe',
      title: 'Boxe',
      imgClass: 'mod-boxe',
      desc: 'Footwork, defesa e combinações de socos para força, agilidade e confiança.',
      features: [
        'Footwork e defesa avançada',
        'Trabalho no saco e mitts',
        'Sparring técnico supervisionado',
        'Condicionamento explosivo',
        'Turmas para todos os níveis'
      ],
      wa: 'Olá! Gostaria de agendar uma aula experimental de Boxe na ANIMA.'
    },
    'jiu-jitsu': {
      tag: 'masculino & feminino · jiu-jítsu',
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
    'defesa-pessoal': {
      tag: 'masculino & feminino · defesa pessoal',
      title: 'Defesa Pessoal',
      imgClass: 'mod-defesa-pessoal',
      desc: 'Técnicas práticas de proteção, prevenção e reação para situações reais do dia a dia.',
      features: [
        'Bloqueios, escapes e neutralização de ameaças',
        'Treino para homens e mulheres',
        'Situações reais simuladas com segurança',
        'Desenvolvimento de confiança e consciência situacional',
        'Instrutores com experiência em artes marciais'
      ],
      wa: 'Olá! Gostaria de agendar uma aula experimental de Defesa Pessoal na ANIMA.'
    },
    'kick-boxe': {
      tag: 'treino híbrido · kick boxe',
      title: 'Kick Boxe',
      imgClass: 'mod-kick-boxe',
      desc: 'Potência, resistência e técnica de combate dinâmica integrada ao treino híbrido.',
      features: [
        'Combinações de socos, chutes e joelhadas',
        'Condicionamento cardiovascular intenso',
        'Integração com artes marciais híbridas',
        'Equipamentos de proteção inclusos',
        'Progressão para todos os níveis'
      ],
      wa: 'Olá! Gostaria de agendar uma aula experimental de Kick Boxe na ANIMA.'
    },
    judo: {
      tag: 'treino híbrido · judô',
      title: 'Judô',
      imgClass: 'mod-judo',
      desc: 'Quedas, equilíbrio e força funcional com base olímpica para adultos e jovens.',
      features: [
        'Quedas e controle de equilíbrio',
        'Integração com treino híbrido',
        'Força funcional e mobilidade',
        'Randi e técnica supervisionada',
        'Graduação por faixa'
      ],
      wa: 'Olá! Gostaria de agendar uma aula experimental de Judô na ANIMA.'
    },
    crossfit: {
      tag: 'corpo & mente · crossfit',
      title: 'Crossfit',
      imgClass: 'mod-crossfit',
      desc: 'Força, condicionamento e performance em treinos funcionais de alta intensidade.',
      features: [
        'WODs variados com barra, halteres e peso corporal',
        'Condicionamento cardiovascular e força',
        'Treinos em grupo com alta energia',
        'Progressão para todos os níveis',
        'Acompanhamento técnico constante'
      ],
      wa: 'Olá! Gostaria de agendar uma aula experimental de Crossfit na ANIMA.'
    },
    'gelo-sauna': {
      tag: 'terapia integrativa · gelo · sauna',
      title: 'Banho de Gelo & Sauna',
      imgClass: 'mod-gelo-sauna',
      desc: 'Tratamentos terapêuticos com frio e calor para recuperação, imunidade e longevidade.',
      features: [
        'Banheira de gelo premium',
        'Sauna seca e úmida',
        'Terapia de contraste calor/frio',
        'Recuperação pós-treino',
        'Ambiente reservado e silencioso'
      ],
      wa: 'Olá! Gostaria de conhecer os Tratamentos com Frio e Calor na ANIMA.'
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

      document.querySelectorAll('.mod-carousel-track').forEach(function (track) {
        track.style.animationPlayState = 'paused';
      });

      var closeBtn = modModal.querySelector('.mod-modal-close');
      if (closeBtn) closeBtn.focus();
    }

    function closeModModal() {
      modModal.classList.remove('is-open');
      modModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';

      document.querySelectorAll('.mod-carousel-track').forEach(function (track) {
        track.style.animationPlayState = '';
      });

      if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    }

    document.addEventListener('click', function (e) {
      var card = e.target.closest('.mod-card[data-mod]');
      if (!card) return;
      openModModal(card.dataset.mod);
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
     Modalities Carousel
     ========================================================================= */
  function initModCarousel() {
    document.querySelectorAll('.mod-carousel').forEach(function (carousel) {
      var track = carousel.querySelector('.mod-carousel-track');
      var group = carousel.querySelector('.mod-carousel-group');
      if (!track || !group || track.dataset.cloned === '1') return;

      var clone = group.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.querySelectorAll('.mod-card').forEach(function (card) {
        card.setAttribute('tabindex', '-1');
      });
      track.appendChild(clone);
      track.dataset.cloned = '1';
    });
  }

  /* =========================================================================
     Plan Billing Toggle
     ========================================================================= */
  var PLAN_BILLING_OPTIONS = {
    mensal: { months: 1, discount: 0, label: 'mensal' },
    trimestral: { months: 3, discount: 0.1, label: 'trimestral' },
    anual: { months: 12, discount: 0.15, label: 'anual' }
  };

  function formatPlanMoney(value) {
    return Math.round(value).toLocaleString('pt-BR');
  }

  function updatePlanBilling(card, billingKey) {
    var monthly = parseFloat(card.dataset.monthly || '0', 10);
    var planLabel = card.dataset.planLabel || 'Plano';
    var option = PLAN_BILLING_OPTIONS[billingKey] || PLAN_BILLING_OPTIONS.mensal;
    var amountEl = card.querySelector('[data-plan-amount]');
    var periodEl = card.querySelector('[data-plan-period]');
    var detailEl = card.querySelector('[data-plan-billing-detail]');
    var ctaEl = card.querySelector('[data-plan-cta]');
    var monthlyEquivalent = monthly * (1 - option.discount);
    var total = monthly * option.months * (1 - option.discount);

    if (amountEl) {
      amountEl.textContent = formatPlanMoney(monthlyEquivalent);
    }

    if (periodEl) {
      periodEl.textContent = '/mês';
    }

    if (detailEl) {
      if (billingKey === 'mensal') {
        detailEl.hidden = true;
        detailEl.textContent = '';
      } else {
        detailEl.hidden = false;
        detailEl.textContent =
          'Pagamento de R$ ' +
          formatPlanMoney(total) +
          ' · ' +
          option.months +
          (option.months === 1 ? ' mês' : ' meses') +
          ' · economia de ' +
          Math.round(option.discount * 100) +
          '%';
      }
    }

    if (ctaEl) {
      var message =
        'Quero o plano ' +
        planLabel +
        ' (mensalidade ' +
        option.label +
        ' · R$ ' +
        formatPlanMoney(monthlyEquivalent) +
        '/mês)';
      ctaEl.href = WA_BASE + '?text=' + encodeURIComponent(message);
    }

    card.querySelectorAll('.plan-billing-btn').forEach(function (btn) {
      var isActive = btn.dataset.billing === billingKey;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  }

  function initPlanBilling() {
    var cards = document.querySelectorAll('.plan-card[data-monthly]');
    if (!cards.length) return;

    cards.forEach(function (card) {
      updatePlanBilling(card, 'mensal');

      card.querySelectorAll('.plan-billing-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          updatePlanBilling(card, btn.dataset.billing || 'mensal');
        });
      });
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
    initModCarousel();
    initModals();
    initPlanBilling();
    initFaqAccordion();
    initSmoothScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
