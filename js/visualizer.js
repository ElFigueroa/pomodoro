/**
 * VISUALIZER.JS
 * Visualizador de audio en tiempo real
 * Estilo minimalista - Línea suave
 */

class AudioVisualizer {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext('2d');
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.freqDataArray = null;
        this.mediaSource = null; // Guardar la fuente de media para reutilizar
        this.connectedAudioElement = null;
        this.isEnabled = true;
        this.animationId = null;
        
        // Configuración visual
        this.sensitivity = 1.0;
        this.smoothing = 0.8;
        this.barCount = 32; // Se conserva para compatibilidad con settings
        this.waveThickness = 2;
        this.waveOpacity = 1;
        this.waveGlow = 0;
        this.wavePointCount = 96;
        this.displayFrequencyBins = 96;
        
        // Colores
        this.backgroundColor = 'rgba(0, 0, 0, 0)';
        this.waveColor = 'rgba(255, 255, 255, 1)';
        this.baseLineColor = 'rgba(255, 255, 255, 0)';
        
        // Animación
        this.startTime = Date.now();
        this.smoothedValues = new Float32Array(this.barCount);
        this.smoothedEnergy = 0;
        
        // Resize listener
        this.onCanvasResize = this.onCanvasResize.bind(this);
        window.addEventListener('resize', this.onCanvasResize);
        
        this.resizeCanvas();
    }

    /**
     * Inicializa el contexto de audio
     */
    initAudioContext(audioElement) {
        if (!audioElement) {
            console.warn('⚠️ initAudioContext() sin audioElement');
            return;
        }

        if (this.audioContext && this.mediaSource) {
            if (this.connectedAudioElement !== audioElement) {
                console.error('❌ El visualizador ya está enlazado a otro elemento <audio>.');
                return;
            }
            console.log('✓ Audio Context ya inicializado - reutilizando');
            return;
        }

        try {
            console.log('🎵 Inicializando Audio Context...');
            
            // Crear contexto de audio
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            console.log('  ✓ AudioContext creado:', this.audioContext.state);
            
            // Crear analizador
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;
            this.analyser.smoothingTimeConstant = this.smoothing;
            console.log('  ✓ Analyser creado');
            
            // Conectar elemento de audio (SOLO UNA VEZ)
            try {
                const createMediaElementSource =
                    this.audioContext.createMediaElementSource ||
                    this.audioContext.createMediaElementAudioSource;

                if (!createMediaElementSource) {
                    throw new TypeError('AudioContext no soporta createMediaElementSource');
                }

                this.mediaSource = createMediaElementSource.call(this.audioContext, audioElement);
                this.connectedAudioElement = audioElement;
                console.log('  ✓ MediaElementAudioSource creada');
            } catch (e) {
                console.error('  ❌ No se pudo crear MediaElementAudioSource:', e.message);
                console.error('     (¿Ya fue asociado con otro contexto?)');
                return;
            }
            
            // Conectar el flujo de audio
            this.mediaSource.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
            console.log('  ✓ Conexiones establecidas: source → analyser → destination');
            
            // Inicializar array de datos
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);
            this.freqDataArray = new Uint8Array(bufferLength);
            console.log('✅ Audio Context completamente inicializado - Listo para visualización');
        } catch (e) {
            console.error('❌ Error al inicializar Audio Context:', e);
        }
    }

    /**
     * Prepara el contexto para visualización dentro de una interacción del usuario.
     */
    async ensureReadyFromUserGesture(audioElement) {
        this.initAudioContext(audioElement);

        if (!this.audioContext) {
            return false;
        }

        if (this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
                console.log('✓ AudioContext reanudado por gesto del usuario');
            } catch (e) {
                console.warn('⚠️ No se pudo reanudar AudioContext:', e);
                return false;
            }
        }

        if (!this.animationId) {
            this.draw();
        }

        return true;
    }

    /**
     * Ajusta el tamaño del canvas
     */
    resizeCanvas() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.createGradient();
    }

    /**
     * Maneja el cambio de tamaño de ventana
     */
    onCanvasResize() {
        this.resizeCanvas();
    }

    createGradient() {
        // Mantener método para no romper llamadas existentes
    }

    /**
     * Dibuja el visualizador
     */
    draw() {
        if (this.canvas.width === 0 || this.canvas.height === 0) {
            this.resizeCanvas();
        }

        if (!this.isEnabled || !this.analyser) {
            this.animationId = requestAnimationFrame(() => this.draw());
            return;
        }

        // Frecuencia para barras individuales tipo ecualizador.
        this.analyser.getByteFrequencyData(this.freqDataArray);

        // Limpiar canvas por completo para evitar estelas visuales.
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Dibujar onda minimalista
        this.drawWaveLine();

        this.animationId = requestAnimationFrame(() => this.draw());
    }

    /**
     * Dibuja una línea ondulada suave que responde al audio
     */
    drawWaveLine() {
        if (!this.freqDataArray || this.freqDataArray.length === 0) return;

        const width = this.canvas.width;
        const height = this.canvas.height;
        const barCount = 72;
        const gap = 4;
        const barWidth = Math.max(2, (width - (barCount - 1) * gap) / barCount);
        const activeBinLimit = Math.max(16, Math.floor(this.freqDataArray.length * 0.05));

        if (!this.smoothedValues || this.smoothedValues.length !== barCount) {
            this.smoothedValues = new Float32Array(barCount);
        }

        this.ctx.save();
        this.ctx.globalAlpha = 1;
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;

        // Barras blancas puras
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';

        for (let i = 0; i < barCount; i++) {
            // Mapeo casi lineal para repartir el movimiento a lo largo de todo el ancho.
            const t0 = i / barCount;
            const t1 = (i + 1) / barCount;
            const startBin = Math.floor(Math.pow(t0, 1.2) * (activeBinLimit - 1));
            const endBin = Math.max(startBin + 1, Math.floor(Math.pow(t1, 1.2) * (activeBinLimit - 1)));

            let sum = 0;
            let count = 0;
            for (let b = startBin; b < endBin; b++) {
                sum += this.freqDataArray[b] || 0;
                count++;
            }

            const avg = count > 0 ? sum / count : 0;
            let normalized = Math.pow(avg / 255, 0.92);

            // Compensación suave: levantar ligeramente barras de la derecha (medios/agudos).
            const highTilt = 0.18 + (0.82 * (i / (barCount - 1)));
            normalized = Math.min(1, normalized * highTilt);
            const targetHeight = Math.max(3, normalized * height * 0.92 * this.sensitivity);

            // Suavizado por barra: sube rápido, baja más lento para movimiento natural.
            const prev = this.smoothedValues[i] || 0;
            const alpha = targetHeight > prev ? 0.42 : 0.16;
            const smoothed = prev + (targetHeight - prev) * alpha;
            this.smoothedValues[i] = smoothed;

            const barHeight = smoothed;
            const x = i * (barWidth + gap);
            const y = height - barHeight;

            // Dibujar barra con esquinas superiores redondeadas para barras visibles
            const radius = barHeight > 5 ? Math.min(barWidth / 2, 2.5) : 0;
            if (radius > 0 && typeof this.ctx.roundRect === 'function') {
                this.ctx.beginPath();
                this.ctx.roundRect(x, y, barWidth, barHeight, [radius, radius, 0, 0]);
                this.ctx.fill();
            } else {
                this.ctx.fillRect(x, y, barWidth, barHeight);
            }
        }
        this.ctx.restore();
    }

    /**
     * Dibuja la línea base
     */
    drawBaseLine() {
        this.ctx.strokeStyle = this.baseLineColor;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        const y = Math.floor(this.canvas.height * 0.5);
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(this.canvas.width, y);
        this.ctx.stroke();
    }

    /**
     * Establece la sensibilidad del visualizador (0.5 - 2.0)
     */
    setSensitivity(value) {
        this.sensitivity = Math.max(0.5, Math.min(2.0, value));
    }

    /**
     * Obtiene la sensibilidad actual
     */
    getSensitivity() {
        return this.sensitivity;
    }

    /**
     * Establece el suavizado (0.1 - 0.9)
     */
    setSmoothing(value) {
        this.smoothing = Math.max(0.1, Math.min(0.9, value));
        if (this.analyser) {
            this.analyser.smoothingTimeConstant = this.smoothing;
        }
    }

    /**
     * Obtiene el suavizado actual
     */
    getSmoothing() {
        return this.smoothing;
    }

    /**
     * Habilita/deshabilita el visualizador
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        
        if (enabled && !this.animationId) {
            this.draw();
        }
    }

    /**
     * Comprueba si el visualizador está habilitado
     */
    isVisualizerEnabled() {
        return this.isEnabled;
    }

    /**
     * Expone el array de frecuencias actual para uso externo (partículas, etc.).
     * Devuelve una referencia al Uint8Array interno (ya actualizado en cada frame).
     * @returns {Uint8Array|null}
     */
    getFrequencyData() {
        return this.freqDataArray || null;
    }

    /**
     * Cambia el número de barras
     */
    setBarCount(count) {
        this.barCount = Math.max(8, Math.min(64, count));
        this.smoothedValues = new Float32Array(this.barCount);
    }

    /**
     * Obtiene el número de barras
     */
    getBarCount() {
        return this.barCount;
    }

    /**
     * Limpia recursos
     */
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        window.removeEventListener('resize', this.onCanvasResize);

        if (this.audioContext) {
            this.audioContext.close();
        }

        // Limpiar canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Obtiene el estado actual
     */
    getState() {
        return {
            isEnabled: this.isEnabled,
            sensitivity: this.sensitivity,
            smoothing: this.smoothing,
            barCount: this.barCount,
            audioContextState: this.audioContext ? this.audioContext.state : 'not_initialized'
        };
    }
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioVisualizer;
}
