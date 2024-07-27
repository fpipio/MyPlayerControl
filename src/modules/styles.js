export const styles = `

.error {
    text-color: red;
}
.error.hidden { display: none; }
.media-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
}
.album-art {
    width: 100px;
    height: 100px;
    object-fit: cover;
    margin-right: 10px;
}
.track-info {
    display: flex;
    flex-direction: column;
    justify-content: center;
    flex-grow: 1;
}
.media-title {
    font-size: 1.2em;
    font-weight: bold;
}

.media-artist {
    font-size: 1em;
    margin-top: 5px;
}

.media-album, {
    font-size: 1em;
}

.media-source-icon {
    width: 24px;
    height: 24px;
    align-self: flex-start;
}
.volume-control {
    margin-top: 10px;
    display: flex;
    align-items: center;
}
.volume-icon {
    cursor: pointer;
    margin-right: 10px;
}
.volume-control input {
    width: 100%;
}
.media-controls {
    margin-top: 10px;
    display: flex;
    justify-content: space-between;
}
.media-controls ha-icon {
    cursor: pointer;
    font-size: 24px;
}

.media-controls .playback-controls {
    display: flex;
    justify-content: space-around;
    flex-grow: 1;
}

.media-controls .extra-controls {
    display: flex;
    gap: 10px;
}

.media-controls .extra-controls ha-icon {
    font-size: 20px; /* Smaller size for repeat and shuffle icons */
}

.progress-control {
    margin-top: 10px;
    display: block;
}

.progress-control input {
    width: 100%;
}

.card-content.loading {
    opacity: 0.5;
    pointer-events: none;
}

`;