(function () {
    'use strict';

    var STORAGE_KEY = 'neonflames_profiles';

    // ── Built-in presets ────────────────────────────────────────────────────
    var BUILTIN_PRESETS = {
        'Default': {
            color: 'rgb(12, 2, 2)', composite: 'lighter', lineWidth: 1.0,
            max_age: 100, emissionRate: 10, initVelocity: 10.0,
            damping: 0.8, noiseStrength: 4.0, particleSize: 0.5,
            displayColor: '#ff2200', colorIntensity: 5
        },
        'Wispy Smoke': {
            color: 'rgb(3, 3, 4)', composite: 'lighter', lineWidth: 1.0,
            max_age: 300, emissionRate: 4, initVelocity: 4.0,
            damping: 0.95, noiseStrength: 2.0, particleSize: 0.8,
            displayColor: '#8899ff', colorIntensity: 3
        },
        'Explosive': {
            color: 'rgb(8, 3, 1)', composite: 'lighter', lineWidth: 1.0,
            max_age: 60, emissionRate: 30, initVelocity: 20.0,
            damping: 0.6, noiseStrength: 8.0, particleSize: 0.5,
            displayColor: '#ff6600', colorIntensity: 8
        },
        'Cosmic Dust': {
            color: 'rgb(2, 1, 6)', composite: 'lighter', lineWidth: 1.0,
            max_age: 400, emissionRate: 6, initVelocity: 6.0,
            damping: 0.92, noiseStrength: 3.0, particleSize: 1.2,
            displayColor: '#aa44ff', colorIntensity: 3
        },
        'Electric Arc': {
            color: 'rgb(1, 4, 8)', composite: 'lighter', lineWidth: 1.0,
            max_age: 40, emissionRate: 20, initVelocity: 18.0,
            damping: 0.7, noiseStrength: 12.0, particleSize: 0.3,
            displayColor: '#00ccff', colorIntensity: 7
        }
    };

    // ── Panel state ─────────────────────────────────────────────────────────
    var panelOpen = false;

    function togglePanel() {
        panelOpen = !panelOpen;
        document.getElementById('settings-panel').classList.toggle('open', panelOpen);
        document.getElementById('menu-toggle').classList.toggle('active', panelOpen);
    }

    // ── Notifications ────────────────────────────────────────────────────────
    var notifTimer;
    function showNotification(msg, persist) {
        var el = document.getElementById('notification');
        el.textContent = msg;
        el.classList.add('show');
        clearTimeout(notifTimer);
        if (!persist) {
            notifTimer = setTimeout(function () { el.classList.remove('show'); }, 2400);
        }
    }
    function hideNotification() {
        document.getElementById('notification').classList.remove('show');
    }

    // ── Profile storage ──────────────────────────────────────────────────────
    function getProfiles() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
        catch (e) { return {}; }
    }
    function saveProfiles(profiles) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
    }
    function updateProfileList() {
        var select  = document.getElementById('profile-select');
        var profiles= getProfiles();
        select.innerHTML = '<option value="">── User profiles ──</option>';
        Object.keys(profiles).forEach(function (name) {
            var opt = document.createElement('option');
            opt.value = 'user:' + name; opt.textContent = name;
            select.appendChild(opt);
        });
        var sep = document.createElement('option');
        sep.disabled = true; sep.textContent = '── Built-in presets ──';
        select.appendChild(sep);
        Object.keys(BUILTIN_PRESETS).forEach(function (name) {
            var opt = document.createElement('option');
            opt.value = 'builtin:' + name; opt.textContent = name;
            select.appendChild(opt);
        });
    }
    function saveProfile() {
        var name = document.getElementById('profile-name').value.trim();
        if (!name) { showNotification('Enter a profile name first.'); return; }
        var profiles = getProfiles();
        profiles[name] = getCurrentSettings();
        saveProfiles(profiles); updateProfileList();
        showNotification('Saved "' + name + '"');
    }
    function loadProfile() {
        var raw   = document.getElementById('profile-select').value;
        if (!raw) return;
        var parts = raw.split(':'), type = parts[0], name = parts.slice(1).join(':');
        var s = (type === 'builtin') ? BUILTIN_PRESETS[name] : getProfiles()[name];
        if (!s) return;
        applySettings(s); showNotification('Loaded "' + name + '"');
    }
    function deleteProfile() {
        var raw = document.getElementById('profile-select').value;
        if (!raw) return;
        var parts = raw.split(':');
        if (parts[0] === 'builtin') { showNotification('Cannot delete built-in presets.'); return; }
        var name = parts.slice(1).join(':');
        if (!confirm('Delete profile "' + name + '"?')) return;
        var profiles = getProfiles();
        delete profiles[name]; saveProfiles(profiles); updateProfileList();
        showNotification('Deleted "' + name + '"');
    }

    // ── Settings get / apply ─────────────────────────────────────────────────
    function getCurrentSettings() {
        return {
            color: window.color, composite: window.composite,
            lineWidth: window.lineWidth, max_age: window.max_age,
            emissionRate: window.emissionRate, initVelocity: window.initVelocity,
            damping: window.damping, noiseStrength: window.noiseStrength,
            particleSize: window.particleSize,
            displayColor: document.getElementById('custom-color').value,
            colorIntensity: parseInt(document.getElementById('color-intensity').value, 10)
        };
    }
    function applySettings(s) {
        window.color         = s.color;
        window.composite     = s.composite      !== undefined ? s.composite      : 'lighter';
        window.lineWidth     = s.lineWidth       !== undefined ? s.lineWidth       : 1.0;
        window.max_age       = s.max_age         !== undefined ? s.max_age         : 100;
        window.emissionRate  = s.emissionRate    !== undefined ? s.emissionRate    : 10;
        window.initVelocity  = s.initVelocity    !== undefined ? s.initVelocity    : 10.0;
        window.damping       = s.damping         !== undefined ? s.damping         : 0.8;
        window.noiseStrength = s.noiseStrength   !== undefined ? s.noiseStrength   : 4.0;
        window.particleSize  = s.particleSize    !== undefined ? s.particleSize    : 0.5;
        if (s.displayColor)   setEl('custom-color', s.displayColor);
        if (s.colorIntensity) { setEl('color-intensity', s.colorIntensity); setEl('intensity-val', s.colorIntensity, true); }
        setEl('blend-mode', s.composite || 'lighter');
        setSlider('emission-rate',  window.emissionRate,  0);
        setSlider('init-velocity',  window.initVelocity,  1);
        setSlider('damping',        window.damping,        2);
        setSlider('noise-strength', window.noiseStrength,  1);
        setSlider('max-age',        window.max_age,        0);
        setSlider('particle-size',  window.particleSize,   2);
        document.querySelectorAll('#colors li').forEach(function (li) { li.classList.remove('active'); });
    }
    function setEl(id, val, isText) {
        var el = document.getElementById(id);
        if (!el) return;
        if (isText) el.textContent = val; else el.value = val;
    }
    function setSlider(id, value, decimals) {
        setEl(id, value);
        setEl(id + '-val', parseFloat(value).toFixed(decimals), true);
    }

    // ── Custom colour picker ─────────────────────────────────────────────────
    function applyCustomColor() {
        var hex = document.getElementById('custom-color').value;
        var intensity = parseInt(document.getElementById('color-intensity').value, 10);
        var r = parseInt(hex.slice(1, 3), 16),
            g = parseInt(hex.slice(3, 5), 16),
            b = parseInt(hex.slice(5, 7), 16);
        window.color     = 'rgb(' + Math.max(1, Math.round(r * intensity / 255)) + ', '
                                  + Math.round(g * intensity / 255) + ', '
                                  + Math.round(b * intensity / 255) + ')';
        window.composite = 'lighter';
        window.lineWidth = 1.0;
        document.querySelectorAll('#colors li').forEach(function (li) { li.classList.remove('active'); });
    }
    window.syncColorPickerToSwatch = function () { /* swatch onclick sets window.color directly */ };

    // ── Slider helper ────────────────────────────────────────────────────────
    function bindSlider(id, decimals, setter) {
        var slider  = document.getElementById(id);
        var display = document.getElementById(id + '-val');
        if (!slider) return;
        slider.addEventListener('input', function () {
            var val = parseFloat(this.value);
            if (display) display.textContent = val.toFixed(decimals);
            setter(val);
        });
    }

    // ── Export helpers ───────────────────────────────────────────────────────

    /** Current export scale (multiplier relative to logical canvas). */
    var exportScale = 1;

    function getExportDims() {
        return {
            w: Math.round(window.logW * exportScale),
            h: Math.round(window.logH * exportScale)
        };
    }

    function updateExportUI() {
        var d   = getExportDims();
        var dim = document.getElementById('export-dims');
        var warn= document.getElementById('export-warning');
        if (dim) dim.textContent = d.w.toLocaleString() + ' × ' + d.h.toLocaleString() + ' px';
        if (warn) {
            if (exportScale >= 6) {
                warn.textContent = '⚠ Very large — rendering may take 10–30 s and needs several GB of RAM.';
                warn.className   = 'export-warn warn-high';
            } else if (exportScale >= 3) {
                warn.textContent = '⚠ Large export — may take a few seconds.';
                warn.className   = 'export-warn warn-medium';
            } else {
                warn.textContent = '';
                warn.className   = 'export-warn';
            }
        }
    }

    /** Particle count badge. */
    function updateParticleCount() {
        var count = window.svgHistory ? window.svgHistory.length : 0;
        var el    = document.getElementById('particle-count');
        if (el) el.textContent = count > 0
            ? count.toLocaleString() + ' pts recorded'
            : 'No drawing data yet';
    }

    // ── SVG string builder ───────────────────────────────────────────────────
    //
    // THE CRITICAL FIX: mix-blend-mode must NOT be placed on <g> elements.
    //
    // When a <g> has mix-blend-mode != normal it creates an *isolated* stacking
    // context (CSS Compositing spec §9). That means all child circles composite
    // into an offline buffer using source-over first, then the single buffer is
    // blended with the backdrop.  source-over on rgb(5,1,1) → rgb(5,1,1) → the
    // buffer is still near-black → screen-blending it against black = nothing.
    //
    // The fix: keep <g> elements free of blend modes (no isolation) and put
    // mix-blend-mode on every *circle* individually via a CSS class.  Because
    // the parent <g> has no blend mode it does not isolate, so each circle's
    // backdrop is the full accumulated content below it — exactly like canvas
    // globalCompositeOperation = 'lighter'.
    //
    // plus-lighter  = exact CSS equivalent of canvas 'lighter' (additive clamp)
    // screen        = fallback for browsers that don't yet support plus-lighter;
    //                 visually identical for the very small per-particle values
    //                 used here (both ≈ additive when src values are small).

    function buildSVGString(history, w, h, bgColor) {
        var lines = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<svg xmlns="http://www.w3.org/2000/svg"',
            '     width="' + w + '" height="' + h + '"',
            '     viewBox="0 0 ' + w + ' ' + h + '">',
            // .p  = lighter/glow particles  (per-circle blend, non-isolating parent)
            // .e  = eraser / source-over    (normal compositing, default)
            '<style>.p{mix-blend-mode:screen;mix-blend-mode:plus-lighter}</style>',
            '<rect width="' + w + '" height="' + h + '" fill="' + (bgColor || '#000') + '"/>'
        ];

        var curFill = null, curComp = null, inGroup = false;

        for (var i = 0; i < history.length; i++) {
            var p = history[i];

            if (p.c === 'lighter') {
                // Glow particles: group by fill for compact output.
                // NO mix-blend-mode on the <g> — that would isolate it!
                if (p.f !== curFill || curComp !== 'lighter') {
                    if (inGroup) lines.push('</g>');
                    lines.push('<g fill="' + p.f + '">');
                    curFill = p.f; curComp = 'lighter'; inGroup = true;
                }
                // class="p" carries mix-blend-mode on the leaf element itself.
                lines.push('<circle class="p" cx="' + p.x.toFixed(1)
                           + '" cy="' + p.y.toFixed(1)
                           + '" r="'  + p.r.toFixed(2) + '"/>');
            } else {
                // source-over (eraser, etc.): close any open glow group,
                // then draw as a plain circle with default compositing.
                if (inGroup) { lines.push('</g>'); inGroup = false; curFill = null; curComp = null; }
                lines.push('<circle cx="' + p.x.toFixed(1)
                           + '" cy="' + p.y.toFixed(1)
                           + '" r="'  + p.r.toFixed(2)
                           + '" fill="' + p.f + '"/>');
            }
        }

        if (inGroup) lines.push('</g>');
        lines.push('</svg>');
        return lines.join('\n');
    }

    // ── SVG export ───────────────────────────────────────────────────────────

    function exportSVG() {
        var history = window.svgHistory;
        if (!history || history.length === 0) {
            showNotification('Draw something first, then export SVG.'); return;
        }
        showNotification('Building SVG…', true);

        setTimeout(function () {
            var svg  = buildSVGString(history, window.logW, window.logH, window.svgBgColor || '#000');
            var blob = new Blob([svg], {type: 'image/svg+xml'});
            downloadBlob(blob, 'neonflames.svg');
            hideNotification();
            showNotification('SVG saved — ' + history.length.toLocaleString() + ' particles.');
        }, 60);
    }

    // ── High-resolution raster export ────────────────────────────────────────
    //
    // scale = 1 → grab the live canvas directly (already HiDPI quality).
    //
    // scale > 1 → build the SVG string, load it into a temporary <img> via a
    // Blob URL, then drawImage onto a hidden <canvas> at the target dimensions.
    // The browser's own SVG renderer handles blend modes at full target
    // resolution — this is why the output matches what you see on screen and
    // avoids the "visible blobs" issue of scaling raw particle positions up.

    function exportRaster(mimeType) {
        var history = window.svgHistory;
        if (!history || history.length === 0) {
            showNotification('Draw something first, then export.'); return;
        }

        var d    = getExportDims();
        var ext  = mimeType === 'image/jpeg' ? 'jpg' : 'png';
        var name = 'neonflames_' + d.w + 'x' + d.h + '.' + ext;

        // scale = 1: export the live canvas pixel-for-pixel (fastest path).
        if (exportScale === 1) {
            canvas.toBlob(function (blob) { downloadBlob(blob, name); }, mimeType, 0.92);
            return;
        }

        showNotification('Rendering ' + d.w.toLocaleString() + ' × ' + d.h.toLocaleString() + '…', true);

        setTimeout(function () {
            var svg     = buildSVGString(history, window.logW, window.logH, window.svgBgColor || '#000');
            var svgBlob = new Blob([svg], {type: 'image/svg+xml'});
            var svgUrl  = URL.createObjectURL(svgBlob);

            var img = new Image();

            img.onload = function () {
                var oc = document.createElement('canvas');
                oc.width  = d.w;
                oc.height = d.h;
                oc.style.display = 'none';
                document.body.appendChild(oc);

                var octx = oc.getContext('2d');
                // drawImage renders the SVG at the exact destination dimensions,
                // letting the browser rasterise at full target resolution with
                // all blend modes applied correctly.
                octx.drawImage(img, 0, 0, d.w, d.h);
                URL.revokeObjectURL(svgUrl);

                oc.toBlob(function (blob) {
                    downloadBlob(blob, name);
                    document.body.removeChild(oc);
                    hideNotification();
                    showNotification('Saved ' + d.w.toLocaleString() + ' × ' + d.h.toLocaleString() + ' ' + ext.toUpperCase());
                }, mimeType, 0.92);
            };

            img.onerror = function () {
                URL.revokeObjectURL(svgUrl);
                hideNotification();
                showNotification('Raster render failed — download the SVG and rasterise in Inkscape / Illustrator.');
            };

            img.src = svgUrl;
        }, 60);
    }

    // ── Blob download helper ─────────────────────────────────────────────────
    function downloadBlob(blob, filename) {
        var url  = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.download = filename;
        link.href     = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
    }

    // ── Init ─────────────────────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', function () {

        // Panel toggle
        document.getElementById('menu-toggle').addEventListener('click', togglePanel);
        document.getElementById('panel-close').addEventListener('click', togglePanel);
        document.getElementById('c').addEventListener('mousedown', function () {
            if (panelOpen) togglePanel();
        });

        // Profiles
        document.getElementById('save-profile-btn').addEventListener('click', saveProfile);
        document.getElementById('load-profile-btn').addEventListener('click', loadProfile);
        document.getElementById('delete-profile-btn').addEventListener('click', deleteProfile);

        // Colour picker + intensity
        document.getElementById('custom-color').addEventListener('input', applyCustomColor);
        document.getElementById('color-intensity').addEventListener('input', function () {
            document.getElementById('intensity-val').textContent = this.value;
            applyCustomColor();
        });

        // Blend mode
        document.getElementById('blend-mode').addEventListener('change', function () {
            window.composite = this.value;
        });

        // Physics sliders
        bindSlider('emission-rate',  0, function (v) { window.emissionRate  = Math.round(v); });
        bindSlider('init-velocity',  1, function (v) { window.initVelocity  = v; });
        bindSlider('damping',        2, function (v) { window.damping       = v; });
        bindSlider('noise-strength', 1, function (v) { window.noiseStrength = v; });
        bindSlider('max-age',        0, function (v) { window.max_age       = Math.round(v); });
        bindSlider('particle-size',  2, function (v) { window.particleSize  = v; });

        // Canvas controls
        document.getElementById('clear-canvas-btn').addEventListener('click', function () {
            window.clear(); updateParticleCount();
        });
        document.getElementById('apply-bg-btn').addEventListener('click', function () {
            var hex = document.getElementById('bg-color').value;
            window.svgBgColor = hex;
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = hex;
            ctx.fillRect(0, 0, window.logW, window.logH);
        });

        // Export scale selector
        document.getElementById('export-scale').addEventListener('change', function () {
            exportScale = parseFloat(this.value);
            updateExportUI();
        });

        // Export buttons
        document.getElementById('download-png-btn').addEventListener('click', function () {
            exportRaster('image/png');
        });
        document.getElementById('download-jpeg-btn').addEventListener('click', function () {
            exportRaster('image/jpeg');
        });
        document.getElementById('download-svg-btn').addEventListener('click', exportSVG);

        // Reset SVG history without clearing the canvas
        document.getElementById('reset-svg-btn').addEventListener('click', function () {
            window.svgHistory = [];
            updateParticleCount();
            showNotification('Recording reset — future strokes will be captured.');
        });

        // Initialise
        updateProfileList();
        updateExportUI();

        // Live particle-count badge (updates every second)
        setInterval(updateParticleCount, 1000);
        updateParticleCount();
    });

})();
