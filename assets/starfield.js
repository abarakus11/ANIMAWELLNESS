/**
 * ANIMA — Starfield background (Canvas API, warp-speed 3D)
 * Pure JS · no external libraries
 */
(function () {
  'use strict';

  var STAR_COUNT = 320;
  var MAX_DEPTH = 1200;
  var BASE_SPEED = 18;
  var REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function Starfield(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.stars = [];
    this.width = 0;
    this.height = 0;
    this.centerX = 0;
    this.centerY = 0;
    this.dpr = 1;
    this.running = false;
    this.raf = 0;
    this.resizeObserver = null;
    this.intersectionObserver = null;
    this.parent = canvas.closest('.has-starfield') || canvas.parentElement;

    this._initStars();
    this._resize();
    this._bind();
  }

  Starfield.prototype._initStars = function () {
    this.stars = [];
    for (var i = 0; i < STAR_COUNT; i += 1) {
      this.stars.push(this._createStar(true));
    }
  };

  Starfield.prototype._createStar = function (initial) {
    var spread = Math.max(this.width, this.height) || 800;
    return {
      x: (Math.random() - 0.5) * spread * 2.2,
      y: (Math.random() - 0.5) * spread * 2.2,
      z: initial ? Math.random() * MAX_DEPTH : MAX_DEPTH,
      brightness: 0.35 + Math.random() * 0.65,
      prevSx: 0,
      prevSy: 0
    };
  };

  Starfield.prototype._resize = function () {
    if (!this.parent) return;

    var rect = this.parent.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = Math.max(1, Math.floor(rect.width));
    this.height = Math.max(1, Math.floor(rect.height));
    this.centerX = this.width * 0.5;
    this.centerY = this.height * 0.5;

    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';

    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  };

  Starfield.prototype._bind = function () {
    var self = this;

    if ('ResizeObserver' in window && this.parent) {
      this.resizeObserver = new ResizeObserver(function () {
        self._resize();
      });
      this.resizeObserver.observe(this.parent);
    } else {
      window.addEventListener('resize', function () {
        self._resize();
      });
    }

    if ('IntersectionObserver' in window && this.parent) {
      this.intersectionObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) self._start();
            else self._stop();
          });
        },
        { rootMargin: '120px 0px', threshold: 0 }
      );
      this.intersectionObserver.observe(this.parent);
    } else {
      this._start();
    }
  };

  Starfield.prototype._start = function () {
    if (this.running) return;
    this.running = true;
    if (REDUCED_MOTION) {
      this._drawFrame(0.35);
      return;
    }
    this._loop();
  };

  Starfield.prototype._stop = function () {
    this.running = false;
    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  };

  Starfield.prototype._loop = function () {
    var self = this;
    if (!this.running) return;
    this._drawFrame(1);
    this.raf = requestAnimationFrame(function () {
      self._loop();
    });
  };

  Starfield.prototype._drawFrame = function (speedScale) {
    var ctx = this.ctx;
    var stars = this.stars;
    var cx = this.centerX;
    var cy = this.centerY;
    var speed = BASE_SPEED * speedScale;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, this.width, this.height);

    for (var i = 0; i < stars.length; i += 1) {
      var star = stars[i];

      star.z -= speed + star.z * 0.008;

      if (star.z <= 1) {
        var reborn = this._createStar(false);
        star.x = reborn.x;
        star.y = reborn.y;
        star.z = reborn.z;
        star.brightness = reborn.brightness;
        star.prevSx = cx;
        star.prevSy = cy;
        continue;
      }

      var perspective = 280 / star.z;
      var sx = cx + star.x * perspective;
      var sy = cy + star.y * perspective;
      var depth = 1 - star.z / MAX_DEPTH;
      var radius = Math.max(0.35, depth * 2.1);
      var alpha = star.brightness * (0.25 + depth * 0.85);

      if (sx < -40 || sx > this.width + 40 || sy < -40 || sy > this.height + 40) {
        var reset = this._createStar(false);
        star.x = reset.x;
        star.y = reset.y;
        star.z = reset.z;
        star.brightness = reset.brightness;
        star.prevSx = cx;
        star.prevSy = cy;
        continue;
      }

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = radius;
      ctx.lineCap = 'round';
      ctx.shadowBlur = radius * 2.4;
      ctx.shadowColor = 'rgba(255, 255, 255, 0.55)';

      if (star.prevSx !== 0 || star.prevSy !== 0) {
        ctx.beginPath();
        ctx.moveTo(star.prevSx, star.prevSy);
        ctx.lineTo(sx, sy);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(sx, sy, radius * 0.65, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      star.prevSx = sx;
      star.prevSy = sy;
    }
  };

  Starfield.prototype.destroy = function () {
    this._stop();
    if (this.resizeObserver) this.resizeObserver.disconnect();
    if (this.intersectionObserver) this.intersectionObserver.disconnect();
  };

  function mountStarfield(section) {
    if (!section || section.querySelector('.starfield-wrap')) return;

    section.classList.add('has-starfield');

    var wrap = document.createElement('div');
    wrap.className = 'starfield-wrap';
    wrap.setAttribute('aria-hidden', 'true');

    var canvas = document.createElement('canvas');
    canvas.className = 'starfield-canvas';
    wrap.appendChild(canvas);

    section.insertBefore(wrap, section.firstChild);
    new Starfield(canvas);
  }

  function initStarfields() {
    var selectors = '.section-dark, .section-deep, .marquee, .footer';
    document.querySelectorAll(selectors).forEach(mountStarfield);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStarfields);
  } else {
    initStarfields();
  }
})();
