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

    function update() {
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var progress = docHeight > 0 ? window.scrollY / docHeight : 0;
      bar.style.transform = 'scaleX(' + Math.min(1, Math.max(0, progress)) + ')';
    }

    window.addEventListener('scroll', update, { passive: true });
    update();
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
    var links = document.querySelectorAll(
      '.nav-links a[href^="#"], .mobile-menu__links a[href^="#"]'
    );
    if (!links.length || !('IntersectionObserver' in window)) return;

    var sections = [];
    var seen = {};

    links.forEach(function (link) {
      var id = link.getAttribute('href');
      if (seen[id]) return;
      var section = document.querySelector(id);
      if (section) {
        seen[id] = true;
        sections.push({ id: id, section: section });
      }
    });

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            links.forEach(function (l) {
              l.classList.remove('is-active');
            });
            links.forEach(function (l) {
              if (l.getAttribute('href') === '#' + entry.target.id) {
                l.classList.add('is-active');
              }
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
     Hero Parallax — leve deslocamento no scroll (performance-safe)
     ========================================================================= */
  function initParallax() {
    var inner = document.getElementById('heroParallax');
    var hero = document.querySelector('.hero--performance');
    if (!inner || !hero) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var ticking = false;

    function update() {
      var rect = hero.getBoundingClientRect();
      if (rect.bottom <= 0 || rect.top >= window.innerHeight) {
        ticking = false;
        return;
      }

      var progress = Math.min(Math.max(-rect.top / Math.max(rect.height, 1), 0), 1);
      var y = progress * 40;
      inner.style.transform = 'translate3d(0, ' + y + 'px, 0)';
      ticking = false;
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

    update();
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
     Hero Video — background only (export do YouTube aJ_FmlqyZj0)
     ========================================================================= */
  function initBackgroundVideo(video, options) {
    options = options || {};
    if (!video || video.tagName !== 'VIDEO') return;

    var loopEndTrim = Number(options.loopEndTrim) || 0;
    var minDurationForTrim = Number(options.minDurationForTrim) || 0;

    video.controls = false;
    video.removeAttribute('controls');
    video.setAttribute('controlsList', 'nodownload nofullscreen noremoteplayback noplaybackrate');
    video.setAttribute('disablePictureInPicture', '');
    video.setAttribute('disableRemotePlayback', '');
    video.setAttribute('aria-hidden', 'true');
    video.muted = true;
    video.defaultMuted = true;
    video.loop = loopEndTrim <= 0;
    video.playsInline = true;
    video.tabIndex = -1;

    function ensurePlaying() {
      if (!video.paused && !video.ended) return;
      var playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(function () {});
      }
    }

    function restartFromStart() {
      video.currentTime = 0;
      ensurePlaying();
    }

    video.addEventListener('pause', ensurePlaying);

    if (loopEndTrim > 0) {
      var loopEnd = null;

      function syncLoopEnd() {
        var shouldTrim = Number.isFinite(video.duration)
          && video.duration > loopEndTrim
          && (!minDurationForTrim || video.duration >= minDurationForTrim);

        if (shouldTrim) {
          loopEnd = video.duration - loopEndTrim;
          video.loop = false;
        } else {
          loopEnd = null;
          video.loop = true;
        }
      }

      video.addEventListener('loadedmetadata', syncLoopEnd);
      video.addEventListener('durationchange', syncLoopEnd);
      video.addEventListener('timeupdate', function () {
        if (loopEnd != null && video.currentTime >= loopEnd) {
          restartFromStart();
        }
      });
      video.addEventListener('ended', restartFromStart);
      syncLoopEnd();
    } else {
      video.addEventListener('ended', restartFromStart);
    }

    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) ensurePlaying();
    });

    window.addEventListener('focus', ensurePlaying);
    ensurePlaying();
  }

  function initHeroVideo() {
    initBackgroundVideo(document.getElementById('heroVideo'), {
      loopEndTrim: 15,
      minDurationForTrim: 45
    });
  }

  function initEmsVideo() {
    initBackgroundVideo(document.getElementById('emsVideo'));
  }

  /* =========================================================================
     Mobile Menu Toggle
     ========================================================================= */
  function initMobileMenu() {
    var menu = document.getElementById('mobileMenu');
    var toggle = document.getElementById('menuToggle');
    var closeBtn = document.getElementById('menuClose');
    var backdrop = document.getElementById('mobileMenuBackdrop');
    if (!menu || !toggle) return;

    function setMenu(open) {
      menu.classList.toggle('is-open', open);
      menu.dataset.open = open ? '1' : '0';
      menu.setAttribute('aria-hidden', open ? 'false' : 'true');
      toggle.classList.toggle('is-active', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
      document.body.style.overflow = open ? 'hidden' : '';

      if (open && closeBtn) {
        closeBtn.focus();
      } else if (!open) {
        toggle.focus();
      }
    }

    toggle.addEventListener('click', function () {
      setMenu(menu.dataset.open !== '1');
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        setMenu(false);
      });
    }

    if (backdrop) {
      backdrop.addEventListener('click', function () {
        setMenu(false);
      });
    }

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
     Stagger Reveal — auto delay on grid children
     ========================================================================= */
  function initStaggerReveal() {
    document.querySelectorAll('[data-stagger]').forEach(function (parent) {
      var children = parent.querySelectorAll(':scope > [data-reveal]');
      children.forEach(function (child, index) {
        if (!child.hasAttribute('data-delay')) {
          child.setAttribute('data-delay', String(Math.min(index + 1, 10)));
        }
      });
      parent.classList.add('is-stagger-ready');
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
      title: 'Judô Kids',
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
    calistenia: {
      tag: 'corpo & mente · calistenia',
      title: 'Calistenia',
      imgClass: 'mod-calistenia',
      desc: 'Força, mobilidade e controle corporal com treinos de peso corporal e progressões técnicas.',
      features: [
        'Barra fixa, paralelas e anéis olímpicos',
        'Planche, muscle-up e skills avançadas',
        'Força relativa e controle corporal',
        'Progressão do básico ao avançado',
        'Acompanhamento técnico especializado'
      ],
      wa: 'Olá! Gostaria de agendar uma aula experimental de Calistenia na ANIMA.'
    },
    'banho-gelo': {
      tag: 'terapia integrativa · crioterapia',
      title: 'Banho de Gelo',
      imgClass: 'mod-banho-gelo',
      desc: 'Crioterapia premium para recuperação muscular, redução de inflamação e performance pós-treino.',
      features: [
        'Banheiras de gelo premium',
        'Protocolos de imersão guiados',
        'Recuperação pós-treino e competição',
        'Terapia de contraste com sauna',
        'Ambiente reservado e silencioso'
      ],
      wa: 'Olá! Gostaria de conhecer o Banho de Gelo na ANIMA.'
    },
    sauna: {
      tag: 'terapia integrativa · sauna',
      title: 'Sauna',
      imgClass: 'mod-sauna',
      desc: 'Sauna seca e úmida para relaxamento profundo, detoxificação e longevidade.',
      features: [
        'Sauna seca e úmida premium',
        'Cabine de madeira com controle térmico',
        'Relaxamento muscular e circulação',
        'Combina com banho de gelo e EMS',
        'Ambiente reservado e silencioso'
      ],
      wa: 'Olá! Gostaria de conhecer a Sauna na ANIMA.'
    },
    terapeuta: {
      tag: 'terapia corporal · massoterapia',
      title: 'Terapeuta',
      imgClass: 'mod-terapeuta',
      desc: 'Massoterapia e técnicas manuais para alívio de tensões, recuperação muscular e equilíbrio corporal.',
      features: [
        'Massagem desportiva e relaxante',
        'Liberação miofascial e pontos de tensão',
        'Recuperação pós-treino e lesões leves',
        'Sessões em ambiente reservado',
        'Profissionais certificados'
      ],
      wa: 'Olá! Gostaria de agendar uma sessão com Terapeuta na ANIMA.'
    },
    psicologo: {
      tag: 'saúde mental · acompanhamento',
      title: 'Psicólogo',
      imgClass: 'mod-psicologo',
      desc: 'Acompanhamento psicológico para bem-estar emocional, performance atlética e qualidade de vida.',
      features: [
        'Atendimento individual reservado',
        'Gestão de estresse e ansiedade',
        'Performance mental no esporte',
        'Autoconhecimento e equilíbrio emocional',
        'Profissionais registrados no CRP'
      ],
      wa: 'Olá! Gostaria de agendar uma consulta com Psicólogo na ANIMA.'
    },
    'personal-trainer': {
      tag: 'performance · treino individual',
      title: 'Personal Trainer',
      imgClass: 'mod-personal-trainer',
      desc: 'Treino personalizado com metas claras, técnica segura e acompanhamento contínuo para resultados reais.',
      features: [
        'Avaliação física e plano sob medida',
        'Correção técnica em tempo real',
        'Periodização e evolução de cargas',
        'Integração com artes marciais e calistenia',
        'Sessões individuais ou em dupla'
      ],
      wa: 'Olá! Gostaria de agendar uma sessão com Personal Trainer na ANIMA.'
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
  function initPartnersCarousel() {
    document.querySelectorAll('.partners-carousel').forEach(function (carousel) {
      var track = carousel.querySelector('.partners-carousel-track');
      var group = carousel.querySelector('.partners-carousel-group');
      if (!track || !group || track.dataset.cloned === '1') return;

      var clone = group.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.querySelectorAll('.partner-carousel-card').forEach(function (card) {
        card.setAttribute('tabindex', '-1');
      });
      track.appendChild(clone);
      track.dataset.cloned = '1';
    });
  }

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
     Plan Billing Toggle — constantes de desconto (fácil de alterar)
     ========================================================================= */
  var PLAN_BILLING_DISCOUNTS = {
    trimestral: 0.1,
    anual: 0.2
  };

  var PLAN_BILLING_OPTIONS = {
    mensal: { months: 1, discount: 0, label: 'mensal' },
    trimestral: { months: 3, discount: PLAN_BILLING_DISCOUNTS.trimestral, label: 'trimestral' },
    anual: { months: 12, discount: PLAN_BILLING_DISCOUNTS.anual, label: 'anual' }
  };

  var PLAN_PRICE_ANIM_MS = 300;
  var planBillingResizeTimer = 0;

  function formatPlanMoney(value) {
    return Math.round(value).toLocaleString('pt-BR');
  }

  function positionBillingSlider(billing) {
    var slider = billing.querySelector('.plan-billing__slider');
    var active = billing.querySelector('.plan-billing-btn.is-active');
    if (!slider || !active) return;

    var left = active.offsetLeft;
    slider.style.width = active.offsetWidth + 'px';
    slider.style.transform = 'translateX(' + left + 'px)';
  }

  function positionAllBillingSliders() {
    document.querySelectorAll('.plans-section .plan-billing').forEach(positionBillingSlider);
  }

  function animatePlanPrice(amountWrap, amountEl, nextValue, reducedMotion) {
    if (!amountEl) return;

    if (reducedMotion || !amountWrap) {
      amountEl.textContent = nextValue;
      return;
    }

    amountWrap.classList.remove('is-entering');
    amountWrap.classList.add('is-exiting');

    window.setTimeout(function () {
      amountEl.textContent = nextValue;
      amountWrap.classList.remove('is-exiting');
      amountWrap.classList.add('is-entering');

      window.setTimeout(function () {
        amountWrap.classList.remove('is-entering');
      }, PLAN_PRICE_ANIM_MS);
    }, Math.round(PLAN_PRICE_ANIM_MS * 0.5));
  }

  function updatePlanBilling(card, billingKey) {
    var monthly = parseFloat(card.dataset.monthly || '0', 10);
    var planLabel = card.dataset.planLabel || 'Plano';
    var option = PLAN_BILLING_OPTIONS[billingKey] || PLAN_BILLING_OPTIONS.mensal;
    var amountEl = card.querySelector('[data-plan-amount]');
    var amountWrap = card.querySelector('[data-plan-amount-wrap]');
    var periodEl = card.querySelector('[data-plan-period]');
    var detailEl = card.querySelector('[data-plan-billing-detail]');
    var oldPriceEl = card.querySelector('[data-plan-price-old]');
    var savingsEl = card.querySelector('[data-plan-savings]');
    var ctaEl = card.querySelector('[data-plan-cta]');
    var billingEl = card.querySelector('.plan-billing');
    var monthlyEquivalent = monthly * (1 - option.discount);
    var total = monthly * option.months * (1 - option.discount);
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var nextAmount = formatPlanMoney(monthlyEquivalent);

    animatePlanPrice(amountWrap, amountEl, nextAmount, reducedMotion);

    if (oldPriceEl) {
      if (option.discount > 0) {
        oldPriceEl.hidden = false;
        oldPriceEl.setAttribute('aria-hidden', 'false');
        oldPriceEl.textContent = 'R$ ' + formatPlanMoney(monthly) + '/mês';
      } else {
        oldPriceEl.hidden = true;
        oldPriceEl.setAttribute('aria-hidden', 'true');
        oldPriceEl.textContent = '';
      }
    }

    if (savingsEl) {
      if (option.discount > 0) {
        savingsEl.hidden = false;
        savingsEl.setAttribute('aria-hidden', 'false');
        savingsEl.textContent = 'Economize ' + Math.round(option.discount * 100) + '%';
      } else {
        savingsEl.hidden = true;
        savingsEl.setAttribute('aria-hidden', 'true');
        savingsEl.textContent = '';
      }
    }

    if (periodEl) {
      periodEl.textContent = '/mês';
    }

    if (detailEl) {
      var baseDetail = card.dataset.planBaseDetail || '';
      if (billingKey === 'mensal') {
        if (baseDetail) {
          detailEl.hidden = false;
          detailEl.textContent = baseDetail;
        } else {
          detailEl.hidden = true;
          detailEl.textContent = '';
        }
      } else {
        detailEl.hidden = false;
        detailEl.textContent =
          (baseDetail ? baseDetail + ' · ' : '') +
          'Pagamento de R$ ' +
          formatPlanMoney(total) +
          ' · ' +
          option.months +
          (option.months === 1 ? ' mês' : ' meses');
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

    if (billingEl) {
      window.requestAnimationFrame(function () {
        positionBillingSlider(billingEl);
      });
    }
  }

  function initPlanBilling() {
    var cards = document.querySelectorAll('.plan-card[data-monthly]');
    cards.forEach(function (card) {
      updatePlanBilling(card, 'mensal');

      card.querySelectorAll('.plan-billing-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          btn.classList.add('is-pressed');
          window.setTimeout(function () {
            btn.classList.remove('is-pressed');
          }, 180);
          updatePlanBilling(card, btn.dataset.billing || 'mensal');
        });
      });
    });

    document.querySelectorAll('.plan-card[data-daily]').forEach(function (card) {
      var daily = parseFloat(card.dataset.daily || '0', 10);
      var planLabel = card.dataset.planLabel || 'Diário';
      var amountEl = card.querySelector('[data-plan-amount]');
      var periodEl = card.querySelector('[data-plan-period]');
      var ctaEl = card.querySelector('[data-plan-cta]');

      if (amountEl) amountEl.textContent = formatPlanMoney(daily);
      if (periodEl) periodEl.textContent = '/dia';
      if (ctaEl) {
        ctaEl.href =
          WA_BASE +
          '?text=' +
          encodeURIComponent(
            'Quero reservar uma aula avulsa (plano ' + planLabel + ' · R$ ' + formatPlanMoney(daily) + '/dia)'
          );
      }
    });

    window.requestAnimationFrame(positionAllBillingSliders);

    window.addEventListener('resize', function () {
      window.clearTimeout(planBillingResizeTimer);
      planBillingResizeTimer = window.setTimeout(positionAllBillingSliders, 120);
    });
  }

  function initPlanDailyToggle() {
    var section = document.querySelector('.plans-section');
    var dailyBtn = document.getElementById('planDailyToggle');
    var familiaBtn = document.getElementById('planFamiliaToggle');
    var monthlyBtn = document.getElementById('planMonthlyToggle');
    var dailyCard = document.getElementById('plano-diario');
    var familiaCard = document.getElementById('plano-familia');
    if (!section || !dailyBtn || !familiaBtn || !monthlyBtn || !dailyCard || !familiaCard) return;

    function showMonthly() {
      section.classList.remove('is-daily-visible', 'is-familia-visible');
      dailyBtn.setAttribute('aria-expanded', 'false');
      familiaBtn.setAttribute('aria-expanded', 'false');
      monthlyBtn.hidden = true;
      dailyCard.classList.remove('is-visible');
      familiaCard.classList.remove('is-visible');
    }

    function showDaily() {
      section.classList.add('is-daily-visible');
      section.classList.remove('is-familia-visible');
      dailyBtn.setAttribute('aria-expanded', 'true');
      familiaBtn.setAttribute('aria-expanded', 'false');
      monthlyBtn.hidden = false;
      dailyCard.classList.add('is-visible');
      familiaCard.classList.remove('is-visible');
      window.requestAnimationFrame(function () {
        dailyCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }

    function showFamilia() {
      section.classList.add('is-familia-visible');
      section.classList.remove('is-daily-visible');
      dailyBtn.setAttribute('aria-expanded', 'false');
      familiaBtn.setAttribute('aria-expanded', 'true');
      monthlyBtn.hidden = false;
      familiaCard.classList.add('is-visible');
      dailyCard.classList.remove('is-visible');
      window.requestAnimationFrame(function () {
        familiaCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }

    dailyBtn.addEventListener('click', showDaily);
    familiaBtn.addEventListener('click', showFamilia);
    monthlyBtn.addEventListener('click', showMonthly);
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
     Marquee — loop infinito sem quebra
     ========================================================================= */
  function initMarquee() {
    var track = document.querySelector('.marquee-track');
    if (!track) return;

    var group = track.querySelector('.marquee-group');
    if (!group) return;

    var clone = group.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);
  }

  /* =========================================================================
     Gallery carousel (infinite scroll)
     ========================================================================= */
  function initGalleryCarousel() {
    document.querySelectorAll('.gallery-carousel').forEach(function (carousel) {
      var track = carousel.querySelector('.gallery-carousel__track');
      var group = carousel.querySelector('.gallery-carousel__group');
      if (!track || !group || track.dataset.cloned === '1') return;

      var clone = group.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.querySelectorAll('.gallery-carousel__slide').forEach(function (slide) {
        slide.removeAttribute('data-gallery-src');
        slide.removeAttribute('data-gallery-caption');
        slide.setAttribute('tabindex', '-1');
      });
      track.appendChild(clone);
      track.dataset.cloned = '1';
    });
  }

  /* =========================================================================
     Gallery Lightbox
     ========================================================================= */
  function initGalleryLightbox() {
    var lightbox = document.getElementById('galleryLightbox');
    var img = document.getElementById('lightboxImg');
    var caption = document.getElementById('lightboxCaption');
    var counter = document.getElementById('lightboxCounter');
    var closeBtn = document.getElementById('lightboxClose');
    var prevBtn = document.getElementById('lightboxPrev');
    var nextBtn = document.getElementById('lightboxNext');
    if (!lightbox || !img) return;

    var items = Array.prototype.slice.call(document.querySelectorAll('[data-gallery-src]')).filter(function (item) {
      return !item.closest('[aria-hidden="true"]');
    });
    var currentIndex = 0;

    function show(index) {
      if (!items.length) return;
      currentIndex = (index + items.length) % items.length;
      var item = items[currentIndex];
      var src = item.getAttribute('data-gallery-src');
      var cap = item.getAttribute('data-gallery-caption') || '';
      var altEl = item.querySelector('img');
      img.src = src;
      img.alt = altEl ? altEl.getAttribute('alt') || cap : cap;
      if (caption) caption.textContent = cap;
      if (counter) counter.textContent = currentIndex + 1 + ' / ' + items.length;
    }

    function openAt(index) {
      show(index);
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      if (closeBtn) closeBtn.focus();
    }

    function close() {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      img.src = '';
      img.alt = '';
    }

    function step(dir) {
      show(currentIndex + dir);
    }

    items.forEach(function (item, index) {
      item.addEventListener('click', function () {
        openAt(index);
      });
    });

    if (closeBtn) closeBtn.addEventListener('click', close);
    if (prevBtn) prevBtn.addEventListener('click', function () { step(-1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { step(1); });

    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) close();
    });

    document.addEventListener('keydown', function (e) {
      if (!lightbox.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    });
  }

  /* =========================================================================
     Testimonials carousel nav
     ========================================================================= */
  function initTestimonials() {
    var track = document.getElementById('testimonialsTrack');
    var prev = document.getElementById('testimonialsPrev');
    var next = document.getElementById('testimonialsNext');
    if (!track || !prev || !next) return;

    function scrollByCard(dir) {
      var card = track.querySelector('.testimonial-card');
      var gap = 20;
      var amount = card ? card.offsetWidth + gap : 320;
      track.scrollBy({ left: dir * amount, behavior: 'smooth' });
    }

    prev.addEventListener('click', function () { scrollByCard(-1); });
    next.addEventListener('click', function () { scrollByCard(1); });
  }

  /* =========================================================================
     Init
     ========================================================================= */
  function initHeroLoaded() {
    var hero = document.querySelector('.hero');
    var video = document.getElementById('heroVideo');

    function markLoaded() {
      if (hero) hero.classList.add('is-loaded');
    }

    if (!video) {
      markLoaded();
      return;
    }

    if (video.readyState >= 2) {
      markLoaded();
      return;
    }

    video.addEventListener('loadeddata', markLoaded, { once: true });
    video.addEventListener('canplay', markLoaded, { once: true });
    setTimeout(markLoaded, 2500);
  }

  function init() {
    initStaggerReveal();
    initHeroVideo();
    initEmsVideo();
    initHeroLoaded();
    initMobileMenu();
    initNavScroll();
    initScrollProgress();
    initNavActive();
    initParallax();
    initRevealAnimations();
    initCounters();
    initModCarousel();
    initPartnersCarousel();
    initMarquee();
    initModals();
    initPlanBilling();
    initPlanDailyToggle();
    initFaqAccordion();
    initSmoothScroll();
    initGalleryCarousel();
    initGalleryLightbox();
    initTestimonials();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
