/**
 * MUSIC-PLAYER.JS
 * Sistema de reproductor de música local
 */

class MusicPlayer {
    constructor() {
        this.isPlaying = false;
        this.currentTrackIndex = 0;
        this.volume = 70;
        this.isMuted = false;

        // Shuffle and loop
        this.shuffle = false;
        this.loop = false;

        // Alert state tracking
        this.wasPlayingBeforeAlert = false;

        // Elementos de audio
        this.audioElement = new Audio();
        this.audioElement.crossOrigin = 'anonymous';
        this.audioElement.loop = false;
        this.audioElement.volume = this.volume / 100;

        // Playlist local
        this.playlist = [];

        // Callbacks
        this.onPlaylistUpdate = null;
        this.onTrackChange = null;
        this.onStateChange = null;
        this.onAudioSource = null;

        // Event listeners
        this.setupAudioListeners();
        this.loadSettings();
    }

    /**
     * Configura los listeners para el elemento de audio
     */
    setupAudioListeners() {
        this.audioElement.addEventListener('ended', () => {
            this.playNext();
        });

        this.audioElement.addEventListener('play', () => {
            this.isPlaying = true;
            if (this.onStateChange) {
                this.onStateChange('playing');
            }
        });

        this.audioElement.addEventListener('pause', () => {
            this.isPlaying = false;
            if (this.onStateChange) {
                this.onStateChange('paused');
            }
        });

        this.audioElement.addEventListener('error', (e) => {
            console.error('Error de audio:', e.target.error?.code, e.target.error?.message);
            this.isPlaying = false;
            if (this.onStateChange) {
                this.onStateChange('paused');
                this.onStateChange('error', 'Error al reproducir audio. Intenta de nuevo.');
            }
        });
    }

    /**
     * Agrega archivos de audio a la playlist
     */
    addToPlaylist(files) {
        console.log('📂 addToPlaylist() - Procesando', files.length, 'archivos');
        
        for (let file of files) {
            const isAudio = file.type.startsWith('audio/') || 
                           file.name.toLowerCase().match(/\.(mp3|wav|ogg|aac|m4a|flac)$/);
            
            console.log('  📄 Archivo:', file.name, '| Tipo:', file.type, '| Válido:', isAudio);
            
            if (!isAudio) {
                console.warn('  ⚠️  Archivo no es audio:', file.name);
                continue;
            }

            try {
                const url = URL.createObjectURL(file);
                console.log('  ✓ Blob URL creada:', url);
                
                this.playlist.push({
                    name: file.name.replace(/\.[^/.]+$/, ''),
                    url: url,
                    file: file
                });
                
                console.log('  ✅ Agregada a playlist:', file.name);
            } catch (e) {
                console.error('  ❌ Error al crear blob URL:', e);
            }
        }

        if (this.onPlaylistUpdate) {
            console.log('→ Notificando onPlaylistUpdate');
            this.onPlaylistUpdate(this.playlist);
        }

        console.log('✓ Total en playlist:', this.playlist.length, '- Listo para reproducir (esperando clic del usuario)');
    }

    /**
     * Limpia la playlist
     */
    clearPlaylist() {
        this.stop();
        this.playlist = [];
        
        if (this.onPlaylistUpdate) {
            this.onPlaylistUpdate(this.playlist);
        }
    }

    /**
     * Elimina una canción de la playlist
     */
    removeTrack(index) {
        if (index >= 0 && index < this.playlist.length) {
            URL.revokeObjectURL(this.playlist[index].url);
            this.playlist.splice(index, 1);

            if (this.onPlaylistUpdate) {
                this.onPlaylistUpdate(this.playlist);
            }

            if (this.currentTrackIndex === index) {
                if (this.playlist.length > 0) {
                    this.play(Math.min(index, this.playlist.length - 1));
                } else {
                    this.stop();
                }
            } else if (this.currentTrackIndex > index) {
                this.currentTrackIndex--;
            }
        }
    }

    /**
     * Reproduce una canción por índice
     */
    play(index = null) {
        console.log('🎵 play() llamado con index:', index);
        
        if (index !== null && index >= 0 && index < this.playlist.length) {
            this.currentTrackIndex = index;
        }

        if (this.playlist.length === 0) {
            console.error('❌ Playlist vacía - no hay nada que reproducir');
            return;
        }

        const track = this.playlist[this.currentTrackIndex];
        console.log('📀 Track seleccionada:', {
            index: this.currentTrackIndex,
            name: track.name,
            url: track.url ? track.url.substring(0, 50) + '...' : 'NO URL'
        });
        
        if (!track.url) {
            console.error('❌ Track no tiene URL válida');
            return;
        }
        
        this.audioElement.src = track.url;
        console.log('✓ audioElement.src configurado');
        
        const volumeValue = Math.min(1, Math.max(0, this.volume / 100));
        this.audioElement.volume = volumeValue;
        console.log('🔊 Volumen configurado a:', volumeValue, '(', this.volume, '%)');
        
        this.audioElement.currentTime = 0;
        console.log('⏱️  currentTime reset a 0');
        
        if (this.onTrackChange) {
            console.log('→ Llamando onTrackChange');
            this.onTrackChange(this.currentTrackIndex, track.name);
        }

        if (this.onAudioSource) {
            console.log('→ Llamando onAudioSource');
            try {
                this.onAudioSource(this.audioElement);
            } catch (e) {
                console.error('❌ Error en onAudioSource:', e);
            }
        }

        console.log('▶️  Intentando play()...');
        const playPromise = this.audioElement.play();
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log('✅ ¡Reproducción EXITOSA!:', track.name);
                    this.isPlaying = true;
                    if (this.onStateChange) {
                        this.onStateChange('playing');
                    }
                })
                .catch(e => {
                    console.error('❌ ERROR AL REPRODUCIR:', e.message);
                    console.error('   Código de error:', e.name);
                    console.error('   Detalles completos:', e);
                    
                    if (e.name === 'NotAllowedError') {
                        console.warn('⚠️  Autoplay bloqueado. Se requiere interacción del usuario.');
                    } else if (e.name === 'NotSupportedError') {
                        console.warn('⚠️  Formato de audio no soportado:', track.name);
                    } else if (e.name === 'NetworkError') {
                        console.warn('⚠️  Error de red - URL inaccesible');
                    } else {
                        console.warn('⚠️  Error de reproducción:', e.name);
                    }
                    
                    this.isPlaying = false;
                    if (this.onStateChange) {
                        this.onStateChange('paused');
                    }
                });
        } else {
            console.warn('⚠️  play() retornó undefined - elemento no listo');
        }
    }

    /**
     * Reproduce el siguiente tema (respeta shuffle y loop)
     */
    playNext() {
        if (this.playlist.length === 0) return;
        if (this.loop) {
            this.play(this.currentTrackIndex);
            return;
        }
        if (this.shuffle) {
            let nextIndex;
            do {
                nextIndex = Math.floor(Math.random() * this.playlist.length);
            } while (this.playlist.length > 1 && nextIndex === this.currentTrackIndex);
            this.play(nextIndex);
        } else {
            this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playlist.length;
            this.play();
        }
    }

    /**
     * Reproduce la pista anterior
     */
    playPrevious() {
        if (this.playlist.length > 0) {
            this.currentTrackIndex = (this.currentTrackIndex - 1 + this.playlist.length) % this.playlist.length;
            this.play();
        }
    }

    /**
     * Pausa la reproducción
     */
    pause() {
        this.audioElement.pause();
        this.isPlaying = false;
        if (this.onStateChange) {
            this.onStateChange('paused');
        }
    }

    /**
     * Reanuda la reproducción
     */
    resume() {
        if (this.playlist.length > 0) {
            if (this.onAudioSource) {
                try {
                    this.onAudioSource(this.audioElement);
                } catch (e) {
                    console.error('❌ Error en onAudioSource durante resume:', e);
                }
            }

            const playPromise = this.audioElement.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        this.isPlaying = true;
                        if (this.onStateChange) {
                            this.onStateChange('playing');
                        }
                    })
                    .catch(e => {
                        console.error('No se pudo reanudar:', e);
                    });
            }
        }
    }

    /**
     * Detiene la reproducción
     */
    stop() {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
        this.isPlaying = false;
        
        if (this.onStateChange) {
            this.onStateChange('stopped');
        }
    }

    /**
     * Establece el volumen (0-100)
     */
    setVolume(value) {
        this.volume = Math.max(0, Math.min(100, value));
        this.audioElement.volume = this.volume / 100;
        this.isMuted = this.volume === 0;
        this.saveSettings();
    }

    /**
     * Obtiene el volumen actual
     */
    getVolume() {
        return this.volume;
    }

    /**
     * Toggle mute
     */
    toggleMute() {
        if (this.isMuted) {
            this.setVolume(this.volume);
            this.isMuted = false;
        } else {
            this.audioElement.volume = 0;
            this.isMuted = true;
        }
        this.saveSettings();
        return this.isMuted;
    }

    /**
     * Toggle shuffle mode
     */
    toggleShuffle() {
        this.shuffle = !this.shuffle;
        return this.shuffle;
    }

    /**
     * Toggle loop mode (single track)
     */
    toggleLoop() {
        this.loop = !this.loop;
        return this.loop;
    }

    /**
     * Obtiene la playlist actual
     */
    getPlaylist() {
        return this.playlist.map((track, index) => ({
            index: index,
            name: track.name,
            isCurrentTrack: index === this.currentTrackIndex
        }));
    }

    /**
     * Obtiene información del estado actual
     */
    getState() {
        return {
            isPlaying: this.isPlaying,
            currentTrackIndex: this.currentTrackIndex,
            currentTrack: this.playlist[this.currentTrackIndex] || null,
            volume: this.volume,
            isMuted: this.isMuted,
            playlistLength: this.playlist.length,
            shuffle: this.shuffle,
            loop: this.loop
        };
    }

    /**
     * Obtiene el elemento de audio (para visualizadores)
     */
    getAudioElement() {
        return this.audioElement;
    }

    /**
     * Guarda la configuración
     */
    saveSettings() {
        localStorage.setItem('music_player_volume', this.volume);
    }

    /**
     * Carga la configuración
     */
    loadSettings() {
        const volume = localStorage.getItem('music_player_volume');
        if (volume) {
            this.setVolume(parseInt(volume));
        }
    }

    /**
     * Limpia recursos
     */
    destroy() {
        this.stop();
        this.audioElement.src = '';
        
        this.playlist.forEach(track => {
            URL.revokeObjectURL(track.url);
        });
    }
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MusicPlayer;
}
