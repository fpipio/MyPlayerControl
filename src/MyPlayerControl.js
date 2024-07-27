import { styles } from './modules/styles.js';


class MyPlayerControl extends HTMLElement {
    _config;
    _hass;
    _elements = {};

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
        return inputTextState ? inputTextState.state : null;
    }

    getState() {
        console.log("getState()");
        const entityID = this.getEntityID();
        console.log("entityID", entityID);
        return entityID ? this._hass.states[entityID] : null;
        const myState = this._hass.states[entityID];
        console.log("myState", myState);
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

    onPlayPause() {
        const state = this.getState().state;
        const service = state === "playing" ? "media_pause" : "media_play";
        this._hass.callService("media_player", service, {
            entity_id: this.getEntityID()
        });
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
    }

    doUpdateConfig() {
        console.log("doUpdateConfig()");
        if (this.getHeader()) {
            this._elements.card.setAttribute("header", this.getHeader());
        } else {
            this._elements.card.removeAttribute("header");
        }
    }

    doUpdateHass() {
        const state = this.getState();
        
        console.log("Stato: ", state);
        if (!state || state.state === "unavailable" || state.state === "idle") {
            console.log("Player non disponibile o inattivo");
            this._elements.error.textContent = `Player ${this.getName()} non disponibile!`;
            this._elements.error.classList.remove("hidden");
            this._elements.card.classList.add("unavailable");
            this._elements.card.querySelector('.media-info').style.display = 'none';
            this._elements.card.querySelector('.volume-control').style.display = 'none';
            this._elements.card.querySelector('.media-controls').style.display = 'none';
            return;
        }
    
        // Ripristina la visualizzazione normale
        this._elements.error.textContent = "";
        this._elements.error.classList.add("hidden");
        this._elements.card.classList.remove("unavailable");
        this._elements.card.querySelector('.media-info').style.display = 'flex';
        this._elements.card.querySelector('.volume-control').style.display = 'flex';
        this._elements.card.querySelector('.media-controls').style.display = 'flex';
    
        // Aggiorna le informazioni del media
        this._elements.card.classList.add("loading");
        
        const updateMediaInfo = () => {
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
    
                this._elements.card.classList.remove("loading");
            } else {
                console.error("Attributi dello stato non disponibili");
                this._elements.error.textContent = "Impossibile recuperare le informazioni del media";
                this._elements.error.classList.remove("hidden");
            }
        };
    
        // Prova ad aggiornare immediatamente, ma prepara anche un retry
        updateMediaInfo();
        setTimeout(() => {
            if (this._elements.card.classList.contains("loading")) {
                console.log("Retry: aggiornamento delle informazioni del media");
                updateMediaInfo();
            }
        }, 1000); // Riprova dopo 1 secondo se ancora in caricamento
    }

    doToggle() {
        this._hass.callService("input_boolean", "toggle", {
            entity_id: this.getEntityID(),
        });
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
