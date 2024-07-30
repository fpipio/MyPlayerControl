export const styles = `
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