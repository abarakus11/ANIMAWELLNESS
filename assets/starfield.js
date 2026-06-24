/**
 * ANIMA — Starfield background (Canvas API, warp-speed 3D)
 * Depth layers · center warp · motion blur · mobile-optimized
 */
(function () {
  'use strict';

  var REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var IS_MOBILE =
    window.matchMedia('(max-width: 768px)').matches ||
    window.matchMedia('(pointer: coarse)').matches;

  var MAX_DEPTH = 1400;
  var BASE_SPEED = IS_MOBILE ? 14 : 20;

  var LAYERS = IS_MOBILE
    ? [
        { id: 0, speed: 0.42, blurMax: 0, glow: 1.1, streak: 0.75, share: 0.38 },
        { id: 1, speed: 0.82, blurMax: 0.9, glow: 1.6, streak: 1.1, share: 0.34 },
        { id: 2, speed: 1.38, blurMax: 2.2, glow: 2.2, streak: 1.65, share: 0.28 }
      ]
    : [
        { id: 0, speed: 0.4, blurMax: 0, glow: 1.25, streak: 0.8, share: 0.34 },
        { id: 1, speed: 0.88, blurMax: 1.6, glow: 2, streak: 1.25, share: 0.33 },
        { id: 2, speed: 1.48, blurMax: 4.2, glow: 2.8, streak: 1.85, share: 0.33 }
      ];

  var STAR_COUNT = IS_MOBILE ? 150 : 400;
  var CENTER_WARP = IS_MOBILE ? 1.55 : 2.35;
  var FILTER_BLUR_SUPPORTED = (function () {
    var c = document.createElement('canvas').getContext('2d');
    if (!c) return false;
    c.filter = 'blur(1px)';
    return c.filter === 'blur(1px)';
  })();

  function Starfield(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
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
    this.useFilterBlur = FILTER_BLUR_SUPPORTED && !IS_MOBILE;

    this._initStars();
    this._resize();
    this._bind();
  }

  Starfield.prototype._pickLayer = function () {
    var roll = Math.random();
    var acc = 0;
    for (var i = 0; i < LAYERS.length; i += 1) {
      acc += LAYERS[i].share;
      if (roll <= acc) return LAYERS[i];
    }
    return LAYERS[LAYERS.length - 1];
  };

  Starfield.prototype._spawnPosition = function () {
    var spread = Math.max(this.width, this.height) || 800;
    var angle = Math.random() * Math.PI * 2;
    var radius = Math.pow(Math.random(), IS_MOBILE ? 0.62 : 0.48) * spread * 1.15;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    };
  };

  Starfield.prototype._createStar = function (initial, layer) {
    var pos = this._spawnPosition();
    var picked = layer || this._pickLayer();
    var depthBias = picked.id / (LAYERS.length - 1 || 1);

    return {
      x: pos.x,
      y: pos.y,
      z: initial ? Math.random() * MAX_DEPTH * (0.35 + depthBias * 0.65) : MAX_DEPTH,
      brightness: 0.3 + Math.random() * 0.7,
      layer: picked,
      prevSx: 0,
      prevSy: 0,
      velocity: 0
    };
  };

  Starfield.prototype._initStars = function () {
    this.stars = [];
    for (var i = 0; i < STAR_COUNT; i += 1) {
      this.stars.push(this._createStar(true));
    }
  };

  Starfield.prototype._resize = function () {
    if (!this.parent) return;

    var rect = this.parent.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, IS_MOBILE ? 1.25 : 2);
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

  Starfield.prototype._centerWarp = function (sx, sy) {
    var dx = (sx - this.centerX) / (this.width * 0.5);
    var dy = (sy - this.centerY) / (this.height * 0.5);
    var dist = Math.min(1, Math.sqrt(dx * dx + dy * dy));
    return 1 + (1 - dist) * CENTER_WARP;
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
        { rootMargin: IS_MOBILE ? '80px 0px' : '120px 0px', threshold: 0 }
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
      this._drawFrame(0.3);
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

  Starfield.prototype._resetStar = function (star, atCenter) {
    var reborn = this._createStar(false, star.layer);
    star.x = reborn.x;
    star.y = reborn.y;
    star.z = reborn.z;
    star.brightness = reborn.brightness;
    star.prevSx = atCenter ? this.centerX : 0;
    star.prevSy = atCenter ? this.centerY : 0;
    star.velocity = 0;
  };

  Starfield.prototype._updateStars = function (speedScale) {
    var cx = this.centerX;
    var cy = this.centerY;
    var stars = this.stars;
    var base = BASE_SPEED * speedScale;

    for (var i = 0; i < stars.length; i += 1) {
      var star = stars[i];
      var layer = star.layer;
      var perspective = 280 / Math.max(star.z, 1);
      var sx = cx + star.x * perspective;
      var sy = cy + star.y * perspective;
      var warp = this._centerWarp(sx, sy);
      var layerSpeed = base * layer.speed * warp;

      star.z -= layerSpeed + star.z * 0.01 * layer.speed;
      star.velocity = layerSpeed * (1 - star.z / MAX_DEPTH) * layer.streak;

      if (star.z <= 1) {
        this._resetStar(star, true);
      }
    }

    stars.sort(function (a, b) {
      return b.z - a.z;
    });
  };

  Starfield.prototype._drawStar = function (star) {
    var ctx = this.ctx;
    var cx = this.centerX;
    var cy = this.centerY;
    var layer = star.layer;
    var perspective = 280 / star.z;
    var sx = cx + star.x * perspective;
    var sy = cy + star.y * perspective;
    var depth = 1 - star.z / MAX_DEPTH;
    var warp = this._centerWarp(sx, sy);
    var radius = Math.max(0.3, depth * (1.6 + layer.id * 0.55) * (0.85 + warp * 0.12));
    var alpha = star.brightness * (0.2 + depth * 0.9) * (0.82 + warp * 0.18);
    var velocity = Math.min(1, star.velocity / (BASE_SPEED * 1.6));
    var blurAmount = layer.blurMax * velocity * depth;

    if (sx < -60 || sx > this.width + 60 || sy < -60 || sy > this.height + 60) {
      this._resetStar(star, false);
      return;
    }

    var streakLen = 1 + velocity * layer.streak * (0.6 + warp * 0.5);
    var prevSx = star.prevSx;
    var prevSy = star.prevSy;

    if (prevSx === 0 && prevSy === 0) {
      prevSx = cx + (sx - cx) / streakLen;
      prevSy = cy + (sy - cy) / streakLen;
    } else {
      prevSx = cx + (prevSx - cx) / streakLen + (sx - cx) * (1 - 1 / streakLen) * 0.35;
      prevSy = cy + (prevSy - cy) / streakLen + (sy - cy) * (1 - 1 / streakLen) * 0.35;
    }

    ctx.save();
    ctx.globalAlpha = Math.min(1, alpha);
    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = '#ffffff';
    ctx.lineCap = 'round';
    ctx.lineWidth = radius;

    if (this.useFilterBlur && blurAmount > 0.35) {
      ctx.filter = 'blur(' + blurAmount.toFixed(2) + 'px)';
    } else {
      ctx.filter = 'none';
      ctx.shadowBlur = radius * layer.glow * (0.6 + velocity * 0.8);
      ctx.shadowColor = 'rgba(255, 255, 255, ' + (0.35 + velocity * 0.35) + ')';
    }

    ctx.beginPath();
    ctx.moveTo(prevSx, prevSy);
    ctx.lineTo(sx, sy);
    ctx.stroke();

    if (depth > 0.55 && velocity > 0.35) {
      ctx.filter = 'none';
      ctx.shadowBlur = 0;
      ctx.globalAlpha = Math.min(1, alpha * 0.85);
      ctx.beginPath();
      ctx.arc(sx, sy, radius * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    star.prevSx = sx;
    star.prevSy = sy;
  };

  Starfield.prototype._drawFrame = function (speedScale) {
    var ctx = this.ctx;

    ctx.filter = 'none';
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, this.width, this.height);

    this._updateStars(speedScale);

    for (var i = 0; i < this.stars.length; i += 1) {
      this._drawStar(this.stars[i]);
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
