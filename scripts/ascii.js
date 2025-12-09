// /scripts/ascii.js
const canvas = document.getElementById('ascii-bg');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const letters = ' .:-=+*#%@';
const fontSize = 14;
ctx.font = `${fontSize}px monospace`;

// Perlin noise for fluid-like flow
class Perlin {
    constructor() { this.gradients = {}; }
    randomGradient(ix, iy) {
        const key = ix + ',' + iy;
        if (this.gradients[key]) return this.gradients[key];
        const angle = Math.random() * 2 * Math.PI;
        this.gradients[key] = { x: Math.cos(angle), y: Math.sin(angle) };
        return this.gradients[key];
    }
    dotGradient(ix, iy, x, y) {
        const grad = this.randomGradient(ix, iy);
        return (x - ix) * grad.x + (y - iy) * grad.y;
    }
    smoothstep(t) { return t * t * (3 - 2 * t); }
    get(x, y) {
        const xf = Math.floor(x), yf = Math.floor(y);
        const dx = x - xf, dy = y - yf;
        const dot00 = this.dotGradient(xf, yf, x, y);
        const dot10 = this.dotGradient(xf + 1, yf, x, y);
        const dot01 = this.dotGradient(xf, yf + 1, x, y);
        const dot11 = this.dotGradient(xf + 1, yf + 1, x, y);
        const u = this.smoothstep(dx);
        const v = this.smoothstep(dy);
        const nx0 = dot00 * (1 - u) + dot10 * u;
        const nx1 = dot01 * (1 - u) + dot11 * u;
        return nx0 * (1 - v) + nx1 * v;
    }
}

const perlin = new Perlin();
let t = 0;

// Mouse position & velocity for ripple effects
let mouse = { x: canvas.width / 2, y: canvas.height / 2, lastX: canvas.width / 2, lastY: canvas.height / 2 };
let velocityX = 0, velocityY = 0;

window.addEventListener('mousemove', e => {
    const dx = e.clientX - mouse.lastX;
    const dy = e.clientY - mouse.lastY;
    velocityX += dx * 0.08; // increase influence
    velocityY += dy * 0.08;
    mouse.lastX = e.clientX;
    mouse.lastY = e.clientY;
});

// Draw loop
function draw() {
    ctx.fillStyle = 'rgba(43,43,43,0.1)'; // subtle fade for trail
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cols = Math.floor(canvas.width / fontSize);
    const rows = Math.floor(canvas.height / fontSize);

    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            const x = i / 10 + t + velocityX * 0.03;
            const y = j / 10 + t + velocityY * 0.03;

            let n = perlin.get(x, y);

            // mouse-based ripple
            const distX = i * fontSize - mouse.x;
            const distY = j * fontSize - mouse.y;
            const dist = Math.sqrt(distX * distX + distY * distY);
            if (dist < 100) { // radius of splash effect
                n += (100 - dist) * 0.01;
            }

            // small random pops
            if (Math.random() < 0.02) n = -1;

            const index = Math.floor(Math.max(0, n) * (letters.length - 1));
            const char = letters[index] || ' ';
            const gray = 43; // low contrast gray (#2b2b2b)
            ctx.fillStyle = `rgba(${gray},${gray},${gray},${n < 0 ? 0 : 0.8})`;
            ctx.fillText(char, i * fontSize, j * fontSize);
        }
    }

    t += 0.002; // constant flow over time
    velocityX *= 0.90; // friction
    velocityY *= 0.90;

    requestAnimationFrame(draw);
}
draw();

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});
