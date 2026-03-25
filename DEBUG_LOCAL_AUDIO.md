# Diagnóstico: Audio Local No Reproduce

## Cambios Realizados

### 1. Logging Extendido en `music-player.js`
Se agregó **logging detallado** en dos métodos críticos:

#### `addToPlaylist()` (línea 73-110)
- Muestra cada archivo procesado
- Indica si es válido (audio/*)
- Muestra la Blob URL creada
- Total de archivos en playlist

**Outputs esperados:**
```
📂 addToPlaylist() - Procesando X archivos
  📄 Archivo: song.mp3 | Tipo: audio/mpeg | Válido: true
  ✓ Blob URL creada: blob:http://localhost:8000/...
  ✅ Agregada a playlist: song
✓ Total en playlist: 1 - Listo para reproducir
```

#### `play()` (línea 159-240)
- Muestra el track seleccionado
- Confirma URL configurada
- Muestra volumen
- Detalles del error si falla

**Outputs esperados al hacer Play:**
```
🎵 play() llamado con index: 0 mode: local
📀 Track seleccionada: { index: 0, name: "song", url: "blob:..." }
✓ audioElement.src configurado
🔊 Volumen configurado a: 0.7 ( 70 %)
⏱️  currentTime reset a 0
→ Llamando onTrackChange
→ Llamando onAudioSource
▶️  Intentando play()...
✅ ¡Reproducción EXITOSA!: song
```

### 2. Fix en `visualizer.js`
Se corrigió la conexión de audio en `initAudioContext()`:
- Ahora **reutiliza** `mediaSource` (no la crea múltiples veces)
- Correcta conexión: `source → analyser → destination`
- Mejor logging de inicialización

---

## Pasos de Diagnóstico

### Step 1: Abre la Consola del Navegador
```
1. Presiona F12 en el navegador
2. Haz clic en la pestaña "Console"
3. Limpia con el botón ⊘ (círculo rojo)
```

### Step 2: Carga un Archivo de Audio
```
1. Abre la sección "Música" (ícono 🎵)
2. Haz clic en "Seleccionar Archivos" 
3. Elige un MP3 local
4. Haz clic en "Cargar"
```

**Busca en la consola:**
```
📂 addToPlaylist() - Procesando 1 archivos
  📄 Archivo: song.mp3 | Tipo: audio/mpeg | Válido: true
  ✓ Blob URL creada: blob:http://localhost:8000/...
```

✅ Si ves esto: **El archivo fue cargado correctamente**

### Step 3: Presiona Play
```
1. Haz clic en botón ▶️
```

**Busca en la consola:**
```
🎵 play() llamado con index: 0 mode: local
📀 Track seleccionada: { index: 0, name: "song", url: "blob:..." }
✓ audioElement.src configurado
🔊 Volumen configurado a: 0.7
...
```

---

## Diagnóstico por Síntoma

### ❌ Si ves: ERROR en addToPlaylist()
```
⚠️ Archivo no es audio: song.mp3
```
**Problema:** El archivo no se detecta como audio
**Solución:** 
- Verifica que sea MP3 válido: `file song.mp3`
- Intenta un MP3 diferente
- Prueba con `file-type` de terminal

### ❌ Si ves: No aparece "✓ audioElement.src configurado"
```
🎵 play() llamado...
❌ Playlist vacía - no hay nada que reproducir
```
**Problema:** No hay archivos cargados
**Solución:**
- Vuelve al Step 2
- Asegúrate de hacer clic en "Cargar"

### ❌ Si ves: "▶️ Intentando play()..." pero no "✅ ¡Reproducción EXITOSA!"
```
▶️  Intentando play()...
❌ ERROR AL REPRODUCIR: NotAllowedError
```
**Problema:** Autoplay bloqueado (mismo como antes del fix)
**Solución:** 
- Verificar que estés en `http://localhost:8000`
- NO usar `file://` URL
- Reinicia navegador si persiste

### ❌ Si ves: ERROR de formato
```
❌ ERROR AL REPRODUCIR: NotSupportedError
Código de error: NotSupportedError
⚠️ Formato de audio no soportado: song.mp3
```
**Problema:** Formato de audio no soportado por navegador
**Solución:**
- Convierte MP3 a OGG: `ffmpeg -i song.mp3 -c:a libvorbis song.ogg`
- Intenta OGG en la app
- Verifica que el MP3 sea válido: `ffprobe song.mp3`

### ❌ Si ves: ERROR de red
```
❌ ERROR AL REPRODUCIR: NetworkError
⚠️ Error de red - URL inaccesible
```
**Problema:** Blob URL no es accesible
**Solución:**
- Asegúrate de servir con `python3 -m http.server 8000`
- NO uses `file://` URL
- Abre consola de Network (pestaña "Network")
- Busca si falla la petición del blob

---

## Full Trace Example

Si todo funciona, deberías ver algo como esto en console:

```
✓ Archivo de audio agregado

📂 addToPlaylist() - Procesando 1 archivos
  📄 Archivo: test-music.mp3 | Tipo: audio/mpeg | Válido: true
  ✓ Blob URL creada: blob:http://localhost:8000/00a1b2c3-d4e5-f6g7-h8i9-j0k1l2m3n4o5
  ✅ Agregada a playlist: test-music
→ Notificando onPlaylistUpdate
✓ Total en playlist: 1 - Listo para reproducir (esperando clic del usuario)

[Usuario hace clic en Play]

🎵 play() llamado con index: 0 mode: local
📀 Track seleccionada: { index: 0, name: "test-music", url: "blob:http://localhost:8000/..." }
✓ audioElement.src configurado
🔊 Volumen configurado a: 0.7 ( 70 %)
⏱️  currentTime reset a 0
→ Llamando onTrackChange
→ Llamando onAudioSource
🎵 Inicializando Audio Context...
  ✓ AudioContext creado: running
  ✓ Analyser creado
  ✓ MediaElementAudioSource creada
  ✓ Conexiones establecidas: source → analyser → destination
✅ Audio Context completamente inicializado - Listo para visualización
▶️  Intentando play()...
✅ ¡Reproducción EXITOSA!: test-music
```

---

## Checklist Rápido

- [ ] ¿Estoy en `http://localhost:8000`? (no `file://`)
- [ ] ¿El archivo es MP3 válido? (`file song.mp3`)
- [ ] ¿Aparece el nombre del archivo en la interfaz?
- [ ] ¿Presioné el botón Play (no Enter)?
- [ ] ¿Abro F12 ANTES de cargar el archivo?
- [ ] ¿Veo "📂 addToPlaylist()" en console?
- [ ] ¿Veo "🎵 play() llamado" cuando presiono Play?
- [ ] ¿Veo el error específico? (NotAllowedError, NetworkError, etc)

---

## Información para Reportar

Si aún no funciona, copia TODA la consola y pega aquí:

1. **Limpia la consola** (botón ⊘)
2. **Carga un archivo**
3. **Presiona Play**
4. **Copia toda la consola** (Ctrl+A en console area, Ctrl+C)
5. **Pégame el output completo**

Así podré ver exactamente dónde falla. 🔍
