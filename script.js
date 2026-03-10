// ==== INTERACTIVE BACKGROUND ==========================================
const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');

let width = window.innerWidth;
let height = window.innerHeight;
canvas.width = width;
canvas.height = height;

const numStars = 2500;
const maxDepth = 2500;
const stars = [];
const nebulas = [];
const numNebulas = 6;

let mouseX = width / 2;
let mouseY = height / 2;
let targetX = width / 2;
let targetY = height / 2;

document.addEventListener('mousemove', (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
});

// ==== RED SMOKE PARTICLE SYSTEM ====
const smokeParticles = [];

document.addEventListener('mousemove', (e) => {
    // Generate a smoke particle on mouse move
    if (Math.random() > 0.3) {
        smokeParticles.push({
            x: e.clientX,
            y: e.clientY,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2 - 1, // Drift upwards
            life: 1.0,
            size: Math.random() * 20 + 10
        });
    }
});

// Initialize stars
for (let i = 0; i < numStars; i++) {
    stars.push({
        x: (Math.random() - 0.5) * 5000,
        y: (Math.random() - 0.5) * 5000,
        z: Math.random() * maxDepth,
        size: Math.random() * 2 + 0.5,
        color: Math.random() > 0.8 ? '#ff003c' : (Math.random() > 0.8 ? '#ff4500' : (Math.random() > 0.9 ? '#cc0000' : '#ffffff')),
        twinkleSpeed: Math.random() * 0.03 + 0.01,
        twinklePhase: Math.random() * Math.PI * 2
    });
}

const nebulaColors = [
    'rgba(255, 0, 60, 0.03)',  // Crimson
    'rgba(255, 69, 0, 0.03)',  // Orange
    'rgba(204, 0, 0, 0.015)'   // Dark Red
];

for (let i = 0; i < numNebulas; i++) {
    nebulas.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 600 + 400,
        color: nebulaColors[Math.floor(Math.random() * nebulaColors.length)],
        vx: (Math.random() - 0.5) * 0.1,
        vy: (Math.random() - 0.5) * 0.1
    });
}

function drawNebulas() {
    nebulas.forEach(nebula => {
        nebula.x += nebula.vx - ((mouseX - width / 2) * 0.0002);
        nebula.y += nebula.vy - ((mouseY - height / 2) * 0.0002);

        if (nebula.x < -nebula.radius) nebula.x = width + nebula.radius;
        if (nebula.x > width + nebula.radius) nebula.x = -nebula.radius;
        if (nebula.y < -nebula.radius) nebula.y = height + nebula.radius;
        if (nebula.y > height + nebula.radius) nebula.y = -nebula.radius;

        const grad = ctx.createRadialGradient(nebula.x, nebula.y, 0, nebula.x, nebula.y, nebula.radius);
        grad.addColorStop(0, nebula.color);
        grad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.beginPath();
        ctx.arc(nebula.x, nebula.y, nebula.radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
    });
}

function drawSmoke() {
    ctx.globalCompositeOperation = 'screen';
    for (let i = smokeParticles.length - 1; i >= 0; i--) {
        const p = smokeParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.size += 0.8; // Smoke expands faster to be blurrier
        p.life -= 0.015; // Smoke dissipates slower

        if (p.life <= 0) {
            smokeParticles.splice(i, 1);
            continue;
        }

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        // Blood red fading to transparent, much softer opacity
        grad.addColorStop(0, `rgba(255, 0, 50, ${p.life * 0.08})`);
        grad.addColorStop(0.5, `rgba(200, 0, 30, ${p.life * 0.03})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
}

function drawGalaxies() {
    const horizonY = height * 0.85;
    const offsetX = (mouseX - width / 2) * 0.01;
    const offsetY = (mouseY - height / 2) * 0.01;

    ctx.save();
    ctx.translate(width / 2 - offsetX, horizonY - offsetY);
    ctx.scale(2, 0.3);

    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, width * 0.4);
    grad.addColorStop(0, 'rgba(255, 0, 60, 0.2)');
    grad.addColorStop(0.4, 'rgba(204, 0, 0, 0.05)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.beginPath();
    ctx.arc(0, 0, width * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
}

// ==== CONTINUOUS Z-SPACE SCROLL & STICKY TITLE ====
const stickyHeader = document.querySelector('.sticky-header');
const titleElem = document.querySelector('.glitch');
const subtitle = document.querySelector('.subtitle');
const promptContainer = document.querySelector('.scroll-prompt-container');
const sections = document.querySelectorAll('.scrolling-content section');

let scrollTarget = 0;
let scrollCurrent = 0;

// The first section peaks (is fully scaled/centered) at 1200px
const firstSectionPeak = 1200;
// We want the title to finish docking EXACTLY at this peak 
const dockDistance = firstSectionPeak;

// Each subsequent section stays 1500px apart
const sectionScrollHeight = 1500;

// The last screen MUST be Transmissions, so we define maxScroll precisely at the peak of the last section.
const maxScroll = firstSectionPeak + (sections.length - 1) * sectionScrollHeight;

window.addEventListener('resize', () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
});

window.addEventListener('wheel', (e) => {
    scrollTarget += e.deltaY;
    scrollTarget = Math.max(0, Math.min(scrollTarget, maxScroll));
});

let touchStartY = 0;
window.addEventListener('touchstart', (e) => { touchStartY = e.touches[0].clientY; }, { passive: false });
window.addEventListener('touchmove', (e) => {
    const touchY = e.touches[0].clientY;
    scrollTarget += (touchStartY - touchY) * 2;
    touchStartY = touchY;
    scrollTarget = Math.max(0, Math.min(scrollTarget, maxScroll));
}, { passive: false });

let time = 0;

function draw() {
    time += 1;

    // Smooth mouse interpolation
    mouseX += (targetX - mouseX) * 0.05;
    mouseY += (targetY - mouseY) * 0.05;

    // Smooth scroll interpolation
    const scrollDiff = scrollTarget - scrollCurrent;
    scrollCurrent += scrollDiff * 0.06;

    // 1. Animate the Sticky Title & Prompt 
    const progressHeader = Math.max(0, Math.min(scrollCurrent / dockDistance, 1));

    if (subtitle) subtitle.style.opacity = 1 - (progressHeader * 2);

    if (promptContainer) {
        promptContainer.style.opacity = 1 - (progressHeader * 3);
        promptContainer.style.transform = `translateY(${progressHeader * 150}px)`;
    }

    if (stickyHeader) {
        // Center-oriented scaling and vertical translation relative to height
        const moveY = -(window.innerHeight * 0.40) * progressHeader;
        // Start header shrinking earlier in the dock phase to clear room for the card
        // Only shrink down to 0.8 so it remains large and prominent at the top
        const scaleHeader = Math.max(0.8, 1 - (0.4 * progressHeader));
        // Simply translate Y and scale
        stickyHeader.style.transform = `translateY(${moveY}px) scale(${scaleHeader})`;
    }

    // 2. Section Cinematic Transitions (Z-Space Zoom)
    sections.forEach((sec, i) => {
        const peakScroll = firstSectionPeak + i * sectionScrollHeight;
        const diff = scrollCurrent - peakScroll;

        // Normalize progress
        const progress = diff / sectionScrollHeight;

        // Render if within view range
        if (progress > -1.5 && progress < 1.5) {
            sec.style.display = 'flex';

            // Opacity curve: perfectly 1 at peak (progress=0)
            let opacity = 1 - Math.abs(progress) * 1.5;
            sec.style.opacity = Math.max(0, opacity);

            // Scale curve: exponentially zooms from background
            const scale = Math.exp(progress * 1.2);
            sec.style.transform = `scale(${scale})`;

            // Clicks register when fully visible
            sec.style.pointerEvents = opacity > 0.8 ? 'auto' : 'none';
        } else {
            sec.style.display = 'none';
            sec.style.pointerEvents = 'none';
        }
    });


    // --- BACKGROUND RENDER ---
    ctx.fillStyle = '#010103';
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = 'screen';
    drawGalaxies();
    drawNebulas();
    ctx.globalCompositeOperation = 'source-over';

    // Draw interactive red smoke over everything else in background
    drawSmoke();

    const vx = (mouseX - width / 2) * 0.003;
    const vy = (mouseY - height / 2) * 0.003;

    // Link starfield speed to the scroll speed
    const baseSpeed = 0.2;
    const scrollForce = Math.abs(scrollDiff) * 0.01;
    const speedZ = baseSpeed + scrollForce;

    stars.forEach(star => {
        star.z -= speedZ;
        star.x -= vx * (maxDepth / star.z) * 0.1;
        star.y -= vy * (maxDepth / star.z) * 0.1;

        if (star.z <= 0) {
            star.z = maxDepth;
            star.x = (Math.random() - 0.5) * 5000;
            star.y = (Math.random() - 0.5) * 5000;
        }

        const k = 800 / star.z;
        const px = star.x * k + width / 2;
        const py = star.y * k + height / 2;
        const pSize = Math.max(star.size * k, 0.5);

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
            const twinkle = 0.4 + Math.abs(Math.sin(time * star.twinkleSpeed + star.twinklePhase)) * 0.6;
            const depthFade = 1 - (star.z / maxDepth);

            ctx.globalAlpha = Math.min(twinkle * depthFade, 1);
            ctx.beginPath();
            ctx.arc(px, py, pSize, 0, Math.PI * 2);
            ctx.fillStyle = star.color;
            ctx.fill();

            if (star.z < 1000) {
                ctx.shadowBlur = pSize * 2;
                ctx.shadowColor = star.color;
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }
    });

    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
}

// Glitch text effect logic
if (titleElem) {
    setInterval(() => {
        titleElem.style.transform = `translate(${Math.random() * 4 - 2}px, ${Math.random() * 4 - 2}px)`;
        setTimeout(() => {
            titleElem.style.transform = 'translate(0, 0)';
        }, 60);
    }, 2500);
}

// Start
draw();
