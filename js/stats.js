/**
 * STATS.JS
 * Estadísticas de sesiones Pomodoro.
 * Persiste en localStorage con clave 'pomodoro_stats'.
 */
class PomodoroStats {
    constructor() {
        this.STORAGE_KEY = 'pomodoro_stats';
        this.data = this._load();
        this._checkStreak();
    }

    // ───────────────────────────────────────────
    // Persistencia
    // ───────────────────────────────────────────

    _load() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || this._defaults();
        } catch {
            return this._defaults();
        }
    }

    _defaults() {
        return {
            totalFocusCycles:  0,
            totalFocusMinutes: 0,
            streak:            0,
            lastFocusDate:     null,
            daily:             {},
        };
    }

    _save() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    }

    // ───────────────────────────────────────────
    // Utilidades de fecha
    // ───────────────────────────────────────────

    _todayKey() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    _dateOffset(days) {
        const d = new Date();
        d.setDate(d.getDate() + days);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    // ───────────────────────────────────────────
    // Registro de sesiones
    // ───────────────────────────────────────────

    /**
     * Registra un ciclo de Focus completado.
     * @param {number} minutes - duración del ciclo en minutos
     */
    recordFocusCycle(minutes = 25) {
        const today = this._todayKey();

        if (!this.data.daily[today]) {
            this.data.daily[today] = { cycles: 0, minutes: 0 };
        }
        this.data.daily[today].cycles++;
        this.data.daily[today].minutes += minutes;

        this.data.totalFocusCycles++;
        this.data.totalFocusMinutes += minutes;

        this._updateStreak(today);
        this._save();
    }

    _updateStreak(today) {
        const yesterday = this._dateOffset(-1);
        if (this.data.lastFocusDate === today) {
            // Ya contado hoy, sin cambios
        } else if (this.data.lastFocusDate === yesterday) {
            this.data.streak++;           // Día consecutivo
        } else {
            this.data.streak = 1;         // Racha nueva o rota
        }
        this.data.lastFocusDate = today;
    }

    /** Verifica al inicio si la racha se rompió durante la noche */
    _checkStreak() {
        if (!this.data.lastFocusDate) return;
        const today     = this._todayKey();
        const yesterday = this._dateOffset(-1);
        if (this.data.lastFocusDate !== today && this.data.lastFocusDate !== yesterday) {
            this.data.streak = 0;
            this._save();
        }
    }

    // ───────────────────────────────────────────
    // Consultas
    // ───────────────────────────────────────────

    getTodayStats() {
        return this.data.daily[this._todayKey()] || { cycles: 0, minutes: 0 };
    }

    getWeekStats() {
        let cycles = 0, minutes = 0;
        for (let i = 0; i < 7; i++) {
            const day = this.data.daily[this._dateOffset(-i)];
            if (day) { cycles += day.cycles; minutes += day.minutes; }
        }
        return { cycles, minutes };
    }

    /**
     * Últimos 7 días para el mini-gráfico (del más antiguo al más reciente).
     */
    getLast7Days() {
        return Array.from({ length: 7 }, (_, i) => {
            const offset = i - 6; // -6 … 0
            const key = this._dateOffset(offset);
            const d = new Date();
            d.setDate(d.getDate() + offset);
            return {
                label:  d.toLocaleDateString('es', { weekday: 'short' }),
                cycles: this.data.daily[key]?.cycles || 0,
            };
        });
    }

    getAll() {
        return {
            today:  this.getTodayStats(),
            week:   this.getWeekStats(),
            total:  { cycles: this.data.totalFocusCycles, minutes: this.data.totalFocusMinutes },
            streak: this.data.streak,
        };
    }

    reset() {
        this.data = this._defaults();
        this._save();
    }
}
