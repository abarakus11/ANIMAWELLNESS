/**
 * ANIMA — Starfield global (1 canvas fixo, contínuo, leve)
 */
(function () {
  'use strict';

  var REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var IS_MOBILE =
    window.matchMedia('(max-width: 768px)').matches ||
    window.matchMedia('(pointer: coarse)').matches;

  var MAX_DEPTH = 1200;
  var BASE_SPEED = IS_MOBILE ? 12 : 17;
  var STAR_COUNT = IS_MOBILE ? 55 : 120;
  var CENTER_WARP = IS_MOBILE ? 1.35 : 1.9;

  var LAYERS = [
    { speed: 0.5, streak: 0.85 },
    { speed: 0.95, streak: 1.2 },
    { speed: 1.4, streak: 1.55 }
  ];

  function Starfield(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.buckets = [[], [], []];
    this.width = 0;
    this.height = 0;
    this.centerX = 0;
    this.centerY = 0;
    this.dpr = 1;
    this.running = false;
    this.raf = 0;
    this.visible = true;

    this._initStars();
    this._resize();
    this._bind();
    this._start();
  }

  Starfield.prototype._pickLayer = function () {
    return LAYERS[Math.floor(Math.random() * LAYERS.length)];
  };

  Starfield.prototype._spawnPosition = function () {
    var spread = Math.max(this.width, this.height) || 800;
    var angle = Math.random() * Math.PI * 2;
    var radius = Math.pow(Math.random(), 0.5) * spread;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    };
  };

  Starfield.prototype._createStar = function (initial, layerIndex) {
    var pos = this._spawnPosition();
    var layer = typeof layerIndex === 'number' ? LAYERS[layerIndex] : this._pickLayer();
    var idx = typeof layerIndex === 'number' ? layerIndex : LAYERS.indexOf(layer);

    return {
      x: pos.x,
      y: pos.y,
      z: initial ? Math.random() * MAX_DEPTH : MAX_DEPTH,
      brightness: 0.4 + Math.random() * 0.6,
      layer: layer,
      layerIndex: idx,
      prevSx: 0,
      prevSy: 0
    };
  };

  Starfield.prototype._initStars = function () {
    this.buckets = [[], [], []];
    for (var i = 0; i < STAR_COUNT; i += 1) {
      var layerIndex = i % 3;
      this.buckets[layerIndex].push(this._createStar(true, layerIndex));
    }
  };

  Starfield.prototype._resize = function () {
    this.dpr = Math.min(window.devicePixelRatio || 1, IS_MOBILE ? 1 : 1.5);
    this.width = Math.max(1, window.innerWidth);
    this.height = Math.max(1, window.innerHeight);
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
    var resizeTimer = 0;

    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        self._resize();
      }, 120);
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) self._stop();
      else if (self.visible) self._start();
    });

    if ('IntersectionObserver' in window) {
      var targets = document.querySelectorAll('.section-dark, .section-deep, .marquee, .footer');
      if (!targets.length) return;

      var observer = new IntersectionObserver(
        function () {
          var any = false;
          for (var i = 0; i < targets.length; i += 1) {
            var rect = targets[i].getBoundingClientRect();
            if (rect.bottom > 0 && rect.top < window.innerHeight) {
              any = true;
              break;
            }
          }
          self.visible = any;
          if (any && !document.hidden) self._start();
          else self._stop();
        },
        { root: null, rootMargin: '0px', threshold: 0 }
      );

      targets.forEach(function (el) {
        observer.observe(el);
      });

      window.addEventListener(
        'scroll',
        function () {
          if (self._scrollRaf) return;
          self._scrollRaf = requestAnimationFrame(function () {
            self._scrollRaf = 0;
            var any = false;
            for (var i = 0; i < targets.length; i += 1) {
              var rect = targets[i].getBoundingClientRect();
              if (rect.bottom > 0 && rect.top < window.innerHeight) {
                any = true;
                break;
              }
            }
            self.visible = any;
            if (any && !document.hidden) self._start();
            else self._stop();
          });
        },
        { passive: true }
      );
    }
  };

  Starfield.prototype._start = function () {
    if (this.running || REDUCED_MOTION) {
      if (REDUCED_MOTION) this._drawFrame(0.25);
      return;
    }
    this.running = true;
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
    var reborn = this._createStar(false, star.layerIndex);
    star.x = reborn.x;
    star.y = reborn.y;
    star.z = reborn.z;
    star.brightness = reborn.brightness;
    star.prevSx = atCenter ? this.centerX : 0;
    star.prevSy = atCenter ? this.centerY : 0;
  };

  Starfield.prototype._drawFrame = function (speedScale) {
    var ctx = this.ctx;
    var cx = this.centerX;
    var cy = this.centerY;
    var base = BASE_SPEED * speedScale;
    var w = this.width;
    var h = this.height;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#ffffff';
    ctx.lineCap = 'round';

    for (var b = 0; b < this.buckets.length; b += 1) {
      var bucket = this.buckets[b];
      var layer = LAYERS[b];

      for (var i = 0; i < bucket.length; i += 1) {
        var star = bucket[i];
        var perspective = 260 / Math.max(star.z, 1);
        var sx = cx + star.x * perspective;
        var sy = cy + star.y * perspective;
        var warp = this._centerWarp(sx, sy);
        var layerSpeed = base * layer.speed * warp;

        star.z -= layerSpeed + star.z * 0.008;

        if (star.z <= 1) {
          this._resetStar(star, true);
          continue;
        }

        if (sx < -50 || sx > w + 50 || sy < -50 || sy > h + 50) {
          this._resetStar(star, false);
          continue;
        }

        var depth = 1 - star.z / MAX_DEPTH;
        var radius = Math.max(0.35, depth * (1.4 + b * 0.45) * (0.9 + warp * 0.1));
        var alpha = star.brightness * (0.25 + depth * 0.75) * (0.85 + warp * 0.15);
        var velocity = depth * layer.streak * warp;
        var prevSx = star.prevSx;
        var prevSy = star.prevSy;

        if (!prevSx && !prevSy) {
          prevSx = cx + (sx - cx) * 0.82;
          prevSy = cy + (sy - cy) * 0.82;
        } else {
          prevSx = cx + (prevSx - cx) * 0.55 + (sx - cx) * 0.45;
          prevSy = cy + (prevSy - cy) * 0.55 + (sy - cy) * 0.45;
        }

        ctx.globalAlpha = Math.min(1, alpha);
        ctx.lineWidth = radius * (1 + velocity * 0.35);
        ctx.beginPath();
        ctx.moveTo(prevSx, prevSy);
        ctx.lineTo(sx, sy);
        ctx.stroke();

        star.prevSx = sx;
        star.prevSy = sy;
      }
    }

    ctx.globalAlpha = 1;
  };

  function initGlobalStarfield() {
    if (document.getElementById('starfieldGlobal')) return;

    var wrap = document.createElement('div');
    wrap.id = 'starfieldGlobal';
    wrap.className = 'starfield-global';
    wrap.setAttribute('aria-hidden', 'true');

    var canvas = document.createElement('canvas');
    canvas.className = 'starfield-global__canvas';
    wrap.appendChild(canvas);

    var vignette = document.createElement('div');
    vignette.className = 'starfield-global__vignette';
    wrap.appendChild(vignette);

    document.body.insertBefore(wrap, document.body.firstChild);
    new Starfield(canvas);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGlobalStarfield);
  } else {
    initGlobalStarfield();
  }
})();
