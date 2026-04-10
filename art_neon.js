var particles = [],
    color = 'rgb(12, 2, 2)',
    composite = 'lighter',
    max_age = 100,
    initial_radius = 5,
    lineWidth = 1.0,
    emissionRate = 10,
    initVelocity = 10.0,
    damping = 0.8,
    noiseStrength = 4.0,
    particleSize = 0.5,
    noiseCanvas = makeOctaveNoise(canvas.width, canvas.height, 8),
    noise = noiseCanvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;

function clear(){
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function downloadJPEG(){
    var link = document.createElement('a');
    link.download = 'neonflames.jpg';
    link.href = canvas.toDataURL('image/jpeg', 0.9);
    link.click();
}

function downloadPNG(){
    var link = document.createElement('a');
    link.download = 'neonflames.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

function getNoise(x, y, channel) {
    return noise[(~~x+~~y*canvas.width)*4+channel]/127-1.0;
}

// base +/- range
function fuzzy(range, base){
    return (base||0) + (Math.random()-0.5)*range*2;
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

    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = composite;
    var alive = [];

    for(var i = 0; i < particles.length; i++){
        var p = particles[i];
        p.vx = p.vx * damping + getNoise(p.x, p.y, 0) * noiseStrength;
        p.vy = p.vy * damping + getNoise(p.x, p.y, 1) * noiseStrength;
        p.x += p.vx;
        p.y += p.vy;
        p.age++;

        ctx.beginPath();
        ctx.arc(p.x, p.y, particleSize, 0, Math.PI*2, true);
        ctx.closePath();
        ctx.fill();

        if(p.age < max_age){
            alive.push(p);
        }
    }

    particles = alive;
};

ctx.fillStyle = 'black';
ctx.fillRect(0, 0, canvas.width, canvas.height);

$('#colors li').click(function() {
    $('#colors li').removeClass('active');
    $(this).addClass('active');
    // Keep custom-color picker in sync if panel is open
    if (typeof syncColorPickerToSwatch === 'function') {
        syncColorPickerToSwatch();
    }
});
