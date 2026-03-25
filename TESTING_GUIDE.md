# 🎵 Guía de Prueba - Pomodoro Timer con Reproductor de Música

## ✅ Lo que está listo

### 1. **Sistema de Alertas de Fin de Ciclo**
- ✓ Cuando se complete cualquier ciclo (Setup, Focus, Short Break, Long Break), se reproducirá una alerta
- ✓ La alerta reproduce **5 segundos** del archivo Vivaldi (Winter - Freetone)
- ✓ Si estaba sonando música de fondo, se pausa durante la alerta
- ✓ Si no hay archivo disponible, hay un fallback a un tono sintetizado

**Archivos:**
- `assets/audio/antonio_vivaldi-winter_freetone.org.mp3` - Alert sound

### 2. **Reproductor de Música Mejorado**
- ✓ Interfaz en el footer con controles visibles
- ✓ Botones: Anterior (⏮), Play (▶), Pause (⏸), Siguiente (⏭)
- ✓ Muestra el nombre de la canción actual
- ✓ Control de volumen con slider
- ✓ Autoplay configurable

**Controles:**
- **▶ Play** - Reproduce la canción actual o la primera de la lista
- **⏸ Pause** - Pausa la reproducción
- **⏮ Anterior** - Va a la canción anterior
- **⏭ Siguiente** - Va a la siguiente canción
- **♪ Música** (menú) - Abre el modal para cargar archivos
- **Volumen** - Slider para controlar el volumen

### 3. **Pistas de Prueba Preconoligadas**
- ✓ Al abrir la app, se carga automáticamente: `The Machine God - Fear and Hunger Atmospheric Playlist`
- ✓ Aparecerá en la lista de reproducción
- ✓ Puedes hacer clic en Play para probar el reproductor

## 🧪 Cómo Probar

### Prueba 1: Sistema de Alertas
1. Abre la aplicación
2. Inicia un ciclo (cualquiera)
3. Espera a que termine el contador
4. **Deberías escuchar 5 segundos de música clásica (Vivaldi)**
5. La canción de fondo (si está sonando) se reanudará automáticamente

### Prueba 2: Reproductor de Música
1. Espera a que cargue la pista de prueba (2-3 segundos)
2. En el footer, deberías ver: **"The Machine God - Fear and Hunger..."**
3. Haz clic en el botón ▶ Play
4. **La música debería sonar en el fondo**
5. Prueba los botones:
   - ⏸ Para pausar
   - ▶ Para reanudar
   - Volumen para ajustar

### Prueba 3: Cargar Archivos Locales
1. Haz clic en el icono ♪ (Música) en el header
2. Selecciona la pestaña **"Archivos MP3"**
3. Haz clic en **"Cargar Archivos"** (o arrastra archivos)
4. Selecciona `antonio_vivaldi-winter_freetone.org.mp3` o cualquier otro MP3
5. La canción aparecerá en la lista
6. Haz clic en Play para reproducirla

### Prueba 4: Integración Alerta + Música
1. Carga `The Machine God` como se describe en Prueba 2
2. Presiona Play
3. Inicia cualquier ciclo del Pomodoro
4. Espera a que termine
5. **Deberías escuchar la alerta de Vivaldi mientras la música se pausa**
6. Después de 5 segundos, la música se reanuda

## 📁 Archivos de Prueba Disponibles

```
assets/audio/
├── antonio_vivaldi-winter_freetone.org.mp3 (5 segundos - Alerta)
└── The Machine God｜Fear and Hunger Atmospheric Playlist [GWmtLEIXJdQ].mp3 (41 MB - Prueba)
```

## 🐛 Solución de Problemas

| Problema | Solución |
|----------|----------|
| No se escucha la alerta | Verifica que el volumen del navegador esté activo |
| La música no carga | Comprueba que los archivos estén en `assets/audio/` |
| El reproductor no aparece | Recarga la página (F5) |
| Los botones no funcionan | Abre la consola (F12) y verifica los errores |

## 🔊 Notas Importantes

- **Autoplay**: Algunos navegadores requieren interacción del usuario antes de reproducir audio
- **CORS**: Los archivos se sirven localmente, así que no hay restricciones CORS
- **Visualizador**: Se sincroniza automáticamente con la música reproducida
- **Estado**: El volumen y preferencias se guardan en localStorage

---

**¡Listo para probar! 🚀**
