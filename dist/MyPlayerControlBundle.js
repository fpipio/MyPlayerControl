'use strict';

const styles = `
.error {
    color: red;
    padding: 10px;
    margin-bottom: 10px;
    background-color: #ffeeee;
    border-radius: 4px;
}
.error.hidden { display: none; }

.media-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
}

.album-art {
    width: 120px;
    height: 120px;
    object-fit: cover;
    margin-right: 15px;
    border-radius: 6px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.track-info {
    display: flex;
    flex-direction: column;
    justify-content: center;
    flex-grow: 1;
}

.media-title {
    font-size: 1.3em;
    font-weight: bold;
    margin-bottom: 5px;
}

.media-artist {
    font-size: 1.1em;
    margin-bottom: 3px;
    color: #666;
}

.media-album {
    font-size: 0.9em;
    color: #888;
}

.media-source-icon {
    width: 24px;
    height: 24px;
    align-self: flex-start;
}

.progress-control {
    margin: 20px 0;
    position: relative;
}

.progress-control .progress-bar {
    width: calc(100% - 90px);
    height: 4px;
    background: var(--secondary-background-color, #d3d3d3); /* Grigio chiaro come fallback */
    border-radius: 2px;
    overflow: hidden;
    cursor: pointer;
}

.progress-control .progress-bar-fill {
    height: 100%;
    background-color: var(--primary-color, #4CAF50);
    width: 0%;
    transition: width 0.1s linear;
}

.progress-control input[type="range"] {
    -webkit-appearance: none;
    width: 100%;
    height: 4px;
    position: absolute;
    top: 0;
    left: 0;
    margin: 0;
    padding: 0;
    cursor: pointer;
    opacity: 20%;
    background: black;
}

.progress-control .time-display {
    display: flex;
    justify-content: space-between;
    font-size: 0.8em;
    color: #666;
    margin-top: 7px;
}

.volume-icon {
    cursor: pointer;
    margin-right: 15px;
    color: #666;
}

.volume-control input[type="range"] {
    -webkit-appearance: none;
    width: 100%;
    height: 4px;
    background: #ddd;
    outline: none;
    opacity: 0.7;
    transition: opacity .2s;
    border-radius: 4px;
}

.volume-control input[type="range"]:hover {
    opacity: 1;
}

.volume-control input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 12px;
    height: 12px;
    background: var(--primary-icon-color);
    cursor: pointer;
    border-radius: 50%;
}

.volume-control input[type="range"]::-moz-range-thumb {
    width: 12px;
    height: 12px;
    background: var(--primary-icon-color);
    cursor: pointer;
    border-radius: 50%;
}

.media-controls {
    margin-top: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.media-controls ha-icon {
    cursor: pointer;
    font-size: 28px;
    color: #333;
}

.media-controls .playback-controls {
    display: flex;
    justify-content: center;
    flex-grow: 1;
    gap: 20px;
}

.media-controls .extra-controls {
    display: flex;
    gap: 15px;
}

.media-controls .extra-controls ha-icon {
    font-size: 22px;
    color: #666;
}

.card-content.loading {
    opacity: 0.5;
    pointer-events: none;
}

#progress.seeking {
    opacity: 0.7;
}
`;

class MyPlayerControl extends HTMLElement {
    _config;
    _hass;
    _elements = {};
    progressInterval = null;

    constructor() {
        console.log("constructor()");
        super();
        this.doCard();
        this.doStyle();
        this.doAttach();
        this.doQueryElements();
        this.doListen();
    }

    setConfig(config) {
        console.log("setConfig(config)");
        this._config = config;
        this.doCheckConfig();
        this.doUpdateConfig();
    }

    set hass(hass) {
        console.log("hass(hass)");
        this._hass = hass;
        this.doUpdateHass();
    }

    getEntityID() {
        console.log("getEntityID()");
        const inputTextState = this._hass.states[this._config.entity];
        console.log("inputTextState", inputTextState);
        const entityID = inputTextState ? inputTextState.state : null;
        console.log("Resolved entityID:", entityID);
        return entityID;
    }

    getState() {
        console.log("getState()");
        const entityID = this.getEntityID();
        console.log("entityID", entityID);
        const state = entityID ? this._hass.states[entityID] : null;
        console.log("Full state object:", state);
        return state;
    }

    getAttributes() {
        console.log("getAttributes()");
        const state = this.getState();
        return state ? state.attributes : {};
    }

    getName() {
        console.log("getName()");
        const attributes = this.getAttributes();
        return attributes.friendly_name ? attributes.friendly_name : this.getEntityID();
    }

    onClicked() {
        this.doToggle();
    }

    onVolumeChanged(event) {
        const volume = event.target.value;
        this._hass.callService("media_player", "volume_set", {
            entity_id: this.getEntityID(),
            volume_level: volume / 100
        });
    }

    syncPositionWithServer() {
        this._hass.callService("media_player", "media_seek", {
            entity_id: this.getEntityID(),
            seek_position: this.lastKnownPosition
        }).then(() => {
            console.log("Position synced with server:", this.lastKnownPosition);
            // Aggiorniamo di nuovo l'UI dopo la sincronizzazione per assicurarci che sia allineata
            this._hass.callService("homeassistant", "update_entity", {
                entity_id: this.getEntityID()
            }).then(() => {
                const state = this.getState();
                if (state && state.attributes.media_position !== undefined) {
                    this.lastKnownPosition = state.attributes.media_position;
                    this.updateProgress();
                }
            });
        }).catch(error => {
            console.error("Failed to sync position with server:", error);
        });
    }

    onPlayPause() {
        const state = this.getState();
        const isPlaying = state.state === "playing";
        const service = isPlaying ? "media_pause" : "media_play";
        
        if (isPlaying) {
            // Se stiamo mettendo in pausa, fermiamo immediatamente l'aggiornamento del progresso
            this.stopProgressUpdate();
            this.updateProgress(); // Aggiorna l'UI una volta per riflettere la posizione corrente
        }
        
        this._hass.callService("media_player", service, {
            entity_id: this.getEntityID()
        }).then(() => {
            if (isPlaying) {
                // Se abbiamo messo in pausa, sincronizziamo la posizione con il server
                this.syncPositionWithServer();
            }
            setTimeout(() => {
                this._hass.callService("homeassistant", "update_entity", {
                    entity_id: this.getEntityID()
                }).then(() => {
                    const newState = this.getState();
                    if (newState && newState.state === "playing") {
                        // Se stiamo riprendendo la riproduzione, usiamo la posizione dal server
                        this.lastKnownPosition = newState.attributes.media_position || this.lastKnownPosition;
                        this.playbackStartTime = performance.now();
                        this.startProgressUpdate();
                    }
                    this.doUpdateHass();
                });
            }, 500);
        });
    }

onProgressChanged(event) {
    const progress = parseFloat(event.target.value) / 100;
    console.log("Raw progress:", progress);

    this.updateSeekBarProgress(progress);

    const state = this.getState();
    console.log("Current state:", state);

    if (state && state.attributes.media_duration) {
        const mediaDuration = parseFloat(state.attributes.media_duration);
        console.log("Media duration:", mediaDuration);

        if (isNaN(mediaDuration) || !isFinite(mediaDuration)) {
            console.error("Invalid media duration");
            return;
        }

        const seekPosition = progress * mediaDuration;
        console.log("Calculated seek position:", seekPosition);

        // Arrotondiamo seekPosition a due decimali
        const roundedSeekPosition = Math.round(seekPosition * 100) / 100;
        console.log("Rounded seek position:", roundedSeekPosition);

        clearTimeout(this.seekTimeout);
        this.seekTimeout = setTimeout(() => {
            this._elements.progressSlider.classList.add('seeking');
            this._elements.currentTime.textContent = this.formatTime(roundedSeekPosition);

            console.log("Calling media_seek with position:", roundedSeekPosition);
            this._hass.callService("media_player", "media_seek", {
                entity_id: this.getEntityID(),
                seek_position: roundedSeekPosition
            }).then(() => {
                console.log("Seek successful");
                this.lastKnownPosition = roundedSeekPosition;
                this.playbackStartTime = performance.now();
                this._elements.progressSlider.classList.remove('seeking');
                this.updateProgress();
            }).catch((error) => {
                console.error("Seek failed:", error);
                this._elements.progressSlider.classList.remove('seeking');
                this._elements.error.textContent = "Impossibile impostare la nuova posizione.";
                this._elements.error.classList.remove("hidden");
                setTimeout(() => {
                    this._elements.error.classList.add("hidden");
                }, 3000);
            }).finally(() => {
                this.updateStateAfterDelay();
            });
        }, 250);
    } else {
        console.error("State or media duration not available");
    }
}

    updateStateAfterDelay(delay = 2000) {
        setTimeout(() => {
            this._hass.callService("homeassistant", "update_entity", {
                entity_id: this.getEntityID()
            }).then(() => {
                this.doUpdateHass();
            });
        }, delay);
    }


    onNextTrack() {
        this._hass.callService("media_player", "media_next_track", {
            entity_id: this.getEntityID()
        });
    }

    onPrevTrack() {
        this._hass.callService("media_player", "media_previous_track", {
            entity_id: this.getEntityID()
        });
    }

    onShuffleChanged() {
        const currentShuffle = this.getAttributes().shuffle;
        const newShuffle = !currentShuffle;
        this._hass.callService("media_player", "shuffle_set", {
            entity_id: this.getEntityID(),
            shuffle: newShuffle
        });
    }

    onRepeatChanged() {
        const currentRepeat = this.getAttributes().repeat;
        let newRepeat;
        if (currentRepeat === 'off') {
            newRepeat = 'all';
        } else if (currentRepeat === 'all') {
            newRepeat = 'one';
        } else {
            newRepeat = 'off';
        }
        this._hass.callService("media_player", "repeat_set", {
            entity_id: this.getEntityID(),
            repeat: newRepeat
        });
    }

    onVolumeIconClicked() {
        const isMuted = this.getAttributes().is_volume_muted;
        const newMuteState = !isMuted;
        this._hass.callService("media_player", "volume_mute", {
            entity_id: this.getEntityID(),
            is_volume_muted: newMuteState
        });
    }



    forceUpdate() {
        this._hass.callService("homeassistant", "update_entity", {
            entity_id: this.getEntityID()
        }).then(() => {
            this.doUpdateHass();
        }).catch(error => {
            console.error("Error forcing update:", error);
        });
    }

    isOff() {
        const state = this.getState();
        return state ? state.state === "off" : true;
    }

    isOn() {
        const state = this.getState();
        return state ? state.state === "on" : false;
    }

    getHeader() {
        return this._config.header;
    }

    doCheckConfig() {
        console.log("doCheckConfig()");
        if (!this._config.entity) {
            throw new Error("Please define an entity!");
        }
    }

    doCard() {
        this._elements.card = document.createElement("ha-card");
        this._elements.card.innerHTML = `
            <div class="card-content">
                <p class="error error hidden"></p>
                <div class="media-info">
                    <img class="album-art" src="" alt="Album Art">
                    <div class="track-info">
                        <div class="media-title"></div>
                        <div class="media-artist"></div>
                        <div class="media-album"></div>                        
                    </div>
                    <ha-icon class="media-source-icon"></ha-icon>
                </div>
                <div class="progress-control">
                    <div class="progress-bar">
                        <div class="progress-bar-fill"></div>
                    </div>
                    <input type="range" id="progress" name="progress" min="0" max="100" value="0">
                    <div class="time-display">
                        <span class="current-time">0:00</span> <span class="duration">0:00</span>
                    </div>
                </div>
                <div class="volume-control">
                    <ha-icon id="volume-icon" class="volume-icon" icon="mdi:volume-high"></ha-icon>
                    <input type="range" id="volume" name="volume" min="0" max="100">
                </div>
                <div class="media-controls">
                    <div class="playback-controls">
                        <ha-icon id="prev-track" icon="mdi:skip-previous-outline"></ha-icon>
                        <ha-icon id="play-pause" icon="mdi:play-outline"></ha-icon>
                        <ha-icon id="next-track" icon="mdi:skip-next-outline"></ha-icon>
                    </div>
                    <div class="extra-controls">
                        <ha-icon id="repeat" icon="mdi:repeat-off"></ha-icon>
                        <ha-icon id="shuffle" icon="mdi:shuffle-disabled"></ha-icon>
                    </div>
                </div>
            </div>
        `;
    }

    doStyle() {
        this._elements.style = document.createElement("style");
        this._elements.style.textContent = styles;
    }

    doAttach() {
        console.log("doAttach()");
        this.attachShadow({ mode: "open" });
        this.shadowRoot.append(this._elements.style, this._elements.card);
    }

    doQueryElements() {
        console.log("doQueryElements()");
        const card = this._elements.card;
        this._elements.error = card.querySelector(".error");
        this._elements.albumArt = card.querySelector(".album-art");
        this._elements.mediaTitle = card.querySelector(".media-title");
        this._elements.mediaArtist = card.querySelector(".media-artist");
        this._elements.mediaAlbum = card.querySelector(".media-album");
        this._elements.mediaSourceIcon = card.querySelector(".media-source-icon");
        this._elements.volumeIcon = card.querySelector("#volume-icon");
        this._elements.volumeSlider = card.querySelector("#volume");
        this._elements.playPause = card.querySelector("#play-pause");
        this._elements.nextTrack = card.querySelector("#next-track");
        this._elements.prevTrack = card.querySelector("#prev-track");
        this._elements.shuffle = card.querySelector("#shuffle");
        this._elements.repeat = card.querySelector("#repeat");
        this._elements.progressSlider = card.querySelector("#progress");
        this._elements.currentTime = card.querySelector(".current-time");
        this._elements.duration = card.querySelector(".duration");
        this._elements.progressBar = card.querySelector(".progress-bar-fill");
    }

    doListen() {
        console.log("doListen()");
        this._elements.volumeIcon.addEventListener("click", this.onVolumeIconClicked.bind(this));
        this._elements.volumeSlider.addEventListener("input", this.onVolumeChanged.bind(this));
        this._elements.playPause.addEventListener("click", this.onPlayPause.bind(this));
        this._elements.nextTrack.addEventListener("click", this.onNextTrack.bind(this));
        this._elements.prevTrack.addEventListener("click", this.onPrevTrack.bind(this));
        this._elements.shuffle.addEventListener("click", this.onShuffleChanged.bind(this));
        this._elements.repeat.addEventListener("click", this.onRepeatChanged.bind(this));
        this._elements.progressSlider.addEventListener("input", this.onProgressChanged.bind(this));
    }

    doUpdateConfig() {
        console.log("doUpdateConfig()");
        if (this.getHeader()) {
            this._elements.card.setAttribute("header", this.getHeader());
        } else {
            this._elements.card.removeAttribute("header");
        }
    }

    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return "0:00";
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    lastKnownPosition = 0;
    playbackStartTime = 0;
    isPlaying = false;

    startProgressUpdate() {
        this.stopProgressUpdate();
        this.playbackStartTime = performance.now();
        this.isPlaying = true;
        this.progressInterval = setInterval(() => {
            this.updateProgress();
        }, 100);  // Aggiorna ogni 100ms per una visualizzazione fluida
    }

    stopProgressUpdate() {
        this.isPlaying = false;
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
    }

    updateProgress() {
        const state = this.getState();
        if (state && state.attributes.media_duration) {
            if (this.isPlaying) {
                const now = performance.now();
                const elapsed = (now - this.playbackStartTime) / 1000;
                this.lastKnownPosition += elapsed;
                this.playbackStartTime = now;
            }
    
            if (this.lastKnownPosition > state.attributes.media_duration) {
                this.lastKnownPosition = state.attributes.media_duration;
                this.stopProgressUpdate();
            }
    
            const progress = this.lastKnownPosition / state.attributes.media_duration;
            this._elements.progressSlider.value = progress * 100;
            this.updateSeekBarProgress(progress);
            this._elements.currentTime.textContent = this.formatTime(this.lastKnownPosition);
            this._elements.duration.textContent = this.formatTime(state.attributes.media_duration);
        }
    }

    updateSeekBarProgress(progress) {
        const percent = (progress * 100).toFixed(2);
        this._elements.progressBar.style.width = `${percent}%`;
        console.log("Updated progress bar width:", percent + "%");
    }

    doUpdateHass() {
        const state = this.getState();
        console.log("Stato completo:", state);
        
        if (!state || state.state === "unavailable" || state.state === "idle") {
            console.log("Player non disponibile o inattivo");
            this._elements.error.textContent = `Player ${this.getName()} non disponibile!`;
            this._elements.error.classList.remove("hidden");
            this._elements.card.classList.add("unavailable");
            this._elements.card.querySelector('.media-info').style.display = 'none';
            this._elements.card.querySelector('.progress-control').style.display = 'none';
            this._elements.card.querySelector('.volume-control').style.display = 'none';
            this._elements.card.querySelector('.media-controls').style.display = 'none';
            this.stopProgressUpdate();
            return;
        }
    
        // Ripristina la visualizzazione normale
        this._elements.error.textContent = "";
        this._elements.error.classList.add("hidden");
        this._elements.card.classList.remove("unavailable");
        this._elements.card.querySelector('.media-info').style.display = 'flex';
        this._elements.card.querySelector('.progress-control').style.display = 'block';
        this._elements.card.querySelector('.volume-control').style.display = 'flex';
        this._elements.card.querySelector('.media-controls').style.display = 'flex';
    
        // Aggiorna le informazioni del media
        this._elements.card.classList.add("loading");
        
        if (state.attributes) {
            // Aggiorna album art
            this._elements.albumArt.src = state.attributes.entity_picture || '';
    
            // Aggiorna titolo, artista e album
            this._elements.mediaTitle.textContent = state.attributes.media_title || 'Sconosciuto';
            this._elements.mediaArtist.textContent = state.attributes.media_artist || 'Sconosciuto';
            this._elements.mediaAlbum.textContent = state.attributes.media_album_name || 'Sconosciuto';
    
            // Aggiorna icona della sorgente media
            const mediaContentId = state.attributes.media_content_id;
            if (mediaContentId && typeof mediaContentId === 'string') {
                if (mediaContentId.includes("x-sonos-http")) {
                    this._elements.mediaSourceIcon.setAttribute("icon", "mdi:plex");
                } else if (mediaContentId.includes("x-sonos-spotify")) {
                    this._elements.mediaSourceIcon.setAttribute("icon", "mdi:spotify");
                } else {
                    this._elements.mediaSourceIcon.removeAttribute("icon");
                }
            } else {
                this._elements.mediaSourceIcon.removeAttribute("icon");
            }
    
            // Aggiorna controlli del volume
            const isMuted = state.attributes.is_volume_muted;
            const volumeIcon = isMuted ? "mdi:volume-off" : "mdi:volume-high";
            this._elements.volumeIcon.setAttribute("icon", volumeIcon);
            this._elements.volumeSlider.value = (state.attributes.volume_level || 0) * 100;
    
            // Aggiorna icona play/pause
            const playPauseIcon = state.state === "playing" ? "mdi:pause" : "mdi:play";
            this._elements.playPause.setAttribute("icon", playPauseIcon);
    
            // Aggiorna icona shuffle
            const shuffleIcon = state.attributes.shuffle ? "mdi:shuffle" : "mdi:shuffle-disabled";
            this._elements.shuffle.setAttribute("icon", shuffleIcon);
    
            // Aggiorna icona repeat
            const repeatIconMap = {
                'off': 'mdi:repeat-off',
                'all': 'mdi:repeat',
                'one': 'mdi:repeat-once'
            };
            const repeatIcon = repeatIconMap[state.attributes.repeat] || 'mdi:repeat-off';
            this._elements.repeat.setAttribute("icon", repeatIcon);
    
            // Aggiorna progress slider
            if (state.attributes.media_title !== this._lastKnownTitle || state.state !== "playing") {
                this.lastKnownPosition = state.attributes.media_position || 0;
                this._lastKnownTitle = state.attributes.media_title;
            }
            this.lastUpdateTime = performance.now();
    
            this._elements.card.classList.remove("loading");
        } else {
            console.error("Attributi dello stato non disponibili");
            this._elements.error.textContent = "Impossibile recuperare le informazioni del media";
            this._elements.error.classList.remove("hidden");
        }
    
        // Gestisci l'aggiornamento del progresso
        if (state.state === "playing" && !this.isPlaying) {
            console.log("Starting progress update for playing state");
            this.playbackStartTime = performance.now();
            this.startProgressUpdate();
        } else if (state.state !== "playing" && this.isPlaying) {
            console.log("Stopping progress update for non-playing state");
            this.stopProgressUpdate();
            this.updateProgress(); // Aggiorna l'UI una volta per riflettere lo stato corrente
        }
    }



    doToggle() {
        this._hass.callService("input_boolean", "toggle", {
            entity_id: this.getEntityID(),
        });
    }

    disconnectedCallback() {
        this.stopProgressUpdate();
    }

    static getConfigElement() {
        return document.createElement("toggle-with-graphical-configuration-editor");
    }

    static getStubConfig() {
        return {
            entity: "input_boolean.twgc",
            header: "",
        };
    }
}

class MyPlayerControlEditor extends HTMLElement {
    _config;
    _hass;
    _elements = {};

    constructor() {
        super();
        this.doEditor();
        this.doStyle();
        this.doAttach();
        this.doQueryElements();
        this.doListen();
    }

    setConfig(config) {
        this._config = config;
        this.doUpdateConfig();
    }

    set hass(hass) {
        this._hass = hass;
        this.doUpdateHass();
    }

    onChanged(event) {
        this.doMessageForUpdate(event);
    }

    doEditor() {
        this._elements.editor = document.createElement("form");
        this._elements.editor.innerHTML = `
            <div class="row"><label class="label" for="header">Header:</label><input class="value" id="header"></input></div>
            <div class="row"><label class="label" for="entity">Entity:</label><input class="value" id="entity"></input></div>
        `;
    }

    doStyle() {
        this._elements.style = document.createElement("style");
        this._elements.style.textContent = `
            form {
                display: table;
            }
            .row {
                display: table-row;
            }
            .label, .value {
                display: table-cell;
                padding: 0.5em;
            }
        `;
    }

    doAttach() {
        this.attachShadow({ mode: "open" });
        this.shadowRoot.append(this._elements.style, this._elements.editor);
    }

    doQueryElements() {
        this._elements.header = this._elements.editor.querySelector("#header");
        this._elements.entity = this._elements.editor.querySelector("#entity");
        this._elements.progressBar = this.shadowRoot.querySelector(".progress-bar");
        this._elements.progressBarFill = this.shadowRoot.querySelector(".progress-bar-fill");
    }

    doListen() {
        this._elements.header.addEventListener("focusout", this.onChanged.bind(this));
        this._elements.entity.addEventListener("focusout", this.onChanged.bind(this));
    }

    doUpdateConfig() {
        this._elements.header.value = this._config.header;
        this._elements.entity.value = this._config.entity;
    }

    doMessageForUpdate(changedEvent) {
        const newConfig = Object.assign({}, this._config);
        if (changedEvent.target.id == "header") {
            newConfig.header = changedEvent.target.value;
        } else if (changedEvent.target.id == "entity") {
            newConfig.entity = changedEvent.target.value;
        }
        const messageEvent = new CustomEvent("config-changed", {
            detail: { config: newConfig },
            bubbles: true,
            composed: true,
        });
        this.dispatchEvent(messageEvent);
    }
}

if (!customElements.get('my-player-control')) {
    customElements.define('my-player-control', MyPlayerControl);
}

if (!customElements.get('my-player-control-editor')) {
    customElements.define('my-player-control-editor', MyPlayerControlEditor);
}

window.customCards = window.customCards || [];
window.customCards.push({
    type: "my-player-control",
    name: "My player control",
    description: "My player control (Vanilla JS)",
});
