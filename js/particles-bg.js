/**
 * PARTICLES-BG.JS
 * Partículas animadas que flotan sobre la interfaz y reaccionan al audio.
 * Diseñadas para funcionar como fondo estilo Wallpaper Engine.
 */
class ParticlesBackground {
    constructor(canvas) {
        this.canvas  = canvas;
        this.ctx     = canvas.getContext('2d');
        this.running = false;
        this.rafId   = null;
        this.freq    = null;   // fn() → Uint8Array  (fuente de audio)
        this.list    = [];     // array de partículas

        this.COUNT  = 70;
        this.COLORS = ['#ffffff', '#a8d4ff', '#4a9eff', '#50fa7b', '#bd93f9', '#ff79c6'];

        // Dimensiones del canvas (resolución real en píxeles)
        this._setSize();
        window.addEventListener('resize', () => this._setSize());
    }

    // ── API pública ──────────────────────────────────────

    /** Conecta la fuente de datos de frecuencia del visualizador */
    setFrequencySource(fn) { this.freq = fn; }

    /** Cambia colores según el tema */
    setTheme(isDark) {
        this.COLORS = isDark
            ? ['#ffffff', '#a8d4ff', '#4a9eff', '#50fa7b', '#bd93f9', '#ff79c6']
            : ['#0044aa', '#0066cc', '#004499', '#006622', '#660099', '#990055'];
    }

    start() {
        if (this.running) return;
        this.running = true;
        this._init();
        this._tick();
        console.log('[Particles] iniciadas —', this.COUNT, 'partículas');
    }

    stop() {
        this.running = false;
        if (this.rafId) { cancelAnimationFrame(this.rafId); this.rafId = null; }
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        console.log('[Particles] detenidas');
    }

    get isActive() { return this.running; }

    // ── Internos ─────────────────────────────────────────

    _setSize() {
        this.canvas.width  = window.innerWidth;
        this.canvas.height = window.innerHeight;
        // Si ya estaban inicializadas, recrearlas para las nuevas dimensiones
        if (this.list.length > 0) this._init();
    }

    _init() {
        const W = this.canvas.width;
        const H = this.canvas.height;
        this.list = Array.from({ length: this.COUNT }, () => this._make(W, H, true));
    }

    _make(W, H, scattered = false) {
        // Colores entre amarillo cálido y blanco, como partículas de bosque mágico
        const COLORS = [
            '#ffffff',          // blanco puro
            '#fffde7',          // blanco cálido
            '#fff9c4',          // amarillo muy pálido
            '#fff176',          // amarillo claro
            '#ffee58',          // amarillo suave
            '#ffe082',          // ámbar claro
        ];
        const r = 1 + Math.random() * 2;           // radio 1–3 px (pequeñas)
        return {
            x:  Math.random() * W,
            y:  scattered ? Math.random() * H : H + r + Math.random() * 60,
            r,
            vx: (Math.random() - 0.5) * 0.5,
            vy: -(0.3 + Math.random() * 0.7),    // sube
            op: 0.4 + Math.random() * 0.5,        // opacidad base 0.4–0.9
            ph: Math.random() * Math.PI * 2,      // fase de pulso
            bin: Math.floor(Math.random() * 48),  // bin de frecuencia asignado
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
        };
    }

    _tick() {
        if (!this.running) return;
        const W = this.canvas.width;
        const H = this.canvas.height;

        // Leer datos de frecuencia si hay audio activo
        const fd = this.freq ? this.freq() : null;

        // Energía de bajos (bins 0-7) para escala de tamaño
        let bass = 0;
        if (fd && fd.length > 8) {
            for (let i = 0; i < 8; i++) bass += fd[i] / 255;
            bass /= 8;
        }

        // Limpiar canvas
        this.ctx.clearRect(0, 0, W, H);

        for (const p of this.list) {
            p.ph += 0.02;

            // Velocidad con boost de audio para el bin de esta partícula
            const boost = fd && fd.length > p.bin ? 1 + (fd[p.bin] / 255) * 3 : 1;
            p.x += p.vx + Math.sin(p.ph * 0.5) * 0.3;
            p.y += p.vy * boost;

            // Opacidad pulsa suavemente con el pulso + energía de medios
            const opAlpha = p.op * (0.7 + 0.3 * Math.sin(p.ph));
            // Tamaño reactivo a los bajos
            const radius  = p.r * (1 + bass * 2);

            // Reiniciar cuando sale por arriba
            if (p.y < -p.r - 10) Object.assign(p, this._make(W, H, false));
            // Wrap horizontal
            if (p.x < -10) p.x = W + 10;
            if (p.x > W + 10) p.x = -10;

            // Dibujar partícula con glow
            this.ctx.save();
            this.ctx.globalAlpha = Math.min(1, Math.max(0.05, opAlpha));
            this.ctx.shadowBlur  = radius * 6;
            this.ctx.shadowColor = p.color;
            this.ctx.fillStyle   = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }

        this.rafId = requestAnimationFrame(() => this._tick());
    }
}
