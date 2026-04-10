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
    function showNotification(msg) {
        var el = document.getElementById('notification');
        el.textContent = msg;
        el.classList.add('show');
        clearTimeout(notifTimer);
        notifTimer = setTimeout(function () { el.classList.remove('show'); }, 2200);
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
        var select = document.getElementById('profile-select');
        var profiles = getProfiles();
        var names = Object.keys(profiles);

        select.innerHTML = '<option value="">── User profiles ──</option>';
        names.forEach(function (name) {
            var opt = document.createElement('option');
            opt.value = 'user:' + name;
            opt.textContent = name;
            select.appendChild(opt);
        });

        var sep = document.createElement('option');
        sep.disabled = true;
        sep.textContent = '── Built-in presets ──';
        select.appendChild(sep);

        Object.keys(BUILTIN_PRESETS).forEach(function (name) {
            var opt = document.createElement('option');
            opt.value = 'builtin:' + name;
            opt.textContent = name;
            select.appendChild(opt);
        });
    }

    function saveProfile() {
        var name = document.getElementById('profile-name').value.trim();
        if (!name) { showNotification('Enter a profile name first.'); return; }
        var profiles = getProfiles();
        profiles[name] = getCurrentSettings();
        saveProfiles(profiles);
        updateProfileList();
        showNotification('Saved "' + name + '"');
    }

    function loadProfile() {
        var raw = document.getElementById('profile-select').value;
        if (!raw) return;
        var parts = raw.split(':');
        var type = parts[0], name = parts.slice(1).join(':');
        var settings = (type === 'builtin') ? BUILTIN_PRESETS[name] : getProfiles()[name];
        if (!settings) return;
        applySettings(settings);
        showNotification('Loaded "' + name + '"');
    }

    function deleteProfile() {
        var raw = document.getElementById('profile-select').value;
        if (!raw) return;
        var parts = raw.split(':');
        if (parts[0] === 'builtin') { showNotification('Cannot delete built-in presets.'); return; }
        var name = parts.slice(1).join(':');
        if (!confirm('Delete profile "' + name + '"?')) return;
        var profiles = getProfiles();
        delete profiles[name];
        saveProfiles(profiles);
        updateProfileList();
        showNotification('Deleted "' + name + '"');
    }

    // ── Settings get / apply ─────────────────────────────────────────────────
    function getCurrentSettings() {
        return {
            color:          window.color,
            composite:      window.composite,
            lineWidth:      window.lineWidth,
            max_age:        window.max_age,
            emissionRate:   window.emissionRate,
            initVelocity:   window.initVelocity,
            damping:        window.damping,
            noiseStrength:  window.noiseStrength,
            particleSize:   window.particleSize,
            displayColor:   document.getElementById('custom-color').value,
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

        // UI sync
        if (s.displayColor)   setEl('custom-color', s.displayColor);
        if (s.colorIntensity) {
            setEl('color-intensity', s.colorIntensity);
            setEl('intensity-val', s.colorIntensity, true);
        }
        setEl('blend-mode', s.composite || 'lighter');
        setSlider('emission-rate', window.emissionRate, 0);
        setSlider('init-velocity', window.initVelocity, 1);
        setSlider('damping',       window.damping,      2);
        setSlider('noise-strength',window.noiseStrength,1);
        setSlider('max-age',       window.max_age,      0);
        setSlider('particle-size', window.particleSize, 2);

        // Deselect colour swatches – profile owns the colour
        document.querySelectorAll('#colors li').forEach(function (li) {
            li.classList.remove('active');
        });
    }

    function setEl(id, val, isText) {
        var el = document.getElementById(id);
        if (!el) return;
        if (isText) el.textContent = val;
        else        el.value = val;
    }

    function setSlider(id, value, decimals) {
        setEl(id, value);
        setEl(id + '-val', parseFloat(value).toFixed(decimals), true);
    }

    // ── Custom colour picker ─────────────────────────────────────────────────
    function applyCustomColor() {
        var hex       = document.getElementById('custom-color').value;
        var intensity = parseInt(document.getElementById('color-intensity').value, 10);
        var r = parseInt(hex.slice(1, 3), 16);
        var g = parseInt(hex.slice(3, 5), 16);
        var b = parseInt(hex.slice(5, 7), 16);
        var pr = Math.max(1, Math.round(r * intensity / 255));
        var pg = Math.round(g * intensity / 255);
        var pb = Math.round(b * intensity / 255);
        window.color     = 'rgb(' + pr + ', ' + pg + ', ' + pb + ')';
        window.composite = 'lighter';
        window.lineWidth = 1.0;
        document.querySelectorAll('#colors li').forEach(function (li) {
            li.classList.remove('active');
        });
    }

    // Called by art_neon.js when a palette swatch is clicked
    window.syncColorPickerToSwatch = function () {
        // We can't easily reverse-engineer the exact hex, so just leave the
        // picker as-is; the swatch's onclick already set window.color directly.
    };

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

    // ── Init ─────────────────────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', function () {

        // Panel toggle
        document.getElementById('menu-toggle').addEventListener('click', togglePanel);
        document.getElementById('panel-close').addEventListener('click', togglePanel);

        // Close panel when clicking canvas
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
            window.clear();
        });
        document.getElementById('apply-bg-btn').addEventListener('click', function () {
            var hex = document.getElementById('bg-color').value;
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = hex;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        });

        // Export
        document.getElementById('download-png-btn').addEventListener('click', function () {
            window.downloadPNG();
        });
        document.getElementById('download-jpeg-btn').addEventListener('click', function () {
            window.downloadJPEG();
        });

        updateProfileList();
    });

})();
