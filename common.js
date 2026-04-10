(function(){
    var dpr   = window.devicePixelRatio || 1;
    var logW  = window.innerWidth;
    var logH  = window.innerHeight;

    var canvas = document.getElementById('c'),
        ctx    = canvas.getContext('2d'),
        input  = new inputhandler.InputHandler(canvas),
        timer  = new clock.Clock();

    // Physical canvas = logical × dpr  →  crisp on Retina / HiDPI screens.
    // CSS size stays at logical (screen) pixels so layout is unchanged.
    canvas.width  = Math.round(logW * dpr);
    canvas.height = Math.round(logH * dpr);
    canvas.style.width  = logW + 'px';
    canvas.style.height = logH + 'px';

    document.body.style.margin   = '0';
    document.body.style.overflow = 'hidden';

    // Scale the context once so every drawing call works in logical pixels.
    // Mouse coordinates from input.js are already in logical pixels (pageX/Y
    // minus element offset), so nothing else needs to change.
    ctx.scale(dpr, dpr);

    timer.start();

    // Expose globals used by art_neon.js / menu.js
    window.timer  = timer;
    window.input  = input;
    window.ctx    = ctx;
    window.canvas = canvas;
    window.dpr    = dpr;
    window.logW   = logW;   // logical (CSS-pixel) canvas width
    window.logH   = logH;   // logical (CSS-pixel) canvas height
})();
