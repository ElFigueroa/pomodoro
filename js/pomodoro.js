/**
 * POMODORO.JS
 * Sistema de temporizador Pomodoro
 * Gestiona ciclos de trabajo y descanso
 */

class PomodoroTimer {
    constructor() {
        // Estados del ciclo
        this.cycles = {
            SETUP: 'setup',
            FOCUS: 'focus',
            SHORT_BREAK: 'short_break',
            LONG_BREAK: 'long_break'
        };

        // Configuración inicial de duraciones (en minutos)
        this.durations = {
            setup: 5,
            focus: 25,
            short_break: 5,
            long_break: 10
        };

        // Estado actual
        this.currentCycleType = this.cycles.SETUP;
        this.cycleCount = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.timeRemaining = this.durations.setup * 60; // en segundos
        this.totalTimeInCycle = this.timeRemaining;
        this.intervalId = null;

        // Callbacks
        this.onTimeUpdate = null;
        this.onCycleChange = null;
        this.onCycleComplete = null;

        this.loadSettings();
    }

    /**
     * Calcula el siguiente ciclo en la secuencia
     */
    getNextCycle() {
        switch (this.currentCycleType) {
            case this.cycles.SETUP:
                return this.cycles.FOCUS;
            case this.cycles.FOCUS:
                this.cycleCount++;
                // Cada 2 ciclos de FOCUS, hacer descanso largo
                return this.cycleCount % 2 === 0 ? this.cycles.LONG_BREAK : this.cycles.SHORT_BREAK;
            case this.cycles.SHORT_BREAK:
                return this.cycles.FOCUS;
            case this.cycles.LONG_BREAK:
                this.cycleCount = 0;
                return this.cycles.FOCUS;
            default:
                return this.cycles.SETUP;
        }
    }

    /**
     * Cambia al siguiente ciclo
     */
    changeCycle() {
        this.currentCycleType = this.getNextCycle();
        this.timeRemaining = this.durations[this.currentCycleType] * 60;
        this.totalTimeInCycle = this.timeRemaining;
        // NO detener isRunning - mantener el temporizador corriendo
        this.isPaused = false;

        if (this.onCycleChange) {
            this.onCycleChange(this.currentCycleType, this.cycleCount);
        }

        if (this.onCycleComplete) {
            this.onCycleComplete(this.currentCycleType);
        }
    }

    /**
     * Inicia el temporizador
     */
    start() {
        if (this.isRunning) return;

        // Clear any existing interval to prevent duplicates
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        this.isRunning = true;
        this.isPaused = false;

        this.intervalId = setInterval(() => {
            if (this.isRunning && !this.isPaused) {
                this.timeRemaining--;

                if (this.onTimeUpdate) {
                    this.onTimeUpdate(this.timeRemaining, this.totalTimeInCycle);
                }

                // Si el tiempo llega a 0
                if (this.timeRemaining <= 0) {
                    this.changeCycle();
                }
            }
        }, 1000);
    }

    /**
     * Pausa el temporizador
     */
    pause() {
        this.isPaused = true;
    }

    /**
     * Reanuda el temporizador
     */
    resume() {
        this.isPaused = false;
    }

    /**
     * Detiene el temporizador y reinicia al inicio del ciclo actual
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
        this.isPaused = false;
        this.timeRemaining = this.durations[this.currentCycleType] * 60;
        this.totalTimeInCycle = this.timeRemaining;

        if (this.onTimeUpdate) {
            this.onTimeUpdate(this.timeRemaining, this.totalTimeInCycle);
        }
    }

    /**
     * Reinicia completamente al Setup
     */
    reset() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        this.currentCycleType = this.cycles.SETUP;
        this.cycleCount = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.timeRemaining = this.durations.setup * 60;
        this.totalTimeInCycle = this.timeRemaining;

        if (this.onTimeUpdate) {
            this.onTimeUpdate(this.timeRemaining, this.totalTimeInCycle);
        }

        if (this.onCycleChange) {
            this.onCycleChange(this.currentCycleType, this.cycleCount);
        }
    }

    /**
     * Obtiene el tiempo actual formateado MM:SS
     */
    getFormattedTime() {
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        return {
            minutes: String(minutes).padStart(2, '0'),
            seconds: String(seconds).padStart(2, '0')
        };
    }

    /**
     * Obtiene información del ciclo actual
     */
    getCycleInfo() {
        const cycleNames = {
            setup: 'Setup',
            focus: 'Focus',
            short_break: 'Descanso',
            long_break: 'Descanso Largo'
        };

        return {
            type: this.currentCycleType,
            name: cycleNames[this.currentCycleType],
            count: this.cycleCount,
            progress: (this.totalTimeInCycle - this.timeRemaining) / this.totalTimeInCycle
        };
    }

    /**
     * Actualiza las duraciones de los ciclos
     */
    setDuration(cycleType, durationMinutes) {
        if (this.durations.hasOwnProperty(cycleType)) {
            this.durations[cycleType] = durationMinutes;

            // Si es el ciclo actual, actualizar el tiempo restante
            if (this.currentCycleType === cycleType && !this.isRunning) {
                this.timeRemaining = durationMinutes * 60;
                this.totalTimeInCycle = this.timeRemaining;

                if (this.onTimeUpdate) {
                    this.onTimeUpdate(this.timeRemaining, this.totalTimeInCycle);
                }
            }

            this.saveSettings();
        }
    }

    /**
     * Obtiene todas las duraciones actuales
     */
    getDurations() {
        return { ...this.durations };
    }

    /**
     * Guarda la configuración en localStorage
     */
    saveSettings() {
        localStorage.setItem('pomodoro_durations', JSON.stringify(this.durations));
    }

    /**
     * Carga la configuración desde localStorage
     */
    loadSettings() {
        const saved = localStorage.getItem('pomodoro_durations');
        if (saved) {
            try {
                this.durations = JSON.parse(saved);
            } catch (e) {
                console.warn('Error cargando configuración de Pomodoro:', e);
            }
        }
    }

    /**
     * Obtiene el estado actual del temporizador
     */
    getState() {
        return {
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            currentCycle: this.currentCycleType,
            timeRemaining: this.timeRemaining,
            totalTime: this.totalTimeInCycle,
            cycleCount: this.cycleCount,
            formattedTime: this.getFormattedTime(),
            cycleInfo: this.getCycleInfo()
        };
    }

    /**
     * Limpia recursos
     */
    destroy() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PomodoroTimer;
}
