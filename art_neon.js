// Noise lives in logical-pixel space (particle coords are logical).
// Using window.innerWidth/Height avoids any dpr confusion.
var noiseW = window.innerWidth,
    noiseH = window.innerHeight;

var particles    = [],
    color        = 'rgb(12, 2, 2)',
    composite    = 'lighter',
    max_age      = 100,
    lineWidth    = 1.0,
    emissionRate = 10,
    initVelocity = 10.0,
    damping      = 0.8,
    noiseStrength= 4.0,
    particleSize = 0.5,
    svgHistory     = [],          // every rendered particle, for SVG / hi-res export
    drawTrajectory = [],          // per-frame mouse+settings record for hi-res re-simulation
    svgBgColor   = '#000000',   // current background colour (kept in sync with clear/apply-bg)
    noiseCanvas  = makeOctaveNoise(noiseW, noiseH, 8),
    noise        = noiseCanvas.getContext('2d').getImageData(0, 0, noiseW, noiseH).data;

function clear(){
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = svgBgColor;
    ctx.fillRect(0, 0, window.logW, window.logH);
    svgHistory = [];
}

function downloadJPEG(){
    var link = document.createElement('a');
    link.download = 'neonflames.jpg';
    link.href = canvas.toDataURL('image/jpeg', 0.92);
    link.click();
}

function downloadPNG(){
    var link = document.createElement('a');
    link.download = 'neonflames.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

function getNoise(x, y, channel) {
    // Clamp so off-screen particles don't read past the noise array.
    x = Math.max(0, Math.min(noiseW - 1, ~~x));
    y = Math.max(0, Math.min(noiseH - 1, ~~y));
    return noise[(x + y * noiseW) * 4 + channel] / 127 - 1.0;
}

function fuzzy(range, base){
    return (base || 0) + (Math.random() - 0.5) * range * 2;
}

timer.ontick = function(td){
    if(input.mouse.down){
        for(var i = 0; i < emissionRate; i++){
            particles.push({
                vx: fuzzy(initVelocity),
                vy: fuzzy(initVelocity),
                x: input.mouse.x,
                y: input.mouse.y,
                age: 0
            });
        }
    }

    ctx.lineWidth  = lineWidth;
    ctx.strokeStyle= color;
    ctx.fillStyle  = color;
    ctx.globalAlpha= 1.0;
    ctx.globalCompositeOperation = composite;

    // Snapshot current-frame state for svgHistory (same for all particles
    // in this frame — avoids repeated string creation per particle).
    var frameColor = color;
    var frameComp  = composite;
    var frameR     = particleSize;

    var alive = [];
    for(var i = 0; i < particles.length; i++){
        var p = particles[i];
        p.vx = p.vx * damping + getNoise(p.x, p.y, 0) * noiseStrength;
        p.vy = p.vy * damping + getNoise(p.x, p.y, 1) * noiseStrength;
        p.x += p.vx;
        p.y += p.vy;
        p.age++;

        ctx.beginPath();
        ctx.arc(p.x, p.y, frameR, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fill();

        // Record for SVG / high-res raster export.
        // Compact object: x,y as rounded tenths; r,f,c stored once per frame.
        svgHistory.push({x: p.x, y: p.y, r: frameR, f: frameColor, c: frameComp});

        if(p.age < max_age){
            alive.push(p);
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
    if (typeof syncColorPickerToSwatch === 'function') {
        syncColorPickerToSwatch();
    }
});
