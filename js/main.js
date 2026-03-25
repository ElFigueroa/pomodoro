/**
 * MAIN.JS
 * Archivo principal de orquestación
 * Integra todos los módulos y gestiona la interfaz de usuario
 */

let pomodoro = null;
let musicPlayer = null;
let visualizer = null;
let alertAudioElement = null; // Para reproducir la alerta de Vivaldi

// ===========================
// TOAST NOTIFICATIONS
// ===========================

function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('toast-out');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ===========================
// INICIALIZACIÓN
// ===========================

document.addEventListener('DOMContentLoaded', () => {
    console.log('App iniciada');
    
    // Crear elemento de audio para alertas
    alertAudioElement = new Audio();
    alertAudioElement.src = 'assets/audio/antonio_vivaldi-winter_freetone.org.mp3';
    alertAudioElement.crossOrigin = 'anonymous';
    alertAudioElement.volume = 0.7;
    
    // Inicializar módulos
    pomodoro = new PomodoroTimer();
    musicPlayer = new MusicPlayer();
    
    // Inicializar visualizador
    const canvas = document.getElementById('visualizer-canvas');
    visualizer = new AudioVisualizer(canvas);
    
    // Configurar callbacks
    setupCallbacks();
    
    // Preparar interfaz
    initializeUI();
    
    // Cargar preferencias guardadas
    loadUserPreferences();
    
    // Cargar pistas de audio de prueba desde assets
    loadTestAudioTracks();

    // Atajos de teclado
    setupKeyboardShortcuts();

    // Visibility change listener
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && visualizer && musicPlayer) {
            if (musicPlayer.isPlaying) {
                visualizer.ensureReadyFromUserGesture(musicPlayer.getAudioElement());
            }
        }
    });
});

// ===========================
// CONFIGURACIÓN DE CALLBACKS
// ===========================

function setupCallbacks() {
    // Callbacks del Pomodoro
    pomodoro.onTimeUpdate = (timeRemaining, totalTime) => {
        updateTimerDisplay(pomodoro.getFormattedTime());
        updateProgressBar(timeRemaining, totalTime);
    };

    pomodoro.onCycleChange = (cycleType, cycleCount) => {
        updateCycleIndicator(cycleType, cycleCount);
    };

    pomodoro.onCycleComplete = (cycleType) => {
        playNotification(cycleType);
    };

    // Callbacks del reproductor de música
    musicPlayer.onPlaylistUpdate = (playlist) => {
        updatePlaylistUI(playlist);
    };

    musicPlayer.onTrackChange = (index, trackName) => {
        updateCurrentTrackDisplay(index, trackName);
    };

    musicPlayer.onAudioSource = (audioElement) => {
        // Esta llamada ocurre durante acciones del usuario (play/resume),
        // por lo que es el mejor momento para reanudar el AudioContext.
        visualizer.ensureReadyFromUserGesture(audioElement);
    };

    musicPlayer.onStateChange = (state, data) => {
        updateMusicPlayerUI(state, data);

        // Si la reproducción ya inició, reforzar que el visualizador esté activo.
        if (state === 'playing') {
            prepareVisualizerFromUserGesture();
        }
    };
}

async function prepareVisualizerFromUserGesture() {
    if (!visualizer || !musicPlayer) {
        return;
    }

    try {
        const toggle = document.getElementById('visualizer-toggle');
        const shouldEnableVisualizer = !toggle || toggle.checked;

        if (shouldEnableVisualizer && !visualizer.isVisualizerEnabled()) {
            visualizer.setEnabled(true);
        }

        await visualizer.ensureReadyFromUserGesture(musicPlayer.getAudioElement());
    } catch (e) {
        console.warn('No se pudo preparar el visualizador:', e);
    }
}

// ===========================
// INTERFAZ DE USUARIO - SETUP INICIAL
// ===========================

function initializeUI() {
    const btnStart = document.getElementById('btn-start');
    const btnPause = document.getElementById('btn-pause');
    const btnStop = document.getElementById('btn-stop');
    const btnMusicToggle = document.getElementById('btn-music-toggle');
    const btnSettings = document.getElementById('btn-settings');
    const btnBackground = document.getElementById('btn-background');
    const backgroundInput = document.getElementById('background-input');
    const volumeSlider = document.getElementById('volume-slider');
    const btnMute = document.getElementById('btn-mute');

    // Botones Pomodoro
    btnStart.addEventListener('click', toggleStartPause);
    btnPause.addEventListener('click', () => {
        pomodoro.pause();
        updateStartPauseButtons();
    });
    btnStop.addEventListener('click', () => {
        pomodoro.stop();
        updateStartPauseButtons();
    });

    // Personalización de fondo
    btnBackground.addEventListener('click', () => backgroundInput.click());
    backgroundInput.addEventListener('change', handleBackgroundChange);

    // Música y volumen
    btnMusicToggle.addEventListener('click', openMusicModal);
    volumeSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        musicPlayer.setVolume(value);
        updateVolumeDisplay(value);
        e.target.style.setProperty('--slider-value', value + '%');
        // Si el usuario sube el volumen estando muteado, desmutear
        if (value > 0 && musicPlayer.isMuted) {
            musicPlayer.isMuted = false;
            updateMuteButton(false);
        }
    });

    // Botón mute — ahora es el ícono ♪ integrado
    btnMute.addEventListener('click', () => {
        const isMuted = musicPlayer.toggleMute();
        updateMuteButton(isMuted);
    });

    // Controles de reproductor de música
    const btnPlayMusic = document.getElementById('btn-play-music');
    const btnPauseMusic = document.getElementById('btn-pause-music');
    const btnPrevTrack = document.getElementById('btn-prev-track');
    const btnNextTrack = document.getElementById('btn-next-track');

    btnPlayMusic.addEventListener('click', async () => {
        if (musicPlayer.playlist.length > 0) {
            await prepareVisualizerFromUserGesture();
            musicPlayer.play(musicPlayer.currentTrackIndex);
        } else {
            showToast('No hay canciones cargadas. Abre ♪ para cargar archivos.', 'info');
        }
    });

    btnPauseMusic.addEventListener('click', () => musicPlayer.pause());

    btnPrevTrack.addEventListener('click', () => {
        if (musicPlayer.playlist.length > 0) musicPlayer.playPrevious();
    });

    btnNextTrack.addEventListener('click', () => {
        if (musicPlayer.playlist.length > 0) musicPlayer.playNext();
    });

    // Shuffle y Loop — usan clases CSS para estado activo
    const btnShuffle = document.getElementById('btn-shuffle');
    const btnLoop = document.getElementById('btn-loop');

    btnShuffle.addEventListener('click', () => {
        const isOn = musicPlayer.toggleShuffle();
        btnShuffle.classList.toggle('btn-active', isOn);
        showToast(isOn ? 'Aleatorio activado' : 'Aleatorio desactivado', 'info', 1500);
    });

    btnLoop.addEventListener('click', () => {
        const isOn = musicPlayer.toggleLoop();
        btnLoop.classList.toggle('btn-active', isOn);
        showToast(isOn ? 'Repetir activado' : 'Repetir desactivado', 'info', 1500);
    });

    // Barra de progreso de la canción — seekable
    const trackProgressBar = document.getElementById('track-progress-bar');
    trackProgressBar.addEventListener('click', (e) => {
        const audio = musicPlayer.audioElement;
        if (!audio.duration || isNaN(audio.duration)) return;
        const rect = trackProgressBar.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        audio.currentTime = ratio * audio.duration;
    });

    // Actualizar progreso en tiempo real
    musicPlayer.audioElement.addEventListener('timeupdate', updateTrackProgress);
    musicPlayer.audioElement.addEventListener('ended', () => {
        document.getElementById('track-progress-fill').style.width = '0%';
        document.getElementById('track-time').textContent = '--:-- / --:--';
    });

    // Configuración
    btnSettings.addEventListener('click', openSettingsModal);

    // Modales
    setupModals();

    // Estado inicial de la UI
    updateTimerDisplay(pomodoro.getFormattedTime());
    updateCycleIndicator(pomodoro.currentCycleType, pomodoro.cycleCount);
    updateVolumeDisplay(musicPlayer.getVolume());
}

// ===========================
// PROGRESO DE CANCIÓN
// ===========================

/**
 * Formatea segundos en M:SS
 */
function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Actualiza la barra de progreso y el tiempo de la canción actual
 */
function updateTrackProgress() {
    const audio = musicPlayer.audioElement;
    if (!audio.duration || isNaN(audio.duration)) return;
    const progress = (audio.currentTime / audio.duration) * 100;
    document.getElementById('track-progress-fill').style.width = progress + '%';
    document.getElementById('track-time').textContent =
        `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
}


// ===========================
// ATAJOS DE TECLADO
// ===========================

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ignorar si el usuario está escribiendo en un input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        // Verificar si hay un modal abierto
        const modalOpen = document.querySelector('.modal.active');
        
        switch (e.code) {
            case 'Space':
                e.preventDefault();
                if (musicPlayer.isPlaying) {
                    musicPlayer.pause();
                } else if (musicPlayer.playlist.length > 0) {
                    prepareVisualizerFromUserGesture().then(() => {
                        musicPlayer.play(musicPlayer.currentTrackIndex);
                    });
                }
                break;
            case 'KeyS':
                if (!modalOpen) {
                    e.preventDefault();
                    toggleStartPause();
                }
                break;
            case 'ArrowRight':
                if (!modalOpen && musicPlayer.playlist.length > 0) {
                    e.preventDefault();
                    musicPlayer.playNext();
                }
                break;
            case 'ArrowLeft':
                if (!modalOpen && musicPlayer.playlist.length > 0) {
                    e.preventDefault();
                    musicPlayer.playPrevious();
                }
                break;
            case 'KeyM':
                e.preventDefault();
                {
                    const isMuted = musicPlayer.toggleMute();
                    updateMuteButton(isMuted);
                }
                break;
            case 'Escape':
                document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
                break;
        }
    });
}

// ===========================
// CONTROLES DEL POMODORO
// ===========================

function toggleStartPause() {
    if (pomodoro.isPaused) {
        pomodoro.resume();
    } else if (pomodoro.isRunning) {
        pomodoro.pause();
    } else {
        pomodoro.start();
    }
    updateStartPauseButtons();
}

function updateStartPauseButtons() {
    const btnStart = document.getElementById('btn-start');
    const btnPause = document.getElementById('btn-pause');

    if (pomodoro.isRunning && !pomodoro.isPaused) {
        btnStart.disabled = true;
        btnPause.disabled = false;
        btnStart.style.opacity = '0.5';
        btnPause.style.opacity = '1';
    } else {
        btnStart.disabled = false;
        btnPause.disabled = true;
        btnStart.style.opacity = '1';
        btnPause.style.opacity = '0.5';
    }
}

function updateTimerDisplay(formattedTime) {
    document.getElementById('timer-minutes').textContent = formattedTime.minutes;
    document.getElementById('timer-seconds').textContent = formattedTime.seconds;
}

function updateCycleIndicator(cycleType, cycleCount) {
    const cycleNames = {
        'setup': 'Setup',
        'focus': 'Focus',
        'short_break': 'Descanso',
        'long_break': 'Descanso Largo'
    };

    const cycleNumbers = {
        'setup': 'Prep',
        'focus': `#${cycleCount + 1}`,
        'short_break': `Break ${cycleCount + 1}`,
        'long_break': 'Largo'
    };

    document.getElementById('cycle-name').textContent = cycleNames[cycleType];
    document.getElementById('cycle-number').textContent = cycleNumbers[cycleType];
}

function updateProgressBar(timeRemaining, totalTime) {
    const progress = ((totalTime - timeRemaining) / totalTime) * 100;
    document.getElementById('progress-fill').style.width = progress + '%';
}

function playNotification(cycleType) {
    // Reproducir alerta de Vivaldi para notificar el fin del ciclo
    try {
        // Pausar la música actual si está sonando
        if (musicPlayer.isPlaying) {
            musicPlayer.pause();
            musicPlayer.wasPlayingBeforeAlert = true;
        }

        // Detener si ya estaba reproduciéndose
        alertAudioElement.currentTime = 0;
        
        // Reproducir 5 segundos de alarma
        const playPromise = alertAudioElement.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(e => {
                console.error('Error al reproducir alerta:', e);
                // Fallback a tono sintetizado si falla el audio
                playOscillatorFallback();
            });
            
            // Pausar después de 5 segundos
            setTimeout(() => {
                alertAudioElement.pause();
                alertAudioElement.currentTime = 0;
                
                // Reanudar música si estaba sonando antes
                if (musicPlayer.wasPlayingBeforeAlert) {
                    musicPlayer.resume();
                    musicPlayer.wasPlayingBeforeAlert = false;
                }
            }, 5000);
        }
        
        // Log del ciclo completado
        const cycleNames = {
            'setup': 'Setup completado',
            'focus': 'Sesión de enfoque completada',
            'short_break': 'Descanso corto completado',
            'long_break': 'Descanso largo completado'
        };
        console.log('🔔 ' + (cycleNames[cycleType] || 'Ciclo completado'));
        
    } catch (e) {
        console.error('Error en notificación:', e);
        playOscillatorFallback();
    }
}

function playOscillatorFallback() {
    // Fallback a tono sintetizado si el audio falla
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 880;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        console.log('Notificación de audio no disponible');
    }
}

// ===========================
// PERSONALIZACIÓN DE FONDO
// ===========================

async function handleBackgroundChange(event) {
    const file = event.target.files[0];
    if (!file) return;

    const container = document.getElementById('background-container');
    const isVideo = file.type.startsWith('video/');

    try {
        if (isVideo) {
            // Limpiar container
            container.innerHTML = '';

            // Crear video element
            const video = document.createElement('video');
            video.autoplay = true;
            video.loop = true;
            video.muted = true;
            video.src = URL.createObjectURL(file);

            // Dibujar video en canvas para mejor control
            const canvas = container.querySelector('canvas');
            if (canvas && canvas.id === 'background-video-canvas') {
                drawVideoToCanvas(video, canvas);
            } else {
                container.innerHTML = '';
                container.appendChild(video);
            }
        } else {
            // Crear imagen de fondo
            const img = new Image();
            img.onload = () => {
                container.innerHTML = '';
                container.appendChild(img);
            };
            img.onerror = () => {
                showToast('Error al cargar la imagen.', 'error');
            };
            img.src = URL.createObjectURL(file);
        }

        // Guardar referencia
        localStorage.setItem('background_file', JSON.stringify({
            type: file.type,
            lastModified: file.lastModified
        }));
    } catch (e) {
        console.error('Error al cambiar fondo:', e);
        showToast('Error al cambiar el fondo.', 'error');
    }

    // Reset input
    event.target.value = '';
}

function drawVideoToCanvas(video, canvas) {
    const ctx = canvas.getContext('2d');
    
    video.addEventListener('play', () => {
        const drawFrame = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);
            if (video.paused || video.ended) return;
            requestAnimationFrame(drawFrame);
        };
        drawFrame();
    });

    video.play().catch(e => {
        console.warn('No se pudo reproducir video de fondo:', e);
    });
}

// ===========================
// CONTROLES DE MÚSICA
// ===========================

function updateMusicPlayerUI(state, data) {
    const btnPlayMusic = document.getElementById('btn-play-music');
    const btnPauseMusic = document.getElementById('btn-pause-music');
    
    if (state === 'playing') {
        console.log('Reproduciendo música');
        btnPlayMusic.style.opacity = '0.5';
        btnPlayMusic.disabled = true;
        btnPauseMusic.style.opacity = '1';
        btnPauseMusic.disabled = false;
    } else if (state === 'paused') {
        console.log('Música pausada');
        btnPlayMusic.style.opacity = '1';
        btnPlayMusic.disabled = false;
        btnPauseMusic.style.opacity = '0.5';
        btnPauseMusic.disabled = true;
    } else if (state === 'stopped') {
        console.log('Música detenida');
        btnPlayMusic.style.opacity = '1';
        btnPlayMusic.disabled = false;
        btnPauseMusic.style.opacity = '0.5';
        btnPauseMusic.disabled = true;
    }
}

function updatePlaylistUI(playlist) {
    const container = document.getElementById('playlist-items');
    
    if (playlist.length === 0) {
        container.innerHTML = `
            <div class="playlist-empty">
                <div class="playlist-empty-icon">♪</div>
                <p>Arrastra archivos MP3 aquí<br>o usa el botón de arriba</p>
            </div>`;
        return;
    }

    container.innerHTML = playlist.map((track, index) => `
        <div class="playlist-item ${index === musicPlayer.currentTrackIndex ? 'active' : ''}" onclick="playTrackFromPlaylist(${index})">
            <span class="playlist-track-num">${index === musicPlayer.currentTrackIndex ? '♪' : String(index + 1).padStart(2, '0')}</span>
            <span class="playlist-item-name">${track.name}</span>
            <button class="playlist-item-remove" onclick="event.stopPropagation(); removePlaylistItem(${index})" title="Eliminar">✕</button>
        </div>
    `).join('');
}

function playTrackFromPlaylist(index) {
    prepareVisualizerFromUserGesture().then(() => {
        musicPlayer.play(index);
    });
}

function updateCurrentTrackDisplay(index, trackName) {
    console.log(`Reproduciendo: ${trackName}`);
    // Actualizar nombre en el footer
    document.getElementById('current-track-name').textContent = trackName;
    // Actualizar lista de reproducción
    updatePlaylistUI(musicPlayer.getPlaylist());
}

function removePlaylistItem(index) {
    musicPlayer.removeTrack(index);
}

function updateVolumeDisplay(volume) {
    const slider = document.getElementById('volume-slider');
    slider.value = volume;
    slider.style.setProperty('--slider-value', volume + '%');
}

/**
 * Actualiza el estado visual del botón mute.
 * El ícono ♪ se pone rojo con resplandor cuando está muteado.
 */
function updateMuteButton(isMuted) {
    const btn = document.getElementById('btn-mute');
    btn.classList.toggle('btn-muted', isMuted);
    btn.title = isMuted ? 'Activar audio (M)' : 'Silenciar (M)';
}

// ===========================
// CARGAR ARCHIVOS DE AUDIO
// ===========================

function loadAudioFiles(files) {
    try {
        musicPlayer.addToPlaylist(files);
        updatePlaylistUI(musicPlayer.getPlaylist());
        showToast(`${files.length} archivo${files.length > 1 ? 's' : ''} cargado${files.length > 1 ? 's' : ''}.`, 'success');
    } catch (e) {
        showToast('Error al cargar archivos: ' + e.message, 'error');
    }
}

// ===========================
// MODALES
// ===========================

function setupModals() {
    // Modal de Música
    const musicModal = document.getElementById('music-modal');
    const btnCloseMusic = document.getElementById('btn-close-modal');

    // Drag & drop setup
    const dropZone = document.getElementById('drop-zone');
    const audioInput = document.getElementById('audio-input');

    // Handle file input change
    audioInput.addEventListener('change', () => {
        if (audioInput.files.length > 0) {
            loadAudioFiles(Array.from(audioInput.files));
            audioInput.value = '';
        }
    });

    // Drag & drop events
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        const files = Array.from(e.dataTransfer.files).filter(f => 
            f.type.startsWith('audio/') || f.name.match(/\.(mp3|wav|ogg|aac|m4a|flac)$/i)
        );
        if (files.length > 0) {
            loadAudioFiles(files);
        } else {
            showToast('Solo se aceptan archivos de audio.', 'error');
        }
    });

    // Cerrar modal de música
    btnCloseMusic.addEventListener('click', () => {
        musicModal.classList.remove('active');
    });

    // Modal de Configuración
    const settingsModal = document.getElementById('settings-modal');
    const btnCloseSettings = document.getElementById('btn-close-settings');

    btnCloseSettings.addEventListener('click', () => {
        settingsModal.classList.remove('active');
    });

    // Configuración del visualizador
    document.getElementById('visualizer-toggle').addEventListener('change', (e) => {
        visualizer.setEnabled(e.target.checked);
        localStorage.setItem('visualizer_enabled', e.target.checked);
    });

    document.getElementById('visualizer-sensitivity').addEventListener('input', (e) => {
        visualizer.setSensitivity(parseFloat(e.target.value));
        document.getElementById('sensitivity-value').textContent = parseFloat(e.target.value).toFixed(1);
        localStorage.setItem('visualizer_sensitivity', e.target.value);
    });

    document.getElementById('visualizer-smoothing').addEventListener('input', (e) => {
        visualizer.setSmoothing(parseFloat(e.target.value));
        document.getElementById('smoothing-value').textContent = parseFloat(e.target.value).toFixed(1);
        localStorage.setItem('visualizer_smoothing', e.target.value);
    });

    // Autoplay
    document.getElementById('autoplay-music').addEventListener('change', (e) => {
        localStorage.setItem('autoplay_music', e.target.checked);
    });

    // Duración de ciclos
    ['setup', 'focus', 'short-break', 'long-break'].forEach(type => {
        const input = document.getElementById(`duration-${type}`);
        input.addEventListener('change', (e) => {
            const cycleType = type.replace('-', '_');
            pomodoro.setDuration(cycleType, parseInt(e.target.value));
        });
    });

    // Reset
    document.getElementById('btn-reset-settings').addEventListener('click', () => {
        if (confirm('¿Restaurar todos los valores por defecto?')) {
            localStorage.clear();
            location.reload();
        }
    });

    // Cerrar modales al hacer click fuera
    [musicModal, settingsModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });

        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.classList.remove('active');
        });
    });
}

function openMusicModal() {
    document.getElementById('music-modal').classList.add('active');
}

function openSettingsModal() {
    document.getElementById('settings-modal').classList.add('active');
}

// ===========================
// CARGAR PREFERENCIAS
// ===========================

function loadUserPreferences() {
    // Volumen
    const volume = localStorage.getItem('music_player_volume');
    if (volume) {
        musicPlayer.setVolume(parseInt(volume));
        document.getElementById('volume-slider').value = volume;
        document.getElementById('volume-slider').style.setProperty('--slider-value', volume + '%');
    } else {
        // Establecer el valor inicial del slider
        const initialVolume = musicPlayer.getVolume();
        document.getElementById('volume-slider').style.setProperty('--slider-value', initialVolume + '%');
    }

    // Visualizador
    const vizEnabled = localStorage.getItem('visualizer_enabled');
    if (vizEnabled !== null) {
        const enabled = vizEnabled === 'true';
        visualizer.setEnabled(enabled);
        document.getElementById('visualizer-toggle').checked = enabled;
    }

    const vizSensitivity = localStorage.getItem('visualizer_sensitivity');
    if (vizSensitivity) {
        visualizer.setSensitivity(parseFloat(vizSensitivity));
        document.getElementById('visualizer-sensitivity').value = vizSensitivity;
        document.getElementById('sensitivity-value').textContent = parseFloat(vizSensitivity).toFixed(1);
    }

    const vizSmoothing = localStorage.getItem('visualizer_smoothing');
    if (vizSmoothing) {
        visualizer.setSmoothing(parseFloat(vizSmoothing));
        document.getElementById('visualizer-smoothing').value = vizSmoothing;
        document.getElementById('smoothing-value').textContent = parseFloat(vizSmoothing).toFixed(1);
    }

    // Duraciones
    const durations = pomodoro.getDurations();
    document.getElementById('duration-setup').value = durations.setup;
    document.getElementById('duration-focus').value = durations.focus;
    document.getElementById('duration-short-break').value = durations.short_break;
    document.getElementById('duration-long-break').value = durations.long_break;

    // Autoplay
    const autoplay = localStorage.getItem('autoplay_music');
    if (autoplay !== null) {
        document.getElementById('autoplay-music').checked = autoplay === 'true';
    }
}

// ===========================
// CARGAR PISTAS DE AUDIO DE PRUEBA
// ===========================

function loadTestAudioTracks() {
    const audioFiles = [
        {
            name: 'The Machine God - Fear and Hunger',
            filename: 'The Machine God｜Fear and Hunger Atmospheric Playlist [GWmtLEIXJdQ].mp3'
        },
        {
            name: 'In the Midst of the Storm',
            filename: 'In the Midst of the Storm..mp3'
        },
        {
            name: 'Lost in a Futuristic City - Cyberpunk',
            filename: 'Lost in a Futuristic City _ Cyberpunk Ambient Music & Neon Megacity 1.50H.mp3'
        }
    ];

    audioFiles.forEach(file => {
        // Codificar solo el nombre del archivo para manejar caracteres especiales
        const encodedPath = 'assets/audio/' + encodeURIComponent(file.filename);

        fetch(encodedPath)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return response.blob();
            })
            .then(blob => {
                const url = URL.createObjectURL(blob);
                musicPlayer.playlist.push({
                    name: file.name,
                    url: url,
                    file: blob
                });
                console.log(`✓ Pista cargada: ${file.name}`);

                if (musicPlayer.onPlaylistUpdate) {
                    musicPlayer.onPlaylistUpdate(musicPlayer.getPlaylist());
                }

                // Toast solo cuando se carga la primera pista
                if (musicPlayer.playlist.length === 1) {
                    showToast('Pistas de muestra cargadas ♪', 'success', 2000);
                }

                // Autoplay si está configurado y es la primera pista
                if (musicPlayer.playlist.length === 1 &&
                    localStorage.getItem('autoplay_music') === 'true') {
                    setTimeout(() => musicPlayer.play(0), 100);
                }
            })
            .catch(e => {
                console.warn(`No se pudo cargar "${file.name}":`, e.message);
            });
    });
}

// ===========================
// LIMPIEZA AL CERRAR
// ===========================

window.addEventListener('beforeunload', () => {
    if (pomodoro) pomodoro.destroy();
    if (musicPlayer) musicPlayer.destroy();
    if (visualizer) visualizer.destroy();
});
