# AGENTS.md — Guía para agentes de IA en este proyecto

Este archivo existe para que cualquier agente de IA que trabaje en este proyecto (o uno similar) pueda arrancar rápidamente, evitar los errores ya cometidos y entender decisiones de diseño.

---

## 1. ¿Qué es este proyecto?

Una aplicación web de escritorio (single-page, sin framework) que combina:
- **Temporizador Pomodoro** con ciclos configurables (setup, focus, short break, long break)
- **Reproductor de música local** (archivos mp3/ogg del sistema del usuario)
- **Visualizador de audio** con barras reactivas al espectro de frecuencias
- **Partículas animadas** de fondo reactivas al audio
- **Sistema de estadísticas de sesión** persistidas en localStorage
- **Tema claro/oscuro** con detección automática del sistema

**Stack**: HTML5 + CSS3 + JavaScript vanilla. Sin dependencias externas, sin bundler.

---

## 2. Estructura de archivos

```
pomodoro/
├── index.html                  # Única página — toda la UI está aquí
├── css/
│   └── styles.css              # Todo el CSS, incluyendo tema light en [data-theme="light"]
├── js/
│   ├── pomodoro.js             # Clase PomodoroTimer — lógica pura del temporizador
│   ├── music-player.js         # Clase MusicPlayer — Web Audio API + playlist local
│   ├── visualizer.js           # Clase AudioVisualizer — canvas FFT bars
│   ├── particles-bg.js         # Clase ParticlesBackground — canvas partículas animadas
│   ├── stats.js                # Clase PomodoroStats — estadísticas en localStorage
│   └── main.js                 # Orquestador: inicializa todo, maneja UI y eventos
└── assets/
    └── audio/                  # Archivos mp3 locales (excluidos de git por .gitignore)
```

**Orden de carga de scripts en index.html** (importa, hay dependencias):
```
pomodoro.js → music-player.js → visualizer.js → particles-bg.js → stats.js → main.js
```

---

## 3. Arquitectura — cómo se conectan los módulos

```
main.js
  ├── new PomodoroTimer()         → callbacks: onTimeUpdate, onCycleChange, onCycleComplete
  ├── new MusicPlayer()           → audioElement expuesto para Web Audio API
  ├── new AudioVisualizer(canvas) → conectado al audioElement del MusicPlayer
  ├── new ParticlesBackground(canvas)
  │     └── setFrequencySource(() => visualizer.getFrequencyData())
  │         → lee el Uint8Array ya actualizado cada frame, sin segundo AudioContext
  └── new PomodoroStats()         → recordFocusCycle() llamado en onCycleComplete
```

**Web Audio API — flujo**:
```
audioElement (MusicPlayer)
  → AudioContext.createMediaElementSource()
  → AnalyserNode (FFT 1024)
  → destination (speakers)
  getByteFrequencyData() → freqDataArray → getFrequencyData() → ParticlesBackground
```

**CRÍTICO**: El `AudioContext` debe crearse/resumirse desde un gesto del usuario (click). 
Se usa `prepareVisualizerFromUserGesture()` antes de cualquier `play()`. 
Sin esto el navegador bloquea el audio silenciosamente.

---

## 4. Sistema de temas

- Tema oscuro: variables en `:root { }` (por defecto)
- Tema claro: variables en `[data-theme="light"]` que sobreescriben las de `:root`
- Se aplica con `document.body.setAttribute('data-theme', 'light'|'dark')`
- Se persiste en `localStorage` con clave `app_theme`
- Al cargar, detecta preferencia del sistema: `window.matchMedia('(prefers-color-scheme: dark)')`

---

## 5. Z-index stack — MUY IMPORTANTE

El orden correcto es:

| Elemento               | z-index | Notas                                          |
|------------------------|---------|------------------------------------------------|
| `#background-container`| -1      | Imagen/video de fondo del usuario              |
| `.container`           | 1       | UI principal — crea stacking context           |
| `#particles-canvas`    | 10      | `position: fixed`, `pointer-events: none`      |
| `.modal`               | 1000    | Modales de configuración y estadísticas        |
| `#toast-container`     | 2000    | Notificaciones toast                           |

**⚠️ Error común — stacking context**: Si `.container` tiene `position + z-index`, crea un stacking context. Todo lo que esté DENTRO de ese contexto solo compite internamente. El `#particles-canvas` debe ser hermano de `.container` en el DOM (no hijo), para que su `z-index: 10` compita a nivel raíz contra el `z-index: 1` del contenedor.

**Si las partículas no se ven**: verificar que el canvas de partículas sea hijo directo de `<body>`, NO de `.container`.

---

## 6. Errores conocidos y sus soluciones

### 6.1 Caché del navegador (el más frecuente)

**Síntoma**: cambios en JS/CSS no se reflejan en el navegador aunque el servidor sirva los archivos nuevos. El server log muestra `304 Not Modified` para archivos modificados.

**Solución**: agregar query string de versión a los scripts:
```html
<script src="js/main.js?v=20260325b"></script>
```
Cambiar el valor cuando se haga un deploy importante. Alternativamente, el usuario hace Ctrl+Shift+R (hard refresh).

**Regla de oro**: si algo "no funciona" y el código parece correcto, siempre sospechar de caché primero.

### 6.2 CSS cascade wars en botones toggle

**Síntoma**: los botones de shuffle/loop/partículas no cambian visualmente al hacer click, aunque el JS se ejecuta.

**Causa**: múltiples reglas CSS acumuladas (`.btn-icon`, `.btn-icon.btn-toggle`, `[data-theme="light"] .btn-icon.btn-toggle`, `.music-controls-buttons .btn-icon .icon`) pelean por el mismo `color` y `opacity`. Agregar más clases o `!important` no resuelve, empeora.

**Solución definitiva**: usar **inline styles directamente desde JS** — siempre ganan sobre cualquier CSS sin `!important`:
```js
function setToggleStyle(btn, isOn) {
    const icon = btn.querySelector('.icon');
    if (isOn) {
        btn.style.opacity = '1';
        if (icon) icon.style.color = '#ffffff';
    } else {
        btn.style.opacity = '0.35';
        if (icon) icon.style.color = '';
    }
}
```
No usar `classList.toggle('btn-active', isOn)` para estados visuales que compiten con el tema.

### 6.3 AudioContext bloqueado

**Síntoma**: la música carga pero no reproduce, o el visualizador no se mueve.

**Causa**: los navegadores bloquean la creación de `AudioContext` sin gesto del usuario previo.

**Solución**: siempre crear/resumir el AudioContext dentro de un event listener de click:
```js
async function prepareVisualizerFromUserGesture() {
    if (visualizer && visualizer.audioContext?.state === 'suspended') {
        await visualizer.audioContext.resume();
    }
    // ...crear source si no existe
}
```

### 6.4 Abrir archivos como `file://` en vez de `http://`

**Síntoma**: Web Audio API no funciona, los módulos JS pueden fallar, CORS errors.

**Causa**: abrir `index.html` directamente desde el explorador de archivos usa protocolo `file://`.

**Solución**: siempre servir con un servidor HTTP local:
```bash
python3 -m http.server 8000
# Abrir: http://localhost:8000
```

### 6.5 Partículas no visibles (z-index stacking context)

Ver sección 5. El canvas de partículas debe:
1. Ser hijo directo de `<body>`, antes del `.container`
2. Tener `position: fixed; z-index: 10; pointer-events: none`
3. Su tamaño de buffer se establece con `canvas.width = window.innerWidth`

### 6.6 Visualizador no responde al audio tras cargar canción

**Causa**: el `MediaElementSource` del `AudioContext` solo puede crearse una vez por `audioElement`. Si se destruye y recrea el visualizador, falla.

**Solución**: crear el source una sola vez y guardarlo. Verificar con `visualizer.sourceNode`.

---

## 7. localStorage — claves usadas

| Clave                    | Tipo    | Descripción                              |
|--------------------------|---------|------------------------------------------|
| `app_theme`              | string  | `'dark'` o `'light'`                     |
| `particles_enabled`      | string  | `'true'` o `'false'`                     |
| `music_player_volume`    | string  | número 0–100                             |
| `visualizer_enabled`     | string  | `'true'` o `'false'`                     |
| `visualizer_sensitivity` | string  | float                                    |
| `visualizer_smoothing`   | string  | float                                    |
| `autoplay_music`         | string  | `'true'` o `'false'`                     |
| `pomodoro_durations`     | JSON    | `{setup, focus, short_break, long_break}`|
| `pomodoro_stats`         | JSON    | estadísticas de sesiones (ver stats.js)  |

---

## 8. Git workflow de este proyecto

- Rama `main`: código estable y probado
- Rama `features`: desarrollo de nuevas funcionalidades
- Nunca hacer push directo a `main` sin probar en `features` primero
- Los archivos de audio (`assets/audio/*.mp3`) están en `.gitignore` (demasiado grandes)
- El repositorio remoto es: `https://github.com/ElFigueroa/pomodoro.git`

---

## 9. Checklist antes de hacer push

- [ ] `node --check js/*.js` — sin errores de sintaxis
- [ ] Verificar en `http://localhost:8000` (no `file://`)
- [ ] Bump del `?v=` en los script tags de `index.html` si cambiaron archivos JS/CSS
- [ ] La música reproduce y el visualizador responde
- [ ] Las partículas aparecen y reaccionan al audio
- [ ] Los botones shuffle/loop/mute funcionan visualmente
- [ ] El tema claro/oscuro persiste al recargar
- [ ] Las estadísticas se guardan y el modal abre correctamente

---

## 10. Funcionalidades implementadas (estado al 25 Mar 2026)

- ✅ Temporizador Pomodoro con ciclos configurables
- ✅ Reproductor de música local (drag & drop o selector de archivos)
- ✅ Visualizador de audio (barras FFT, blancas, con suavizado)
- ✅ Fondo personalizable (imagen o video del usuario)
- ✅ Partículas animadas reactivas al audio (estilo bosque mágico)
- ✅ Estadísticas de sesión con gráfica de 7 días (localStorage)
- ✅ Tema claro / oscuro con persistencia
- ✅ Barra de progreso de canción con seek clickeable
- ✅ Atajos de teclado (Space, S, ←, →, M, X, R)
- ✅ Notificaciones toast
- ✅ Alerta de Vivaldi al completar ciclo

---

*Este archivo fue generado por GitHub Copilot CLI al finalizar el desarrollo de la rama `features`.*
