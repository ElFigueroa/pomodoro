---
# 🍅 Focus Music — Reloj Pomodoro con Música

Aplicación web minimalista para gestionar sesiones Pomodoro con reproductor de música local y visualizador de audio en tiempo real.

---

## 🌟 Características

### ⏱️ Sistema Pomodoro
- Ciclos automáticos: **Setup** (5min) → **Focus** (25min) → **Descanso corto** (5min) → **Descanso largo** (10min cada 2 ciclos)
- Controles de **Iniciar / Pausar / Stop**
- Indicador visual del ciclo actual con barra de progreso

### 🎵 Reproductor de Música Local
- Carga archivos **MP3, OGG, WAV** desde tu equipo
- Arrastrar y soltar archivos (drag & drop)
- **Playlist**: click en cualquier pista para reproducirla (con indicador ♪ de la canción activa)
- **Aleatorio** y **Repetir** con indicadores visuales
- **Barra de progreso** de la canción (seekable — haz clic para cambiar la posición)
- Control de volumen deslizable + botón de **silenciar (♪)**

### 📊 Visualizador de Audio
- 72 barras de frecuencia en tiempo real
- **Gradiente de color** dinámico: azul en la base → blanco en la cima
- Esquinas superiores redondeadas para una apariencia pulida
- Configurable: sensibilidad (0.5×–2.0×) y suavizado

### 🎨 Personalización de Fondo
- Soporta **imágenes** (JPG, PNG, GIF) y **videos** (MP4)
- La imagen mantiene su brillo original (sin sobreposición oscura)

### ⌨️ Atajos de Teclado

| Tecla | Acción |
|-------|--------|
| `Espacio` | Reproducir / Pausar música |
| `S` | Iniciar / Pausar el Pomodoro |
| `M` | Silenciar / Activar audio |
| `←` `→` | Pista anterior / siguiente |
| `Esc` | Cerrar modal abierto |

---

## 📂 Estructura del Proyecto

```
pomodoro/
├── index.html              # Estructura HTML principal
├── css/
│   └── styles.css          # Estilos minimalistas y responsivos
├── js/
│   ├── main.js             # Orquestación principal y eventos UI
│   ├── pomodoro.js         # Lógica del temporizador
│   ├── music-player.js     # Reproducción de audio (shuffle, loop, playlist)
│   └── visualizer.js       # Visualizador de frecuencias con Canvas API
├── assets/
│   ├── images/             # Imágenes de fondo de ejemplo
│   └── audio/              # Coloca aquí tus archivos de audio
│       └── .gitkeep        # (archivos de audio excluidos del repo por su tamaño)
└── README.md
```

---

## 🚀 Cómo Usar

### Requisitos
La app debe servirse sobre **HTTP** (no `file://`) para que `fetch()` funcione correctamente al cargar audio por defecto.

```bash
# Opción 1 — Python 3
cd /ruta/al/proyecto
python3 -m http.server 8080
# Abre http://localhost:8080

# Opción 2 — VS Code Live Server
# Click derecho en index.html → "Open with Live Server"
```

### Primeros pasos
1. Haz clic en **♪** (esquina superior) para abrir el panel de música
2. Carga tus archivos MP3 (botón o arrastrar y soltar)
3. Opcionalmente cambia el fondo con el botón **◻ Fondo**
4. Presiona **▶ Iniciar** para comenzar tu sesión Pomodoro

---

## ⚙️ Configuración Avanzada

Abre el modal de configuración (**⚙**) para:
- **Duraciones** de cada ciclo (Setup, Focus, Descanso Corto/Largo)
- **Visualizador**: activar/desactivar, sensibilidad y suavizado
- **Autoplay**: reproducir música al iniciar el Pomodoro
- **Reset**: restaurar todos los valores por defecto

Las preferencias se guardan automáticamente en `localStorage`.

---

## 🔧 Detalles Técnicos

- **Web Audio API** — análisis de frecuencias para el visualizador
- **File API** — carga de archivos locales
- **Canvas API** — renderización con gradientes y `roundRect`
- **LocalStorage** — persistencia de preferencias
- Sin dependencias externas — Vanilla JS puro

### Navegadores soportados
Chrome 99+, Firefox 112+, Safari 15.4+, Edge 99+

---

## 🐛 Solución de Problemas

**"El visualizador no responde"**  
→ Asegúrate de que hay música reproduciéndose; el AudioContext se activa al primer clic del usuario.

**"No carga la música automáticamente al abrir"**  
→ Abre la app vía HTTP (ver Requisitos arriba). No funciona en `file://`.

**"Las preferencias no se guardan"**  
→ Verifica que `localStorage` no esté deshabilitado en tu navegador.

---

**Versión**: 2.0.0  
**Última actualización**: Junio 2025  
**Creado con ❤️ para mantener el enfoque**


Una aplicación web moderna y minimalista para gestionar sesiones Pomodoro con músicaintegradora y visualización de audio en tiempo real.

## 🌟 Características

### ⏱️ Sistema Pomodoro Avanzado
- **Setup automático**: 5 minutos de preparación
- **Ciclos completos**:
  - Focus: 25 minutos de trabajo concentrado
  - Descanso Corto: 5 minutos
  - Descanso Largo: 10 minutos (cada 2 ciclos)
- **Controles intuitivos**: Iniciar, Pausa, Stop
- **Indicador visual**: Muestra el ciclo actual y su progreso
- **Barra de progreso**: Visualiza el avance del ciclo actual

### 🎵 Sistema de Música Flexible
- **Modo Local**: Carga múltiples archivos MP3
  - Selecciona archivos desde tu equipo
  - Crea playlists automáticas
  - Reproducción secuencial con loop continuo
  - Navegación por canciones (siguiente/anterior)
  
- **Modo YouTube**: Integración con videos de YouTube
  - Ingresa la URL del video
  - Extrae el audio para reproducción de fondo
  - Reproducción sin interrupciones

- **Controles de Audio**:
  - Control de volumen deslizable
  - Botón mute/unmute
  - Indicador de estado (reproduciendo/pausado)

### 📊 Visualizador de Audio
- Visualización en tiempo real estilo Rainmeter
- Barras minimalistas y elegantes
- **Configuración ajustable**:
  - Sensibilidad (0.5x a 2.0x)
  - Suavizado (0.1 a 0.9)
  - Activar/desactivar visualización

### 🎨 Personalización de Fondo
- Soporta **imágenes estáticas**: JPG, PNG, GIF
- Soporta **videos**: MP4 con reproducción en loop
- Cambio dinámico sin afectar el temporizador
- Transiciones suaves

### ⚙️ Configuración Personalizable
- Ajusta las duraciones de cada ciclo
- Autoplay de música
- Preferencias guardadas automáticamente
- Restauración de valores por defecto

## 📂 Estructura del Proyecto

```
pomodoro/
├── index.html              # Estructura HTML principal
├── css/
│   └── styles.css          # Estilos minimalistas y responsivos
├── js/
│   ├── main.js             # Orquestación principal
│   ├── pomodoro.js         # Lógica del temporizador
│   ├── music-player.js     # Sistema de reproducción de música
│   └── visualizer.js       # Visualizador de audio
├── assets/
│   ├── images/             # Almacén de imágenes de fondo
│   └── audio/              # Almacén de archivos de audio
└── README.md               # Este archivo
```

## 🚀 Cómo Usar

### Instalación
1. Descarga o clona todo el contenido en una carpeta
2. Abre `index.html` en tu navegador web moderno
3. ¡La aplicación está lista para usar! No requiere instalación adicional

### Primeros Pasos
1. **Configurar Música** (opcional):
   - Haz clic en el icono 🎵 en la esquina superior
   - **Modo Local**: Selecciona archivos MP3 de tu disco
   - **Modo YouTube**: Pega una URL de YouTube
   
2. **Personalizar Fondo** (opcional):
   - Haz clic en el botón "🖼️ Cambiar Fondo"
   - Selecciona una imagen o video

3. **Iniciar Sesión**:
   - Haz clic en "▶️ Iniciar"
   - El temporizador comenzará automáticamente con Setup (5 min)

### Controles Principales

| Control | Descripción |
|---------|------------|
| ▶️ Iniciar | Comienza la cuenta regresiva |
| ⏸️ Pausa | Pausa el temporizador actual |
| ⏹️ Stop | Detiene y reinicia el ciclo actual |
| 🎵 | Abre el selector de música |
| ⚙️ | Accede a la configuración |
| 🖼️ | Cambia el fondo de pantalla |
| 🔊 / 🔇 | Controla volumen/silencio |

### Configuración Avanzada

Abre el modal de configuración (⚙️) para:
- **Visualizador**: Activar/desactivar y ajustar sensibilidad
- **Duraciones**: Modificar la longitud de cada ciclo
- **Autoplay**: Reproducir música automáticamente
- **Reset**: Restaurar todos los valores por defecto

## 🔧 Características Técnicas

### APIs Utilizadas
- **Web Audio API**: Análisis de audio para el visualizador
- **File API**: Carga de archivos desde el equipo
- **LocalStorage**: Persistencia de preferencias
- **Canvas API**: Renderización del visualizador

### Navegadores Soportados
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Navegadores modernos basados en Chromium

### Características PWA Básicas
- Funciona offline (después de cachear)
- Interfaz adaptativa y responsive
- Optimizado para dispositivos móviles

## 📝 Flujo de Trabajo Recomendado

```
1. Abre la aplicación
2. (Opcional) Configura tu música favorita
3. (Opcional) Personaliza el fondo
4. Haz clic en "Iniciar"
5. Trabaja durante los 25 minutos de Focus
6. Toma el descanso sugerido
7. Repite ciclos segun sea necesario
```

## 💾 Almacenamiento Local

La aplicación guarda automáticamente:
- **Configuración de volumen**: Último nivel de volumen establecido
- **Duraciones**: Tiempos personalizados de cada ciclo
- **Preferencias del visualizador**: Sensibilidad y suavizado
- **Configuración de audio**: Modo actual (local/YouTube)

Todos estos datos se guardan en `localStorage` del navegador.

## ⌨️ Atajos de Teclado (Futura Mejora)

(Actualmente se recomienda usar los botones de la interfaz)

## 🐛 Solución de Problemas

### "El visualizador no funciona"
- Asegúrate de que tienes música reproduciendo
- Verifica que los permisos de audio estén habilitados
- Intenta recargar la página

### "No puedo cargar música de YouTube"
- Verifica que la URL sea correcta (formato: youtube.com/watch?v=...)
- Necesitas conexión a internet
- Algunos videos pueden tener restricciones de copyright

### "Las preferencias no se guardan"
- Verifica que localStorage no esté deshabilitado
- Intenta borrar datos de sitio y recarga

### "La aplicación va lenta"
- Cierra otras pestañas abiertas
- Intenta con un video de fondo más optimizado
- Desactiva temporalmente el visualizador

## 📦 Dependencias

Esta aplicación usa principalmente **Vanilla JavaScript** sin dependencias externas. Todos los recursos están integrados.

## 🎨 Personalización Avanzada

### Modificar Colores
Edita los valores en `CSS/styles.css`:
```css
:root {
    --color-primary: #4a9eff;    /* Color azul principal */
    --color-warning: #ff6b6b;    /* Color de alerta */
    --color-success: #50fa7b;    /* Color de éxito */
}
```

### Ajustar Duración de Ciclos
En el modal de configuración, modifica:
- Setup: Tiempo de preparación
- Focus: Tiempo de trabajo
- Descanso Corto: Descanso rápido
- Descanso Largo: Descanso extendido

## 📄 Licencia

Proyecto de código abierto. Libre para usar y modificar.

## 🤝 Contribuciones

Las mejoras y sugerencias son bienvenidas. Consideraciones futuras:
- [ ] Sincronización con Google Calendar
- [ ] Historial de sesiones completadas
- [ ] Múltiples perfiles de usuario
- [ ] Notificaciones de navegador
- [ ] Exportación de estadísticas
- [ ] Integración con Spotify

## 📞 Soporte

Si encuentras problemas:
1. Verifica que uses un navegador moderno
2. Limpia el caché del navegador
3. Intenta en otro navegador
4. Consulta la sección "Solución de Problemas"

## 🌟 Tips para una Mejor Experiencia

1. **Ambientación**: Elige un fondo visual que te inspire
2. **Música**: Busca playlists sin lyrics para mejor concentración
3. **Ritmo**: Respeta los ciclos, los descansos son importantes
4. **Consistencia**: Usa la técnica Pomodoro regularmente

---

**Versión**: 1.0.0  
**Última actualización**: Marzo 2026  
**Creado con ❤️ para mantener el enfoque**
