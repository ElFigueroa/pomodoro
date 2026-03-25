# 🎵 Arquitectura del Sistema de Música y Alertas

## Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────────┐
│                    POMODORO TIMER APP                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
                ▼             ▼             ▼
            TIMER        MUSIC PLAYER    ALERTAS
          (pomodoro.js) (music-player.js) (main.js)
                │             │             │
                └─────────────┼─────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   VISUALIZER      │
                    │ (visualizer.js)   │
                    └───────────────────┘
```

## Componentes Principales

### 1. **PomodoroTimer** (`pomodoro.js`)
Responsabilidades:
- Manejo de ciclos (Setup, Focus, Short Break, Long Break)
- Contador regresivo
- Callbacks cuando se completa un ciclo

Callbacks emitidos:
- `onTimeUpdate` - Actualiza UI del timer
- `onCycleChange` - Cambia el nombre del ciclo
- `onCycleComplete` → **Dispara alerta** ⚠️

### 2. **MusicPlayer** (`music-player.js`)
Responsabilidades:
- Manejo de lista de reproducción
- Reproducción/pausa de AudioElement
- Control de volumen
- Manejo de archivos locales

Métodos principales:
```javascript
play(index)          // Reproduce una canción
pause()              // Pausa
resume()             // Reanuda
playNext()           // Siguiente
playPrevious()       // Anterior
addToPlaylist(files) // Agrega archivos
setVolume(value)     // Ajusta volumen
toggleMute()         // Mute/Unmute
```

Callbacks:
- `onPlaylistUpdate` - Lista cambió
- `onTrackChange` - Canción actual cambió
- `onStateChange` - Estado cambió (playing/paused/stopped)
- `onAudioSource` - Inicializa visualizador

### 3. **AudioVisualizer** (`visualizer.js`)
Responsabilidades:
- Análisis de espectro de frecuencias
- Dibujo en canvas
- Sincronización con audio

Inicialización:
```javascript
visualizer.initAudioContext(audioElement)
visualizer.draw() // Comienza el loop de animación
```

### 4. **Main Orchestrator** (`main.js`)
Responsabilidades:
- **Gestión de alertas** ← NUEVA FEATURE
- UI event listeners
- Estado general de la app
- Persistencia en localStorage

## Sistema de Alertas - Flujo Detallado

```
Timer completa
    │
    ├─→ onCycleComplete disparado
    │
    └─→ playNotification(cycleType)
           │
           ├─→ Pausa música de fondo
           │   (musicPlayer.pause())
           │   (musicPlayer.wasPlayingBeforeAlert = true)
           │
           ├─→ Reproduce alerta Vivaldi
           │   (alertAudioElement.play())
           │   (5 segundos máximo)
           │
           └─→ setTimeout (5000ms)
               │
               └─→ Pausa alerta
                   (alertAudioElement.pause())
                   │
                   └─→ Reanuda música si estaba sonando
                       if (musicPlayer.wasPlayingBeforeAlert)
                           musicPlayer.resume()
```

## Integración: Reproductor en Footer

```
┌─────────────────────────────────────────────────────┐
│ Footer Controls                                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  [◻ Fondo]  [The Machine God...]  [⏮ ▶ ⏸ ⏭]    │
│                                    [♪ ───●─ ◎]     │
│                                                      │
└─────────────────────────────────────────────────────┘
     │                    │              │      │
     │                    │              │      └─ Botones de control
     │                    │              └──────── Volume slider
     │                    └───────────────────── Nombre canción actual
     └─────────────────────────────────────── Botón de fondo
```

## Carga Automática de Archivos

La función `loadTestAudioTracks()` se ejecuta al iniciar:

```javascript
loadTestAudioTracks()
    │
    └─→ fetch('assets/audio/The Machine God...')
        │
        ├─→ blob creado
        ├─→ URL.createObjectURL()
        └─→ Agregado a musicPlayer.playlist
```

## Event Listeners - Integración Completa

### Botones de Música (footer)
- `btn-play-music` → `musicPlayer.play()`
- `btn-pause-music` → `musicPlayer.pause()`
- `btn-prev-track` → `musicPlayer.playPrevious()`
- `btn-next-track` → `musicPlayer.playNext()`

### Callbacks de Estado
```javascript
musicPlayer.onStateChange = (state) => {
    updateMusicPlayerUI(state, data)
    // Actualiza opacidad de botones
    // play inactivo si está reproduciendo
    // pause inactivo si está pausado
}
```

## Archivos de Prueba

```
assets/audio/
│
├─ antonio_vivaldi-winter_freetone.org.mp3 (870 KB)
│  └─ Usado para: ALERTAS (5 seg)
│
└─ The Machine God...[GWmtLEIXJdQ].mp3 (40 MB)
   └─ Usado para: PRUEBA (carga automática)
```

## localStorage - Persistencia

```javascript
localStorage
├─ music_player_volume          // Volumen guardado
├─ music_player_mode             // LOCAL o YOUTUBE
├─ autoplay_music                // true/false
├─ visualizer_enabled            // true/false
├─ visualizer_sensitivity        // 0.5-2
└─ visualizer_smoothing          // 0.1-0.9
```

## Manejo de Errores

### Alerta - Fallback Chain
```
playNotification()
    │
    ├─→ Intenta alertAudioElement.play()
    │   ├─ Éxito ✓
    │   └─ Error (CORS, codec, etc)
    │
    └─→ playOscillatorFallback()
        └─ Genera tono sintetizado como respaldo
```

### Música - Manejo de Autoplay
```
musicPlayer.play()
    │
    ├─→ playPromise = audioElement.play()
    │   │
    │   └─→ .then() - Éxito
    │   └─→ .catch(e)
    │       ├─ NotAllowedError → Política autoplay (esperado)
    │       └─ Otro error → Intenta siguiente canción
```

## Características Implementadas

✅ Sistema de alertas de 5 segundos con Vivaldi
✅ Pausa automática de música durante alerta
✅ Reanudación automática de música
✅ Reproductor con controles visibles en footer
✅ Botones: Anterior, Play, Pause, Siguiente
✅ Muestra nombre de canción actual
✅ Carga automática de pista de prueba
✅ Control de volumen sincronizado
✅ Sincronización visual de botones (enabled/disabled)
✅ localStorage para persistencia
✅ Fallback a oscilador si falla audio

## Próximas Mejoras (Opcionales)

- [ ] Barra de progreso de canción actual
- [ ] Indicator visual de duración/tiempo
- [ ] Shuffle/Repeat modes
- [ ] Soporte de playlists nombradas
- [ ] Ecualizador visual mejorado
- [ ] Importar/Exportar playlists
- [ ] Historial de canciones reproducidas

---

**Sistema completamente integrado y funcional** ✅
