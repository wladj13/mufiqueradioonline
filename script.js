document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const STREAM_URL = "https://server6.globalhostla.com:9422/stream";
    const METADATA_URL = "https://server6.globalhostla.com:9422/status-json.xsl"; // Icecast JSON status

    // --- Elements ---
    const playPauseBtn = document.getElementById('play-pause-btn');
    const playPauseIcon = playPauseBtn.querySelector('i');
    const volumeSlider = document.getElementById('volume-slider');
    const volumeIcon = document.querySelector('.volume-control i');
    const songTitleEl = document.getElementById('song-title');
    const songArtistEl = document.getElementById('song-artist');
    const visualizerCanvas = document.getElementById('visualizer');

    // --- Audio & Visualizer Context ---
    let audio = new Audio();
    audio.crossOrigin = "anonymous"; // Essential for Visualizer CORS
    audio.src = STREAM_URL;
    let isPlaying = false;
    let audioContext, analyser, source;
    let canvasCtx = visualizerCanvas.getContext('2d');

    // --- Functions ---

    // 1. Audio Control
    function togglePlay() {
        // Initialize/Resume AudioContext on user interaction
        if (!audioContext) {
            initVisualizer();
        }

        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }

        if (isPlaying) {
            audio.pause();
            isPlaying = false;
            updatePlayButtonState();
        } else {
            // Reload stream to be "live"
            audio.src = STREAM_URL;
            audio.load();

            audio.play().then(() => {
                isPlaying = true;
                updatePlayButtonState();
                updateMediaSession();
                // Ensure visualizer starts drawing
                if (typeof draw === 'function') requestAnimationFrame(draw);
            }).catch(error => {
                console.error("Error playing audio:", error);
                alert("Conectando con el servidor del Páramo...");
            });
        }
    }

    function updatePlayButtonState() {
        if (isPlaying) {
            playPauseIcon.classList.remove('fa-play');
            playPauseIcon.classList.add('fa-pause');
            playPauseBtn.setAttribute('aria-label', 'Pausar');
        } else {
            playPauseIcon.classList.remove('fa-pause');
            playPauseIcon.classList.add('fa-play');
            playPauseBtn.setAttribute('aria-label', 'Reproducir');
        }
    }

    function setVolume(value) {
        audio.volume = value;
        updateVolumeIcon(value);
    }

    function updateVolumeIcon(value) {
        volumeIcon.className = 'fa-solid';
        if (value == 0) {
            volumeIcon.classList.add('fa-volume-xmark');
        } else if (value < 0.5) {
            volumeIcon.classList.add('fa-volume-low');
        } else {
            volumeIcon.classList.add('fa-volume-high');
        }
    }

    // 2. Audio Visualizer
    let drawRequest;
    function initVisualizer() {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            source = audioContext.createMediaElementSource(audio);

            source.connect(analyser);
            analyser.connect(audioContext.destination);

            analyser.fftSize = 256;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            // DPI Scaling
            const dpr = window.devicePixelRatio || 1;
            const rect = visualizerCanvas.getBoundingClientRect();
            visualizerCanvas.width = rect.width * dpr;
            visualizerCanvas.height = rect.height * dpr;
            canvasCtx.scale(dpr, dpr);

            window.draw = function () {
                if (!isPlaying) {
                    cancelAnimationFrame(drawRequest);
                    return;
                }
                drawRequest = requestAnimationFrame(draw);

                analyser.getByteFrequencyData(dataArray);

                canvasCtx.clearRect(0, 0, rect.width, rect.height);

                const barWidth = (rect.width / bufferLength) * 2.5;
                let barHeight;
                let x = 0;

                for (let i = 0; i < bufferLength; i++) {
                    barHeight = (dataArray[i] / 255) * rect.height;

                    // Neon Emerald Style (#2ecc71)
                    canvasCtx.shadowBlur = 20;
                    canvasCtx.shadowColor = '#2ecc71';
                    canvasCtx.fillStyle = '#2ecc71';

                    canvasCtx.fillRect(x, rect.height - barHeight, barWidth, barHeight);

                    x += barWidth + 1;
                }
            }

            draw();
        } catch (e) {
            console.warn("Visualizer init failed:", e);
        }
    }

    // Media Session for Background Audio
    function updateMediaSession() {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: songTitleEl.textContent,
                artist: songArtistEl.textContent,
                album: 'Mufique Radio',
                artwork: [
                    { src: 'assets/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
                    { src: 'assets/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' }
                ]
            });

            navigator.mediaSession.setActionHandler('play', togglePlay);
            navigator.mediaSession.setActionHandler('pause', togglePlay);
        }
    }

    // 3. Metadata Fetching
    async function fetchMetadata() {
        try {
            // Note: This often fails due to CORS if the shoutcast/icecast server doesn't allow it.
            // Using a timestamp to prevent caching
            const response = await fetch(`${METADATA_URL}?t=${Date.now()}`);
            const data = await response.json();

            if (data && data.icestats && data.icestats.source) {
                // Usually source[0] is the main stream, but logic might need adjustment based on server response structure
                const source = Array.isArray(data.icestats.source) ? data.icestats.source[0] : data.icestats.source;

                if (source && source.title) {
                    processMetadata(source.title);
                }
            }
        } catch (error) {
            console.log("Metadata fetch error (CORS is common):", error);
            // Default text if fetch fails
            // songTitleEl.textContent = "Mufique Radio";
            // songArtistEl.textContent = "La voz de Chachopo";
        }
    }

    function processMetadata(rawTitle) {
        // Shoutcast often sends "Artist - Title" as a single string
        const parts = rawTitle.split(' - ');
        if (parts.length >= 2) {
            songArtistEl.textContent = parts[0];
            songTitleEl.textContent = parts[1];
        } else {
            songTitleEl.textContent = rawTitle;
            songArtistEl.textContent = "Mufique Radio";
        }
    }

    // Poll metadata every 15 seconds
    setInterval(fetchMetadata, 15000);
    fetchMetadata(); // Initial fetch

    // 4. Adaptive Dark Mode (Night Mode)
    function checkTheme() {
        const hour = new Date().getHours();
        const isNight = hour >= 18 || hour < 6; // 6 PM to 6 AM

        if (isNight) {
            document.body.classList.add('night-mode');
        } else {
            document.body.classList.remove('night-mode');
        }
    }

    checkTheme();
    setInterval(checkTheme, 60000); // Check every minute

    // --- Interactivity ---

    // Chat Toggle Logic
    window.toggleChat = function () {
        const chatContainer = document.getElementById('chat-container');
        const icon = document.getElementById('chat-toggle-icon');

        chatContainer.classList.toggle('collapsed');

        if (chatContainer.classList.contains('collapsed')) {
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
        } else {
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        }
    };

    // --- PWA Service Worker ---
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./service-worker.js')
                .then(registration => {
                    console.log('SW Registered:', registration.scope);
                })
                .catch(err => {
                    console.log('SW Registration failed:', err);
                });
        });
    }

    // --- Event Listeners ---
    ['click', 'touchstart'].forEach(evt => {
        playPauseBtn.addEventListener(evt, (e) => {
            if (evt === 'touchstart') e.preventDefault();
            togglePlay();
        }, { passive: false });
    });
    volumeSlider.addEventListener('input', (e) => {
        setVolume(e.target.value);
    });

    // Initialize volume
    setVolume(volumeSlider.value);
});
