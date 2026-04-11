// Noise lives in logical-pixel space (particle coords are logical).
// Using window.innerWidth/Height avoids any dpr confusion.
var noiseW = window.innerWidth,
    noiseH = window.innerHeight;

// ── Per-particle colour base scale ─────────────────────────────────────────
// channel × intensity × exposure × COLOR_BASE → per-particle rgb integer.
// COLOR_BASE=5 means the defaults (all weights/multipliers = 1) produce
// rgb(5, 1, 1) — dark enough that additive 'lighter' blending builds glow
// gradually, but bright enough to be visible after a few dozen particles.
var COLOR_BASE = 5;

var particles      = [],
    colorR         = 1.0,       // red   channel weight (0–2)
    colorG         = 0.1,       // green channel weight
    colorB         = 0.1,       // blue  channel weight
    colorIntensity = 1.0,       // per-particle brightness multiplier
    exposure       = 1.0,       // secondary brightness/contrast multiplier
    isEraser       = false,     // true when eraser swatch is active
    composite      = 'lighter',
    max_age        = 70,        // frames a particle lives
    lineWidth      = 1.0,
    emissionRate   = 10,        // particles spawned per frame while drawing
    initDXVelocity = 10.0,      // random X-velocity range (±DX)
    initDYVelocity = 10.0,      // random Y-velocity range (±DY)
    fuzz           = 1.0,       // extra random spread added on top of DX/DY
    damping        = 0.8,       // velocity multiplier per frame (< 1 = drag)
    noiseStrength  = 1.0,       // noise field influence
    particleSize   = 0.5,       // radius of each rendered dot in logical px

    // ── Dot-mode recording ──────────────────────────────────────────────────
    svgHistory     = [],        // every rendered particle, for SVG/hi-res export
    drawTrajectory = [],        // per-frame mouse+settings for re-simulation

    // ── Path-mode recording ─────────────────────────────────────────────────
    completedPaths = [],        // finished particle trajectories (Path mode)

    // ── Shared ─────────────────────────────────────────────────────────────
    renderMode     = 'particle', // 'particle' | 'path'
    svgBgColor     = '#000000',
    noiseCanvas    = makeOctaveNoise(noiseW, noiseH, 8),
    noise          = noiseCanvas.getContext('2d').getImageData(0, 0, noiseW, noiseH).data;

// ── Colour computation ──────────────────────────────────────────────────────

/** Compute the canvas fillStyle from the current colour channel globals. */
function computeColor() {
    if (isEraser) return 'rgba(0,0,0,0.6)';
    var s = colorIntensity * exposure * COLOR_BASE;
    return 'rgb(' +
        Math.min(255, Math.max(0, Math.round(colorR * s))) + ',' +
        Math.min(255, Math.max(0, Math.round(colorG * s))) + ',' +
        Math.min(255, Math.max(0, Math.round(colorB * s))) + ')';
}

// ── Canvas operations ───────────────────────────────────────────────────────

function clear() {
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = svgBgColor;
    ctx.fillRect(0, 0, window.logW, window.logH);
    svgHistory     = [];
    drawTrajectory = [];
    completedPaths = [];
}

function downloadJPEG() {
    var link = document.createElement('a');
    link.download = 'neonflames.jpg';
    link.href = canvas.toDataURL('image/jpeg', 0.92);
    link.click();
}

function downloadPNG() {
    var link = document.createElement('a');
    link.download = 'neonflames.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

function getNoise(x, y, channel) {
    x = Math.max(0, Math.min(noiseW - 1, ~~x));
    y = Math.max(0, Math.min(noiseH - 1, ~~y));
    return noise[(x + y * noiseW) * 4 + channel] / 127 - 1.0;
}

// ── Main render loop ────────────────────────────────────────────────────────

timer.ontick = function(td) {
    var frameColor = computeColor();
    var frameComp  = isEraser ? 'source-over' : composite;
    var frameR     = particleSize;
    var isPath     = renderMode === 'path';

    // ── Spawn particles ─────────────────────────────────────────────────────
    if (input.mouse.down) {
        drawTrajectory.push({
            x: input.mouse.x,    y: input.mouse.y,
            er: emissionRate,    ps: particleSize,
            idx: initDXVelocity, idy: initDYVelocity, fz: fuzz,
            d:  damping,         ns: noiseStrength,   ma: max_age,
            c:  frameColor,      cp: frameComp
        });
        for (var i = 0; i < emissionRate; i++) {
            var p = {
                vx:  (Math.random() - 0.5) * initDXVelocity * 2
                   + (Math.random() - 0.5) * fuzz * 2,
                vy:  (Math.random() - 0.5) * initDYVelocity * 2
                   + (Math.random() - 0.5) * fuzz * 2,
                x:   input.mouse.x,
                y:   input.mouse.y,
                age: 0
            };
            if (isPath) {
                // Path mode: track trajectory and previous position for segments
                p.path  = [];
                p.prevX = input.mouse.x;
                p.prevY = input.mouse.y;
            }
            particles.push(p);
        }
    }

    // ── Canvas state ────────────────────────────────────────────────────────
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = frameComp;

    if (isPath) {
        // Path mode: draw continuous line segments between positions
        ctx.strokeStyle = frameColor;
        ctx.lineWidth   = Math.max(1.5, particleSize * 3);
        ctx.lineCap     = 'round';
        ctx.lineJoin    = 'round';
    } else {
        // Dot mode: filled circles (original behaviour, untouched)
        ctx.fillStyle   = frameColor;
        ctx.strokeStyle = frameColor;
        ctx.lineWidth   = lineWidth;
    }

    // ── Physics + draw ──────────────────────────────────────────────────────
    var alive = [];
    for (var i = 0; i < particles.length; i++) {
        var p = particles[i];

        // Physics — identical in both modes
        p.vx = p.vx * damping + getNoise(p.x, p.y, 0) * noiseStrength;
        p.vy = p.vy * damping + getNoise(p.x, p.y, 1) * noiseStrength;
        p.x += p.vx;
        p.y += p.vy;
        p.age++;

        if (isPath) {
            // Record position then draw segment from previous to current
            p.path.push({x: p.x, y: p.y});
            ctx.beginPath();
            ctx.moveTo(p.prevX, p.prevY);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
            p.prevX = p.x;
            p.prevY = p.y;

            if (p.age < max_age) {
                alive.push(p);
            } else {
                // Particle has completed its lifetime — save trajectory
                completedPaths.push({
                    pts:   p.path,
                    color: frameColor,
                    comp:  frameComp,
                    r:     frameR
                });
            }
        } else {
            // Dot mode — original circle rendering + SVG recording
            ctx.beginPath();
            ctx.arc(p.x, p.y, frameR, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.fill();
            svgHistory.push({x: p.x, y: p.y, r: frameR, f: frameColor, c: frameComp});
            if (p.age < max_age) alive.push(p);
        }
    }
    particles = alive;
};

// Initial black fill — use logical dims because ctx is already scaled by dpr.
ctx.fillStyle = 'black';
ctx.fillRect(0, 0, window.logW, window.logH);

$('#colors li').click(function() {
    $('#colors li').removeClass('active');
    $(this).addClass('active');
    if (typeof syncColorSlidersToSwatch === 'function') {
        syncColorSlidersToSwatch();
    }
});
